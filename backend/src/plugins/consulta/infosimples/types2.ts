// Baseado em: 4.Entities.md v1.7
// Tipos específicos para plugin Infosimples

export interface InfosimplesConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  fallbackSources: string[];
}

export interface InfosimplesRequest {
  code: string; // Código da consulta, ex.: "39-TeleConfirma"
  data: Record<string, any>; // Dados de entrada, ex.: { cpf: "12345678900" }
}

export interface InfosimplesResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface NormalizedConsulta {
  type: 'credito' | 'cadastral' | 'veicular';
  input: {
    cpf?: string;
    cnpj?: string;
    placa?: string;
  };
  output: {
    status: 'success' | 'failed';
    data?: any;
    normalized: boolean;
    source: 'infosimples';
    error?: string;
  };
}

export type ConsultaInputType = {
  cpf?: string;
  cnpj?: string;
  placa?: string;
};