// Baseado em: 2.Architecture.md v1.0.3, 4.Entities.md v1.7
// Plugin Consulta Infosimples

import { Plugin, PluginContext, PluginResult } from '../../../core/pluginLoader';
import { InfosimplesConfig, InfosimplesRequest, InfosimplesResponse, NormalizedConsulta, ConsultaInputType, ConsultaSchema } from './types2';
import { defaultConfig, consultaCodes, legacyCodes } from './config';
import { OpenApiParser } from '../../../utils/openapiParser';
import * as path from 'path';

export class InfosimplesPlugin implements Plugin {
  id = 'infosimples';
  type = 'consulta' as const;
  name = 'Infosimples';
  version = '1.0.0';
  config: InfosimplesConfig;

  // Cache de schemas para performance
  private schemasCache: ConsultaSchema[] | null = null;

  // Rate limiting
  private requestTimestamps: number[] = [];
  private readonly maxRequestsPerMinute = 10; // Limitar a 10 requisições por minuto
  private readonly minRequestInterval = 6000; // Mínimo 6 segundos entre requisições

  constructor(config?: Partial<InfosimplesConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  async install(): Promise<void> {
    // Validações de instalação
    if (!this.config.apiKey) {
      throw new Error('API key não configurada');
    }
    // Poderia validar conectividade, etc.
  }

  async enable(tenantId: string): Promise<void> {
    // Ativar para tenant específico
    console.log(`Plugin Infosimples habilitado para tenant ${tenantId}`);
  }

  async disable(tenantId: string): Promise<void> {
    // Desativar para tenant
    console.log(`Plugin Infosimples desabilitado para tenant ${tenantId}`);
  }

  private getSchemas(): ConsultaSchema[] {
    if (!this.schemasCache) {
      try {
        const yamlPath = path.join(__dirname, 'infosimples.yaml');
        const parser = new OpenApiParser();
        this.schemasCache = parser.parseFromFile(yamlPath);
      } catch (error) {
        console.error('Erro ao carregar schemas:', error);
        this.schemasCache = [];
      }
    }
    return this.schemasCache;
  }

  private getSchemaForService(serviceId: string): ConsultaSchema | null {
    const schemas = this.getSchemas();
    return schemas.find(s => s.id === serviceId) || null;
  }

  private getEndpointForService(serviceId: string): string | null {
    const schema = this.getSchemaForService(serviceId);
    return schema ? schema.endpoint : null;
  }

  async execute(context: PluginContext): Promise<PluginResult> {
    const { tenantId, userId, input: contextInput, config: contextConfig } = context;
    const { type, input } = contextInput as { type: string; input: ConsultaInputType };

    // Usar config do context se disponível, senão this.config
    const effectiveConfig = contextConfig && Object.keys(contextConfig).length > 0 ? { ...this.config, ...contextConfig } : this.config;

    try {
      // Mapear tipo para código Infosimples
      const code = this.getConsultaCode(type, input);
      if (!code) {
        throw new Error(`Tipo de consulta não suportado: ${type}`);
      }

      // Chamar API Infosimples
      const response = await this.callInfosimplesAPI(code, input, effectiveConfig);

      // Normalizar resposta
      const normalized = this.normalizeResponse(type, input, response);

      return {
        success: true,
        data: normalized,
        cost: this.calculateCost(type),
      };
    } catch (error) {
      // Tentar fallback se configurado
      if (this.config.fallbackSources.length > 0) {
        return this.executeFallback(context, error);
      }

      const err = error instanceof Error ? error : new Error(String(error));
      return {
        success: false,
        error: err.message,
        cost: 0,
      };
    }
  }

  private getConsultaCode(type: string, input: ConsultaInputType): string | null {
    // Buscar endpoint diretamente do schema baseado no serviceId (type)
    const endpoint = this.getEndpointForService(type);
    if (endpoint) {
      return endpoint;
    }

    // Fallback para códigos legados se não encontrado no schema
    return this.getLegacyCode(type, input);
  }

  private getLegacyCode(type: string, input: ConsultaInputType): string | null {
    const codes = legacyCodes[type as keyof typeof legacyCodes];
    if (!codes) return null;

    // Verificar qual propriedade usar baseado no tipo
    switch (type) {
      case 'credito':
      case 'cadastral':
        if ((input as any).cpf) return (codes as any).cpf;
        if ((input as any).cnpj) return (codes as any).cnpj;
        break;
      case 'veicular':
        if ((input as any).placa) return (codes as any).placa;
        break;
    }

    return null;
  }

  private async callInfosimplesAPI(endpoint: string, data: ConsultaInputType, config?: InfosimplesConfig): Promise<InfosimplesResponse> {
    const effectiveConfig = config || this.config;
    const url = `${effectiveConfig.baseUrl}${endpoint}`;

    // Aplicar rate limiting
    await this.applyRateLimiting();

    // Preparar parâmetros de query baseados no schema
    const queryParams = new URLSearchParams();

    // Obter schema para este endpoint
    const serviceId = this.getServiceIdFromEndpoint(endpoint);
    const schema = serviceId ? this.getSchemaForService(serviceId) : null;

    if (schema) {
      // Usar schema dinâmico para mapear campos
      this.buildQueryParamsFromSchema(queryParams, schema, data, effectiveConfig);
    } else {
      // Fallback para mapeamento hardcoded se schema não encontrado
      this.buildQueryParamsFallback(queryParams, endpoint, data, effectiveConfig);
    }

    const finalUrl = url;

    const retries = (effectiveConfig.retries ?? 0);
    const baseDelay = (effectiveConfig.retryDelayMs ?? 200);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), effectiveConfig.timeout);

