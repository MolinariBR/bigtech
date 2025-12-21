// Baseado em: 2.Architecture.md v1.0.3, 4.Entities.md v1.7
// Plugin Consulta Infosimples

import { Plugin, PluginContext, PluginResult } from '../../../core/pluginLoader';
import { InfosimplesConfig, InfosimplesRequest, InfosimplesResponse, NormalizedConsulta, ConsultaInputType } from './types2';
import { defaultConfig, consultaCodes, legacyCodes } from './config';

export class InfosimplesPlugin implements Plugin {
  id = 'consulta-infosimples';
  type = 'consulta' as const;
  name = 'Infosimples';
  version = '1.0.0';
  config: InfosimplesConfig;

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

  async execute(context: PluginContext): Promise<PluginResult> {
    const { tenantId, userId, input: contextInput } = context;
    const { type, input } = contextInput as { type: string; input: ConsultaInputType };

    try {
      // Mapear tipo para código Infosimples
      const code = this.getConsultaCode(type, input);
      if (!code) {
        throw new Error(`Tipo de consulta não suportado: ${type}`);
      }

      // Chamar API Infosimples
      const response = await this.callInfosimplesAPI(code, input);

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
    // Mapeamento direto para endpoints da API Infosimples
    const endpointMap: Record<string, string | null> = {
      // Crédito
      'cenprot_protestos_sp': consultaCodes.cenprot_protestos_sp,
      'serasa_score': consultaCodes.serasa_score,
      'boavista_credito': consultaCodes.boavista_credito,
      'scpc_negativacao': consultaCodes.scpc_negativacao,

      // Cadastral
      'receita_federal_cpf': consultaCodes.receita_federal_cpf,
      'receita_federal_cnpj': consultaCodes.receita_federal_cnpj,
      'portal_transparencia_ceis': consultaCodes.portal_transparencia_ceis,
      'portal_transparencia_cepim': consultaCodes.portal_transparencia_cepim,
      'portal_transparencia_cnep': consultaCodes.portal_transparencia_cnep,
      'tse_situacao_eleitoral': consultaCodes.tse_situacao_eleitoral,
      'cnis_pre_inscricao': consultaCodes.cnis_pre_inscricao,
      'dataprev_qualificacao': consultaCodes.dataprev_qualificacao,

      // Veicular
      'serpro_radar_veiculo': consultaCodes.serpro_radar_veiculo,
      'detran_rj_veiculo': consultaCodes.detran_rj_veiculo,
      'detran_rs_veiculo': consultaCodes.detran_rs_veiculo,
      'detran_sp_veiculo': consultaCodes.detran_sp_veiculo,
      'detran_mg_veic_nao_licenciado': consultaCodes.detran_mg_veic_nao_licenciado,
      'detran_mg_multas_extrato': consultaCodes.detran_mg_multas_extrato,
      'detran_mg_trlav': consultaCodes.detran_mg_trlav,

      // Previdenciário
      'dataprev_fap': consultaCodes.dataprev_fap,

      // Endereço
      'correios_cep': consultaCodes.correios_cep,
    };

    const endpoint = endpointMap[type];
    if (!endpoint) {
      // Fallback para códigos legados se não encontrado
      return this.getLegacyCode(type, input);
    }

    return endpoint;
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

  private async callInfosimplesAPI(endpoint: string, data: ConsultaInputType): Promise<InfosimplesResponse> {
    const url = `${this.config.baseUrl}${endpoint}`;

    // Preparar parâmetros de query baseados no endpoint
    const queryParams = new URLSearchParams();

    // Mapeamento de campos baseado no endpoint
    if (endpoint.includes('cenprot-sp/protestos')) {
      if ((data as any).cpf) queryParams.append('cpf', (data as any).cpf);
      if ((data as any).cnpj) queryParams.append('cnpj', (data as any).cnpj);
    } else if (endpoint.includes('receita-federal/cpf')) {
      queryParams.append('cpf', (data as any).cpf);
      queryParams.append('birthdate', (data as any).birthdate);
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

    const finalUrl = `${url}?${queryParams.toString()}`;

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Erro na API Infosimples: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<InfosimplesResponse>;
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
    // Implementar fallback para outras fontes
    // Por simplicidade, retornar erro por enquanto
    const error = originalError instanceof Error ? originalError : new Error(String(originalError));
    return {
      success: false,
      error: `Erro na fonte principal: ${error.message}. Fallback não implementado.`,
      cost: 0,
    };
  }
}

export default InfosimplesPlugin;