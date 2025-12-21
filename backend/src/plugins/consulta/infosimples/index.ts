// Baseado em: 2.Architecture.md v1.0.3, 4.Entities.md v1.7
// Plugin Consulta Infosimples

import { Plugin, PluginContext, PluginResult } from '../../../core/pluginLoader';
import { InfosimplesConfig, InfosimplesRequest, InfosimplesResponse, NormalizedConsulta, ConsultaInputType } from './types2';
import { defaultConfig, consultaCodes } from './config';

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
    const codes = consultaCodes[type as keyof typeof consultaCodes];
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

  private async callInfosimplesAPI(code: string, data: ConsultaInputType): Promise<InfosimplesResponse> {
    const url = `${this.config.baseUrl}/consultas/${code}`;
    const body: InfosimplesRequest = { code, data };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
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