      try {
        const response = await fetch(finalUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: queryParams.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Tratamento específico para erro 429 (Too Many Requests)
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 30000; // 30 segundos se não especificado
            console.warn(`Erro 429 recebido. Aguardando ${waitTime}ms conforme indicado pela API.`);
            await this.sleep(waitTime);
            // Retry após aguardar
            continue;
          }

          const err = new Error(`Erro na API Infosimples: ${response.status} ${response.statusText}`);
          lastError = err;
          throw err;
        }

        return response.json() as Promise<InfosimplesResponse>;
      } catch (err) {
        clearTimeout(timeoutId);

        const isAbort = err instanceof Error && (err.name === 'AbortError' || /aborted/i.test(err.message));
        lastError = err instanceof Error ? err : new Error(String(err));

        // If there are remaining attempts, wait exponential backoff then retry
        if (attempt < retries) {
          const backoff = Math.floor(baseDelay * Math.pow(2, attempt));
          const jitter = Math.floor(Math.random() * Math.min(100, backoff));
          const waitMs = backoff + jitter;
          console.warn(`Infosimples request failed (attempt ${attempt + 1}/${retries + 1}): ${lastError.message}. Retrying in ${waitMs}ms`);
          await this.sleep(waitMs);
          continue;
        }

        // No more retries, rethrow
        throw lastError;
      }
    }

    throw lastError ?? new Error('Erro desconhecido na chamada Infosimples');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getServiceIdFromEndpoint(endpoint: string): string | null {
    // Extrair serviceId do endpoint (ex: /receita-federal/cpf -> receita_federal_cpf)
    const match = endpoint.match(/^\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return `${match[1]}_${match[2]}`;
    }
    return null;
  }

  private buildQueryParamsFromSchema(
    queryParams: URLSearchParams,
    schema: ConsultaSchema,
    data: ConsultaInputType,
    config: InfosimplesConfig
  ): void {
    // Adicionar campos dinâmicos baseados no schema
    for (const field of schema.form.fields) {
      const fieldName = field.name;
      const fieldValue = (data as any)[fieldName];

      if (fieldValue !== undefined && fieldValue !== null) {
        let processedValue = fieldValue;

        // Aplicar processamento baseado no tipo de campo
        switch (field.type) {
          case 'document.cpf':
            processedValue = String(fieldValue).replace(/\D/g, ''); // Remove máscara
            break;
          case 'document.cnpj':
            processedValue = String(fieldValue).replace(/\D/g, ''); // Remove máscara
            break;
          case 'date.iso':
            processedValue = this.formatBirthdate(String(fieldValue));
            break;
          case 'vehicle.plate':
            processedValue = String(fieldValue).toUpperCase().replace(/[^A-Z0-9]/g, '');
            break;
          default:
            processedValue = String(fieldValue);
        }

        queryParams.append(fieldName, processedValue);
      }
    }

    // Adicionar parâmetros de infraestrutura
    queryParams.append('token', config.apiKey);
    queryParams.append('timeout', '300');
  }

  private buildQueryParamsFallback(
    queryParams: URLSearchParams,
    endpoint: string,
    data: ConsultaInputType,
    config: InfosimplesConfig
  ): void {
    // Fallback para mapeamento hardcoded se schema não encontrado
    if (endpoint.includes('cenprot-sp/protestos')) {
      if ((data as any).cpf) queryParams.append('cpf', (data as any).cpf);
      if ((data as any).cnpj) queryParams.append('cnpj', (data as any).cnpj);
    } else if (endpoint.includes('receita-federal/cpf')) {
      const cpf = (data as any).cpf.replace(/\D/g, ''); // Remove máscara, API exige apenas dígitos
      const formattedBirthdate = this.formatBirthdate((data as any).birthdate);
      queryParams.append('cpf', cpf);
      queryParams.append('birthdate', formattedBirthdate);
      queryParams.append('token', config.apiKey);
      queryParams.append('timeout', '300');
    } else if (endpoint.includes('receita-federal/cnpj')) {
      queryParams.append('cnpj', (data as any).cnpj);
    } else if (endpoint.includes('portal-transparencia')) {
      if ((data as any).cpf) queryParams.append('cpf', (data as any).cpf);
      if ((data as any).cnpj) queryParams.append('cnpj', (data as any).cnpj);
    } else if (endpoint.includes('tse/situacao-eleitoral')) {
      queryParams.append('name', (data as any).name);
      queryParams.append('cpf', (data as any).cpf);
      queryParams.append('titulo_eleitoral', (data as any).titulo_eleitoral);
      queryParams.append('birthdate', (data as any).birthdate);
    } else if (endpoint.includes('serpro/radar-veiculo')) {
      queryParams.append('placa', (data as any).placa);
    } else if (endpoint.includes('correios/cep')) {
      queryParams.append('cep', (data as any).cep);
    } else if (endpoint.includes('cnis/pre-inscricao')) {
      queryParams.append('cpf', (data as any).cpf);
      queryParams.append('nis', (data as any).nis);
      queryParams.append('name', (data as any).name);
      queryParams.append('birthdate', (data as any).birthdate);
    } else if (endpoint.includes('dataprev/fap')) {
      queryParams.append('cnpj_estabelecimento', (data as any).cnpj_estabelecimento);
      if ((data as any).ano_vigencia) queryParams.append('ano_vigencia', (data as any).ano_vigencia);
    } else if (endpoint.includes('dataprev/qualificacao')) {
      queryParams.append('nis', (data as any).nis);
      queryParams.append('name', (data as any).name);
      queryParams.append('birthdate', (data as any).birthdate);
      queryParams.append('cpf', (data as any).cpf);
    } else if (endpoint.includes('detran/rj/veiculo')) {
      queryParams.append('placa', (data as any).placa);
    } else if (endpoint.includes('detran/mg/veic-nao-licenciado')) {
      queryParams.append('placa', (data as any).placa);
      queryParams.append('chassi', (data as any).chassi);
      queryParams.append('renavam', (data as any).renavam);
    } else if (endpoint.includes('detran/mg/multas-extrato')) {
      if ((data as any).placa) queryParams.append('placa', (data as any).placa);
      queryParams.append('renavam', (data as any).renavam);
      queryParams.append('chassi', (data as any).chassi);
    } else if (endpoint.includes('detran/mg/trlav')) {
      queryParams.append('renavam', (data as any).renavam);
      queryParams.append('ano', (data as any).ano || new Date().getFullYear().toString());
    } else if (endpoint.includes('ecrvsp/veiculos/base-sp')) {
      queryParams.append('a3', (data as any).a3);
      queryParams.append('a3_pin', (data as any).a3_pin);
      queryParams.append('login_cpf', (data as any).login_cpf);
      queryParams.append('login_senha', (data as any).login_senha);
      if ((data as any).chassi) queryParams.append('chassi', (data as any).chassi);
      if ((data as any).placa) queryParams.append('placa', (data as any).placa);
      if ((data as any).renavam) queryParams.append('renavam', (data as any).renavam);
    }

    // Adicionar token e timeout se não foram adicionados acima
    if (!queryParams.has('token')) {
      queryParams.append('token', config.apiKey);
    }
    if (!queryParams.has('timeout')) {
      queryParams.append('timeout', '300');
    }
  }

  private async applyRateLimiting(): Promise<void> {
    const now = Date.now();

    // Limpar timestamps antigos (mais de 1 minuto)
    this.requestTimestamps = this.requestTimestamps.filter(timestamp => now - timestamp < 60000);

    // Verificar se excedeu o limite por minuto
    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const oldestRequest = Math.min(...this.requestTimestamps);
      const waitTime = 60000 - (now - oldestRequest);
      if (waitTime > 0) {
        console.warn(`Rate limit atingido. Aguardando ${waitTime}ms antes da próxima requisição.`);
        await this.sleep(waitTime);
        // Recursivamente verificar novamente após aguardar
        return this.applyRateLimiting();
      }
    }

    // Verificar intervalo mínimo entre requisições
    if (this.requestTimestamps.length > 0) {
      const lastRequest = Math.max(...this.requestTimestamps);
      const timeSinceLastRequest = now - lastRequest;
      if (timeSinceLastRequest < this.minRequestInterval) {
        const waitTime = this.minRequestInterval - timeSinceLastRequest;
        console.log(`Aplicando intervalo mínimo. Aguardando ${waitTime}ms.`);
        await this.sleep(waitTime);
      }
    }

    // Registrar esta requisição
    this.requestTimestamps.push(now);
  }

  private normalizeResponse(type: string, input: ConsultaInputType, response: InfosimplesResponse): NormalizedConsulta {
    if (!response.success) {
      return {
        type: type as any,
        input,
        output: {
          status: 'failed',
          normalized: false,
          source: 'infosimples',
          error: response.error,
        },
      };
    }

    // Normalizar dados baseado no tipo
    const normalizedData = this.normalizeData(type, response.data);

    return {
      type: type as any,
      input,
      output: {
        status: 'success',
        data: normalizedData,
        normalized: true,
        source: 'infosimples',
      },
    };
  }

  private normalizeData(type: string, data: any): any {
    // Lógica de normalização para schema consistente
    if (!data) return {};

    switch (type) {
      case 'credito':
        return {
          score: data.score || null,
          restricoes: data.restricoes || [],
          protestos: data.protestos || [],
          processos: data.processos || [],
        };
      case 'cadastral':
        return {
          nome: data.nome || null,
          endereco: data.endereco || null,
          telefones: data.telefones || [],
          situacao: data.situacao || null,
        };
      case 'veicular':
        return {
          proprietario: data.proprietario || null,
          modelo: data.modelo || null,
          ano: data.ano || null,
          restricoes: data.restricoes || [],
          multas: data.multas || [],
        };
      default:
        return data; // Retornar como está se não reconhecido
    }
  }

  private calculateCost(type: string): number {
    // Custos baseados em 9.paginas.md
    const costs = {
      credito: 1.80,
      cadastral: 1.00,
      veicular: 3.00,
    };
    return costs[type as keyof typeof costs] || 0;
  }

  private async executeFallback(context: PluginContext, originalError: unknown): Promise<PluginResult> {
    // Implementar fallback para outras fontes baseado na configuração
    const { input: contextInput } = context;
    const { type, input } = contextInput as { type: string; input: ConsultaInputType };

    let lastFallbackError: Error | null = null;

    for (const fallbackSource of this.config.fallbackSources) {
      try {
        console.log(`Tentando fallback para ${fallbackSource}...`);

        // Implementar lógica de fallback baseada na fonte
        switch (fallbackSource) {
          case 'brasilapi':
            return await this.executeBrasilApiFallback(type, input);
          case 'viacep':
            if ((type === 'cadastral' || type === 'endereco') && (input as any).cep) {
              return await this.executeViaCepFallback(input);
            }
            break;
          default:
            console.warn(`Fonte de fallback não suportada: ${fallbackSource}`);
        }
      } catch (fallbackError) {
        console.error(`Fallback ${fallbackSource} falhou:`, fallbackError);
        lastFallbackError = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
        continue; // Tentar próxima fonte
      }
    }

    // Se nenhum fallback funcionou, retornar erro
    const err = originalError instanceof Error ? originalError : new Error(String(originalError));
    const errorMessage = lastFallbackError
      ? `Erro na fonte principal: ${err.message}. Último fallback falhou: ${lastFallbackError.message}`
      : `Erro na fonte principal: ${err.message}. Todos os fallbacks falharam.`;

    return {
      success: false,
      error: errorMessage,
      cost: 0,
    };
  }

  private async executeBrasilApiFallback(type: string, input: ConsultaInputType): Promise<PluginResult> {
    // Implementar fallback usando BrasilAPI para alguns tipos de consulta
    switch (type) {
      case 'cadastral':
        if ((input as any).cpf) {
          // Fallback para validação básica de CPF
          const isValid = this.validateCpf((input as any).cpf);
          return {
            success: true,
            data: {
              type: 'cadastral',
              input,
              output: {
                status: 'success',
                data: {
                  cpf_valido: isValid,
                  fonte: 'brasilapi-fallback'
                },
                normalized: true,
                source: 'brasilapi'
              }
            },
            cost: 0, // Fallback não tem custo
          };
        }
        break;

      case 'endereco':
        if ((input as any).cep) {
          // Fallback usando ViaCEP (que é gratuito)
          return await this.executeViaCepFallback(input);
        }
        break;
    }

    throw new Error(`Tipo ${type} não suportado pelo fallback BrasilAPI`);
  }

  private async executeViaCepFallback(input: any): Promise<PluginResult> {
    if (!input.cep) {
      throw new Error('CEP é obrigatório para fallback ViaCEP');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`https://viacep.com.br/ws/${input.cep.replace(/\D/g, '')}/json/`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`ViaCEP retornou ${response.status}`);
      }

      const data = await response.json() as any;

      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      return {
        success: true,
        data: {
          type: 'endereco',
          input,
          output: {
            status: 'success',
            data: {
              cep: data.cep,
              logradouro: data.logradouro,
              complemento: data.complemento,
              bairro: data.bairro,
              localidade: data.localidade,
              uf: data.uf,
              ibge: data.ibge,
              gia: data.gia,
              ddd: data.ddd,
              siafi: data.siafi,
              fonte: 'viacep-fallback'
            },
            normalized: true,
            source: 'viacep'
          }
        },
        cost: 0, // ViaCEP é gratuito
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout no fallback ViaCEP');
      }
      throw new Error(`Erro no fallback ViaCEP: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private validateCpf(cpf: string): boolean {
    // Implementar validação básica de CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCpf)) return false; // CPF com todos dígitos iguais

    // Cálculo dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;

    return remainder === parseInt(cleanCpf.charAt(10));
  }

  private inferCategory(endpoint: string): string {
    // Remover prefixo /consultas/ para facilitar a inferência
    const cleanEndpoint = endpoint.replace(/^\/consultas\//, '');

    // Inferir categoria baseada no path do endpoint
    if (cleanEndpoint.includes('receita-federal') || cleanEndpoint.includes('portal-transparencia') ||
        cleanEndpoint.includes('tse') || cleanEndpoint.includes('cnis') || cleanEndpoint.includes('dataprev') ||
        cleanEndpoint.includes('antecedentes-criminais') || cleanEndpoint.includes('antecedentes') ||
        cleanEndpoint.includes('criminal') || cleanEndpoint.includes('policia') || cleanEndpoint.includes('pf') ||
        cleanEndpoint.includes('pj')) {
      return 'cadastral';
    } else if (cleanEndpoint.includes('cenprot') || cleanEndpoint.includes('serasa') ||
               cleanEndpoint.includes('boavista') || cleanEndpoint.includes('scpc') ||
               cleanEndpoint.includes('protesto') || cleanEndpoint.includes('protestos') ||
               cleanEndpoint.includes('credito') || cleanEndpoint.includes('score') ||
               cleanEndpoint.includes('financeiro') || cleanEndpoint.includes('banco') ||
               cleanEndpoint.includes('cartao') || cleanEndpoint.includes('divida')) {
      return 'credito';
    } else if (cleanEndpoint.includes('detran') || cleanEndpoint.includes('serpro') ||
               cleanEndpoint.includes('ecrvsp') || cleanEndpoint.includes('veiculo') ||
               cleanEndpoint.includes('placa') || cleanEndpoint.includes('renavam') ||
               cleanEndpoint.includes('chassi') || cleanEndpoint.includes('multa') ||
               cleanEndpoint.includes('infracao') || cleanEndpoint.includes('transito') ||
               cleanEndpoint.includes('crlv') || cleanEndpoint.includes('dpvat')) {
      return 'veicular';
    } else if (cleanEndpoint.includes('correios') || cleanEndpoint.includes('cep') ||
               cleanEndpoint.includes('endereco') || cleanEndpoint.includes('logradouro')) {
      return 'endereco';
    } else {
      return 'outros';
    }
  }

  private getPriceForCategory(category: string): number {
    // Preços padrão por categoria baseados em 9.paginas.md
    const prices: Record<string, number> = {
      cadastral: 1.00,
      credito: 1.80,
      veicular: 3.00,
      endereco: 0.50,
      outros: 1.00
    };
    return prices[category] || 1.00;
  }

  private getDescriptionFromSummary(title: string): string {
    // Gerar descrição baseada no título do OpenAPI
    const descriptions: Record<string, string> = {
      'Receita Federal / CPF': 'Consulta de dados cadastrais de pessoa física na Receita Federal',
      'CENPROT / Protestos': 'Consulta de protestos em cartório no estado de São Paulo',
      'SERPRO / Radar Veículo': 'Consulta de dados veiculares no sistema SERPRO',
      'DETRAN RJ / Veículo': 'Consulta de veículo no DETRAN Rio de Janeiro',
      'Correios / CEP': 'Consulta de endereço por CEP',
    };

    // Procurar por correspondência parcial
    for (const [key, description] of Object.entries(descriptions)) {
      if (title.includes(key.split(' / ')[0]) || title.includes(key.split(' / ')[1])) {
        return description;
      }
    }

    // Descrição genérica baseada no título
    return `Consulta ${title.toLowerCase()} através da API InfoSimples`;
  }

  private getHardcodedServices(): any[] {
    // Fallback hardcoded se o parser falhar
    const services = [];

    // Crédito
    services.push(
      { id: 'cenprot_protestos_sp', name: 'CENPROT Protestos SP', description: 'Consulta de protestos em cartório no estado de São Paulo', price: 2.50, category: 'credito', active: true },
      { id: 'serasa_score', name: 'Serasa Score', description: 'Consulta de score de crédito Serasa', price: 1.80, category: 'credito', active: true }
    );

    // Cadastral
    services.push(
      { id: 'receita_federal_cpf', name: 'Receita Federal CPF', description: 'Consulta de dados cadastrais na Receita Federal', price: 1.00, category: 'cadastral', active: true },
      { id: 'receita_federal_cnpj', name: 'Receita Federal CNPJ', description: 'Consulta de dados cadastrais de empresa', price: 1.20, category: 'cadastral', active: true }
    );

    // Veicular
    services.push(
      { id: 'serpro_radar_veiculo', name: 'SERPRO Radar Veículo', description: 'Consulta de dados veiculares no SERPRO', price: 3.00, category: 'veicular', active: true },
      { id: 'detran_rj_veiculo', name: 'DETRAN RJ Veículo', description: 'Consulta de veículo no DETRAN Rio de Janeiro', price: 4.50, category: 'veicular', active: true }
    );

    return services;
  }

  private formatBirthdate(birthdate: string): string {
    // Converter para formato ISO se necessário
    // Se já estiver no formato YYYY-MM-DD, retornar como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      return birthdate;
    }

    // Tentar converter de outros formatos para ISO
    try {
      const date = new Date(birthdate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    } catch (error) {
      // Se não conseguir converter, retornar como está
      console.warn(`Não foi possível converter data de nascimento: ${birthdate}`);
    }

    return birthdate;
  }

  async getAvailableServices(): Promise<any[]> {
    try {
      const schemas = this.getSchemas();
      if (schemas.length === 0) {
        console.warn('Nenhum schema encontrado, usando fallback hardcoded');
        return this.getHardcodedServices();
      }

      const services = schemas.map(schema => {
        const category = this.inferCategory(schema.endpoint);
        const price = this.getPriceForCategory(category);
        const description = this.getDescriptionFromSummary(schema.form.title);

        return {
          id: schema.id,
          name: schema.form.title,
          description,
          price,
          category,
          active: true,
          endpoint: schema.endpoint,
          fields: schema.form.fields
        };
      });

      return services;
    } catch (error) {
      console.error('Erro ao obter serviços disponíveis:', error);
      return this.getHardcodedServices();
    }
  }
}

export default InfosimplesPlugin;