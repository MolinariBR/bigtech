// Baseado em: 4.Entities.md v1.7
// Tipos específicos para plugin Infosimples

export interface InfosimplesConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retries?: number;
  retryDelayMs?: number;
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
  type: 'credito' | 'cadastral' | 'veicular' | 'previdenciario' | 'endereco' | 'eleitoral' | 'compliance';
  input: ConsultaInputType;
  output: {
    status: 'success' | 'failed';
    data?: any;
    normalized: boolean;
    source: 'infosimples';
    error?: string;
  };
}

export type ConsultaInputType = {
  // Crédito
  cpf?: string;
  cnpj?: string;

  // Cadastral adicional
  birthdate?: string;
  name?: string;
  titulo_eleitoral?: string;
  nis?: string;

  // Veicular
  placa?: string;
  renavam?: string;
  chassi?: string;
  ano?: string;

  // Previdenciário
  cnpj_estabelecimento?: string;
  ano_vigencia?: string;

  // Endereço
  cep?: string;

  // Autenticação ECRVSP
  a3?: string;
  a3_pin?: string;
  login_cpf?: string;
  login_senha?: string;
};

// Interfaces para parser OpenAPI dinâmico
export interface ConsultaSchema {
  id: string;
  provider: 'infosimples';
  method: 'POST';
  endpoint: string;
  form: {
    title: string;
    submit_label: string;
    fields: Field[];
  };
}

export interface Field {
  name: string;
  type: string; // 'document.cpf', 'date.iso', etc.
  required: boolean;
  label?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}