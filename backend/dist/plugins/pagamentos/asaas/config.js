"use strict";
// Baseado em: 2.Architecture.md v1.0.2, 3.Structure.md v1.1, 7.Tasks.md v1.9
// Precedência: 1.Project → 2.Architecture → 3.Structure → 7.Tasks
// Decisão: Configurações específicas do plugin Asaas conforme estrutura documentada
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_STATUSES = exports.SUPPORTED_WEBHOOK_EVENTS = exports.PAYMENT_METHOD_MAPPING = exports.ASAAS_URLS = exports.defaultConfig = void 0;
exports.validateConfig = validateConfig;
exports.getTenantConfig = getTenantConfig;
exports.mergeConfig = mergeConfig;
// Configuração padrão para desenvolvimento
exports.defaultConfig = {
    apiKey: process.env.ASAAS_API_KEY || '',
    webhookUrl: process.env.ASAAS_WEBHOOK_URL || '',
    environment: process.env.ASAAS_ENVIRONMENT || 'sandbox',
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
function validateConfig(config) {
    const errors = [];
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
exports.ASAAS_URLS = {
    sandbox: 'https://sandbox.asaas.com/api/v3',
    production: 'https://www.asaas.com/api/v3'
};
// Mapeamento de métodos de pagamento
exports.PAYMENT_METHOD_MAPPING = {
    pix: 'PIX',
    boleto: 'BOLETO',
    credit_card: 'CREDIT_CARD'
};
// Eventos de webhook suportados
exports.SUPPORTED_WEBHOOK_EVENTS = [
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
];
// Status de pagamento Asaas
exports.PAYMENT_STATUSES = {
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
};
// Função helper para obter configuração (agora sem tenant)
async function getTenantConfig() {
    // Para single-tenant, sempre retorna configuração padrão
    return exports.defaultConfig;
}
// Função helper para merge de configurações
function mergeConfig(base, override) {
    return { ...base, ...override };
}
//# sourceMappingURL=config.js.map