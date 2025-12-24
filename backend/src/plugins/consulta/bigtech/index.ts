// Baseado em: 2.Architecture.md v1.0, 4.Entities.md v1.7
// Plugin BigTech - Implementação principal

import { Plugin, PluginContext, PluginResult } from '../../../core/pluginLoader';
import { BigTechConfig, BigTechRequest, BigTechResponse } from './types';
import { defaultConfig, bigTechServices, serviceCategories, servicePrices } from './config';

export class BigTechPlugin implements Plugin {
  id = 'bigtech';
  type: 'consulta' = 'consulta';
  version = '1.0.0';

  private config: BigTechConfig;

  constructor(config?: Partial<BigTechConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Instala o plugin BigTech
   */
  async install(): Promise<void> {
    console.log('🔧 Instalando plugin BigTech...');

    // Validar configuração
    await this.validateConfig();

    console.log('✅ Plugin BigTech instalado com sucesso');
  }

  /**
   * Habilita o plugin para um tenant
   */
  async enable(tenantId: string): Promise<void> {
    console.log(`🔧 Habilitando plugin BigTech para tenant ${tenantId}`);
    // Implementar lógica específica se necessário
  }

  /**
   * Desabilita o plugin para um tenant
   */
  async disable(tenantId: string): Promise<void> {
    console.log(`🔧 Desabilitando plugin BigTech para tenant ${tenantId}`);
    // Implementar lógica específica se necessário
  }

  /**
   * Executa uma consulta BigTech
   */
  async execute(context: PluginContext): Promise<PluginResult> {
    const startTime = Date.now();

    try {
      const { input, config } = context;
      const serviceCode = input.serviceCode || input.service;

      if (!serviceCode) {
        throw new Error('serviceCode é obrigatório');
      }

      // Aplicar rate limiting
      await this.enforceRateLimit();

      // Preparar payload da requisição
      const payload = this.prepareRequestPayload(serviceCode, input);

      // Executar requisição com retry logic
      const response = await this.makeRequestWithRetry(payload);

      // Normalizar resposta
      const normalizedResponse = this.normalizeResponse(serviceCode, response);

      // Calcular custo
      const category = serviceCategories[serviceCode as keyof typeof serviceCategories];
      const cost = servicePrices[category as keyof typeof servicePrices];

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: normalizedResponse,
        cost,
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(`❌ Erro na execução BigTech:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        cost: 0,
      };
    }
  }

  /**
   * Valida a configuração do plugin
   */
  private async validateConfig(): Promise<void> {
    if (!this.config.baseUrl) {
      throw new Error('BigTech: baseUrl é obrigatório na configuração');
    }

    if (this.config.timeout < 1000) {
      throw new Error('BigTech: timeout deve ser pelo menos 1000ms');
    }

    if (this.config.retries < 0) {
      throw new Error('BigTech: retries deve ser >= 0');
    }
  }

  /**
   * Prepara o payload da requisição baseado no serviço
   */
  private prepareRequestPayload(serviceCode: string, input: any): any {
    // Lógica específica para cada serviço baseada na documentação
    switch (serviceCode) {
      // Serviços Cadastrais
      case '320-contatos-por-cep':
        return this.prepareContatosPorCepPayload(input);

      case '327-quod-cadastral-pf':
        return this.prepareQuodCadastralPfPayload(input);

      case '424-validacao-localizacao':
        return this.prepareValidacaoLocalizacaoPayload(input);

      case '431-dados-cnh':
        return this.prepareDadosCnhPayload(input);

      case '36-busca-nome-uf':
        return {
          nome: input.nome,
          uf: input.uf,
          ...input,
        };

      case '411-crlv-ro':
      case '412-crlv-rr':
      case '415-crlv-se':
      case '416-crlv-sp':
        return {
          placa: input.placa,
          ...input,
        };

      default:
        return input;
    }
  }

  /**
   * Prepara payload para serviço 320 - Contatos Por CEP
   */
  private prepareContatosPorCepPayload(input: any): any {
    if (!input.cep) {
      throw new Error('CEP é obrigatório para o serviço 320-Contatos Por CEP');
    }

    // Validar formato do CEP (somente números, 8 dígitos)
    const cepClean = input.cep.replace(/\D/g, '');
    if (cepClean.length !== 8) {
      throw new Error('CEP deve ter exatamente 8 dígitos');
    }

    return {
      CodigoProduto: "1465",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        Cep: cepClean
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 327 - QUOD CADASTRAL PF
   */
  private prepareQuodCadastralPfPayload(input: any): any {
    if (!input.cpfCnpj) {
      throw new Error('CPF/CNPJ é obrigatório para o serviço 327-QUOD CADASTRAL PF');
    }

    if (!input.tipoPessoa || !['F', 'J'].includes(input.tipoPessoa)) {
      throw new Error('TipoPessoa deve ser "F" (física) ou "J" (jurídica)');
    }

    // Validar e limpar CPF/CNPJ
    const documentoClean = input.cpfCnpj.replace(/\D/g, '');
    const expectedLength = input.tipoPessoa === 'F' ? 11 : 14;

    if (documentoClean.length !== expectedLength) {
      throw new Error(`CPF/CNPJ deve ter ${expectedLength} dígitos para pessoa ${input.tipoPessoa === 'F' ? 'física' : 'jurídica'}`);
    }

    return {
      CodigoProduto: "1468",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        TipoPessoa: input.tipoPessoa,
        CPFCNPJ: documentoClean
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 424 - ValidaID - Localizacao
   */
  private prepareValidacaoLocalizacaoPayload(input: any): any {
    if (!input.cpf) {
      throw new Error('CPF é obrigatório para o serviço 424-ValidaID - Localizacao');
    }

    // Validar e limpar CPF
    const cpfClean = input.cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      throw new Error('CPF deve ter exatamente 11 dígitos');
    }

    return {
      CodigoProduto: "1475",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        TipoPessoa: "F",
        CPFCNPJ: cpfClean
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 431 - Dados de CNH
   */
  private prepareDadosCnhPayload(input: any): any {
    if (!input.cpf) {
      throw new Error('CPF é obrigatório para o serviço 431-Dados de CNH');
    }

    // Validar e limpar CPF
    const cpfClean = input.cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      throw new Error('CPF deve ter exatamente 11 dígitos');
    }

    return {
      CodigoProduto: "1476",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        TipoPessoa: "F",
        CPFCNPJ: cpfClean
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Faz requisição HTTP com lógica de retry para a API BigTech
   */
  private async makeRequestWithRetry(payload: any): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch('https://api.consultasbigtech.com.br/json/service.aspx', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BigTech-Plugin/1.0.0',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.retries) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt); // Exponential backoff
          console.warn(`Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Falha após todas as tentativas de retry');
  }

  /**
   * Normaliza a resposta da API BigTech
   */
  private normalizeResponse(serviceCode: string, response: any): any {
    // Verificar se houve erro na resposta
    if (!response.HEADER?.INFORMACOES_RETORNO?.STATUS_RETORNO) {
      throw new Error('Resposta inválida da API BigTech');
    }

    const status = response.HEADER.INFORMACOES_RETORNO.STATUS_RETORNO;

    if (status.CODIGO !== "1") {
      throw new Error(`Consulta falhou: ${status.DESCRICAO}`);
    }

    // Normalizar baseado no serviço
    switch (serviceCode) {
      case '320-contatos-por-cep':
        return this.normalizeContatosPorCepResponse(response);

      case '327-quod-cadastral-pf':
        return this.normalizeQuodCadastralPfResponse(response);

      case '424-validacao-localizacao':
        return this.normalizeValidacaoLocalizacaoResponse(response);

      case '431-dados-cnh':
        return this.normalizeDadosCnhResponse(response);

      default:
        // Para outros serviços, retornar resposta básica normalizada
        return {
          success: true,
          service: serviceCode,
          chaveConsulta: response.HEADER.INFORMACOES_RETORNO.CHAVE_CONSULTA,
          dataHora: response.HEADER.INFORMACOES_RETORNO.DATA_HORA_CONSULTA,
          dados: response
        };
    }
  }

  /**
   * Normaliza resposta do serviço 320 - Contatos Por CEP
   */
  private normalizeContatosPorCepResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '320-contatos-por-cep',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        cep: params.CEP
      },
      dados: {
        enderecoCep: dadosRetornados.ENDERECO_DO_CEP === "1",
        contatos: dadosRetornados.CONTATOS === "1",
        telefones: {
          fixo: dadosRetornados.TELEFONE_FIXO === "1",
          celular: dadosRetornados.TELEFONE_CELULAR === "1",
          comercial: dadosRetornados.TELEFONE_COMERCIAL === "1"
        },
        emails: dadosRetornados.EMAILS === "1",
        residentes: dadosRetornados.RESIDENTES === "1",
        vizinhos: dadosRetornados.VIZINHOS === "1"
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 327 - QUOD CADASTRAL PF
   */
  private normalizeQuodCadastralPfResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '327-quod-cadastral-pf',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        tipoPessoa: params.TIPO_PESSOA,
        cpfCnpj: params.CPFCNPJ
      },
      dados: {
        receitaFederal: dadosRetornados.DADOS_RECEITA_FEDERAL === "1",
        enderecos: dadosRetornados.ENDERECOS === "1",
        telefones: {
          fixo: dadosRetornados.TELEFONE_FIXO === "1",
          celular: dadosRetornados.TELEFONE_CELULAR === "1",
          comercial: dadosRetornados.TELEFONE_COMERCIAL === "1"
        },
        emails: dadosRetornados.EMAILS === "1",
        dadosGerais: dadosRetornados.DADOS_GERAIS === "1",
        ocupacao: dadosRetornados.OCUPACAO_PESSOA_FISICA === "1",
        parentes: dadosRetornados.PARENTES === "1",
        locaisTrabalho: dadosRetornados.LOCAIS_TRABALHO === "1",
        beneficios: dadosRetornados.BENEFICIO === "1",
        infoBusca: dadosRetornados.INFOBUSCA === "1",
        cnh: dadosRetornados.CNH === "1",
        veiculos: dadosRetornados.VEICULOS_POR_DOCUMENTO === "1"
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 424 - ValidaID - Localizacao
   */
  private normalizeValidacaoLocalizacaoResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '424-validacao-localizacao',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        tipoPessoa: params.TIPO_PESSOA,
        cpf: params.CPFCNPJ
      },
      dados: {
        validacaoPessoaFisica: dadosRetornados.VALIDACAO_PESSOA_FISICA === "1",
        validacaoPfBasica: dadosRetornados.VALIDACAO_PF_BASICA === "1",
        validacaoPfBiometriaFace: dadosRetornados.VALIDACAO_PF_BIOMETRIA_FACE === "1",
        validacaoPfCnh: dadosRetornados.VALIDACAO_PF_CNH === "1",
        validacaoPfDocumento: dadosRetornados.VALIDACAO_PF_DOCUMENTO === "1",
        validacaoPfEndereco: dadosRetornados.VALIDACAO_PF_ENDERECO === "1",
        validacaoPfFiliacao: dadosRetornados.VALIDACAO_PF_FILIACAO === "1"
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 431 - Dados de CNH
   */
  private normalizeDadosCnhResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '431-dados-cnh',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        tipoPessoa: params.TIPO_PESSOA,
        cpf: params.CPFCNPJ
      },
      dados: {
        cnh: dadosRetornados.CNH === "1",
        validacaoPfCnh: dadosRetornados.VALIDACAO_PF_CNH === "1",
        renach: dadosRetornados.RENACH === "1"
      },
      rawResponse: response
    };
  }

  /**
   * Aplica rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    // Implementar lógica de rate limiting simples
    // Por enquanto, apenas um delay mínimo
    if (this.config.minRequestInterval > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.minRequestInterval));
    }
  }

  /**
   * Lista todos os serviços disponíveis
   */
  getAvailableServices(): string[] {
    return Object.keys(bigTechServices);
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): BigTechConfig {
    return { ...this.config };
  }
}

// Exportar função de factory para o PluginLoader
export function createBigTechPlugin(config?: Partial<BigTechConfig>) {
  return new BigTechPlugin(config);
}