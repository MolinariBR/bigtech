// Baseado em: 2.Architecture.md v1.0.2, 3.Structure.md v1.1, 7.Tasks.md v1.9
// Precedência: 1.Project → 2.Architecture → 3.Structure → 7.Tasks
// Decisão: Configurações específicas do plugin Asaas conforme estrutura documentada

export interface AsaasPluginConfig {
  // Configurações da API Asaas
  apiKey: string;
  webhookUrl: string;
  environment: 'sandbox' | 'production';

  // Configurações de negócio
  defaultPaymentMethods: ('pix' | 'boleto' | 'credit_card')[];
  maxRetries: number;
  timeout: number;

  // URLs de callback
  successUrl: string;
  failureUrl: string;

  // Configurações de cobrança
  defaultDueDateDays: number; // Dias para vencimento padrão
  minAmount: number; // Valor mínimo por transação
  maxAmount: number; // Valor máximo por transação

  // Taxas e custos (se aplicável)
  processingFee?: number; // Taxa de processamento em %
}

// Configuração padrão para desenvolvimento
export const defaultConfig: AsaasPluginConfig = {
  apiKey: process.env.ASAAS_API_KEY || '',
  webhookUrl: process.env.ASAAS_WEBHOOK_URL || '',
  environment: (process.env.ASAAS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',

  defaultPaymentMethods: ['pix', 'boleto', 'credit_card'],
  maxRetries: 3,
  timeout: 30000, // 30 segundos

  successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/financeiro/sucesso`,
  failureUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/financeiro/erro`,

  defaultDueDateDays: 1, // Vence em 1 dia
  minAmount: 1.00, // R$ 1,00 mínimo
  maxAmount: 10000.00, // R$ 10.000,00 máximo

  processingFee: 0 // Sem taxa adicional por enquanto
};

// Validações de configuração
export function validateConfig(config: AsaasPluginConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('ASAAS_API_KEY é obrigatório');
  }

  if (!config.webhookUrl) {
    errors.push('webhookUrl é obrigatório');
  }

  if (!['sandbox', 'production'].includes(config.environment)) {
    errors.push('environment deve ser "sandbox" ou "production"');
  }

  if (config.minAmount <= 0) {
    errors.push('minAmount deve ser maior que 0');
  }

  if (config.maxAmount <= config.minAmount) {
    errors.push('maxAmount deve ser maior que minAmount');
  }

  if (config.defaultDueDateDays < 0) {
    errors.push('defaultDueDateDays deve ser maior ou igual a 0');
  }

  if (config.maxRetries < 0) {
    errors.push('maxRetries deve ser maior ou igual a 0');
  }

  if (config.timeout <= 0) {
    errors.push('timeout deve ser maior que 0');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// URLs da API Asaas por ambiente
export const ASAAS_URLS = {
  sandbox: 'https://sandbox.asaas.com/api/v3',
  production: 'https://www.asaas.com/api/v3'
} as const;

// Mapeamento de métodos de pagamento
export const PAYMENT_METHOD_MAPPING = {
  pix: 'PIX',
  boleto: 'BOLETO',
  credit_card: 'CREDIT_CARD'
} as const;

// Eventos de webhook suportados
export const SUPPORTED_WEBHOOK_EVENTS = [
  'PAYMENT_CREATED',
  'PAYMENT_UPDATED',
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'PAYMENT_RESTORED',
  'PAYMENT_REFUNDED',
  'PAYMENT_RECEIVED_IN_CASH_UNDONE',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'PAYMENT_CHARGEBACK_DISPUTE',
  'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
  'PAYMENT_DUNNING_RECEIVED',
  'PAYMENT_DUNNING_REQUESTED',
  'PAYMENT_BANK_SLIP_VIEWED',
  'PAYMENT_CHECKOUT_VIEWED'
] as const;

// Status de pagamento Asaas
export const PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  RECEIVED: 'RECEIVED',
  CONFIRMED: 'CONFIRMED',
  OVERDUE: 'OVERDUE',
  REFUNDED: 'REFUNDED',
  RECEIVED_IN_CASH: 'RECEIVED_IN_CASH',
  REFUND_REQUESTED: 'REFUND_REQUESTED',
  REFUND_IN_PROGRESS: 'REFUND_IN_PROGRESS',
  CHARGEBACK_REQUESTED: 'CHARGEBACK_REQUESTED',
  CHARGEBACK_DISPUTE: 'CHARGEBACK_DISPUTE',
  AWAITING_CHARGEBACK_REVERSAL: 'AWAITING_CHARGEBACK_REVERSAL',
  DUNNING_REQUESTED: 'DUNNING_REQUESTED',
  DUNNING_RECEIVED: 'DUNNING_RECEIVED',
  AWAITING_RISK_ANALYSIS: 'AWAITING_RISK_ANALYSIS'
} as const;

// Função helper para obter configuração do tenant
export async function getTenantConfig(tenantId: string): Promise<AsaasPluginConfig> {
  // Em produção, buscar configuração específica do tenant do banco
  // Por enquanto, retorna configuração padrão
  return defaultConfig;
}

// Função helper para merge de configurações
export function mergeConfig(base: AsaasPluginConfig, override: Partial<AsaasPluginConfig>): AsaasPluginConfig {
  return { ...base, ...override };
}