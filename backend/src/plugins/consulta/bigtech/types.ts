// Baseado em: 4.Entities.md v1.7, Docs/APIServicosSelecionados.md
// Tipos TypeScript para plugin BigTech

export interface BigTechConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  retryDelayMs: number;
  rateLimitPerMinute: number;
  minRequestInterval: number;
  fallbackSources: string[];
}

export interface BigTechRequest {
  input: Record<string, any>;
  options?: Record<string, any>;
}

export interface BigTechResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    serviceCode: string;
    provider: string;
    duration: number;
    timestamp: string;
  };
}

export interface NormalizedBigTechConsulta {
  serviceCode: string;
  input: Record<string, any>;
  output: Record<string, any>;
  cost: number;
  duration: number;
  timestamp: string;
  status: 'success' | 'error';
}

export type BigTechInputType =
  | 'cep'
  | 'cpf'
  | 'cnpj'
  | 'nome'
  | 'uf'
  | 'placa'
  | 'telefone'
  | 'email'
  | 'cnh';

export interface BigTechService {
  code: string;
  name: string;
  category: 'cadastral' | 'credito' | 'veicular';
  price: number;
  endpoint: string;
  inputTypes: BigTechInputType[];
  description?: string;
}

export interface BigTechField {
  name: string;
  type: BigTechInputType;
  required: boolean;
  label: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

// Interfaces específicas por categoria
export interface BigTechCadastralInput {
  cep?: string;
  cpf?: string;
  cnh?: string;
}

export interface BigTechCreditoInput {
  nome?: string;
  uf?: string;
  cpf?: string;
  cnpj?: string;
}

export interface BigTechVeicularInput {
  placa?: string;
  renavam?: string;
  chassi?: string;
}

export type BigTechServiceInput =
  | BigTechCadastralInput
  | BigTechCreditoInput
  | BigTechVeicularInput;

// Interfaces de resposta específicas
export interface BigTechApiResponse {
  HEADER: {
    INFORMACOES_RETORNO: {
      VERSAO: string;
      STATUS_RETORNO: {
        CODIGO: string;
        DESCRICAO: string;
      };
      CHAVE_CONSULTA: string;
      PRODUTO: string;
      CLIENTE: string;
      DATA_HORA_CONSULTA: string;
      SOLICITANTE?: string;
      TEMPO_RESPOSTA: {
        INICIO: string;
        FINAL: string;
        INTERVALO: string;
      };
    };
    PARAMETROS: Record<string, any>;
    DADOS_RETORNADOS: Record<string, string>;
    CONTROLE: {
      QUANTIDADE_OCORRENCIAS: string;
      OCORRENCIAS: Array<{
        CONTEUDO: string;
        FONTE: string;
        STATUS: string;
      }>;
    };
  };
  CREDCADASTRAL?: Record<string, any>;
  VEICULAR?: Record<string, any>;
}

// Tipos específicos para validação
export interface BigTechValidationRule {
  field: string;
  type: BigTechInputType;
  required: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  customValidator?: (value: any) => boolean;
}

// Mapeamento de validações por serviço
export interface BigTechServiceValidation {
  [serviceCode: string]: BigTechValidationRule[];
}

// Configurações específicas por provedor
export interface BigTechProviderConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  retries: number;
  rateLimit: number;
  supportedServices: string[];
}

// Cache e rate limiting
export interface BigTechCacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
}

export interface BigTechRateLimitEntry {
  tenantId: string;
  serviceCode: string;
  requests: number;
  windowStart: number;
  windowSize: number;
}