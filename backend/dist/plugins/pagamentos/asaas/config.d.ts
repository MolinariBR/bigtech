export interface AsaasPluginConfig {
    apiKey: string;
    webhookUrl: string;
    environment: 'sandbox' | 'production';
    defaultPaymentMethods: ('pix' | 'boleto' | 'credit_card')[];
    maxRetries: number;
    timeout: number;
    successUrl: string;
    failureUrl: string;
    defaultDueDateDays: number;
    minAmount: number;
    maxAmount: number;
    processingFee?: number;
}
export declare const defaultConfig: AsaasPluginConfig;
export declare function validateConfig(config: AsaasPluginConfig): {
    valid: boolean;
    errors: string[];
};
export declare const ASAAS_URLS: {
    readonly sandbox: "https://sandbox.asaas.com/api/v3";
    readonly production: "https://www.asaas.com/api/v3";
};
export declare const PAYMENT_METHOD_MAPPING: {
    readonly pix: "PIX";
    readonly boleto: "BOLETO";
    readonly credit_card: "CREDIT_CARD";
};
export declare const SUPPORTED_WEBHOOK_EVENTS: readonly ["PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_OVERDUE", "PAYMENT_DELETED", "PAYMENT_RESTORED", "PAYMENT_REFUNDED", "PAYMENT_RECEIVED_IN_CASH_UNDONE", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE", "PAYMENT_AWAITING_CHARGEBACK_REVERSAL", "PAYMENT_DUNNING_RECEIVED", "PAYMENT_DUNNING_REQUESTED", "PAYMENT_BANK_SLIP_VIEWED", "PAYMENT_CHECKOUT_VIEWED"];
export declare const PAYMENT_STATUSES: {
    readonly PENDING: "PENDING";
    readonly RECEIVED: "RECEIVED";
    readonly CONFIRMED: "CONFIRMED";
    readonly OVERDUE: "OVERDUE";
    readonly REFUNDED: "REFUNDED";
    readonly RECEIVED_IN_CASH: "RECEIVED_IN_CASH";
    readonly REFUND_REQUESTED: "REFUND_REQUESTED";
    readonly REFUND_IN_PROGRESS: "REFUND_IN_PROGRESS";
    readonly CHARGEBACK_REQUESTED: "CHARGEBACK_REQUESTED";
    readonly CHARGEBACK_DISPUTE: "CHARGEBACK_DISPUTE";
    readonly AWAITING_CHARGEBACK_REVERSAL: "AWAITING_CHARGEBACK_REVERSAL";
    readonly DUNNING_REQUESTED: "DUNNING_REQUESTED";
    readonly DUNNING_RECEIVED: "DUNNING_RECEIVED";
    readonly AWAITING_RISK_ANALYSIS: "AWAITING_RISK_ANALYSIS";
};
export declare function getTenantConfig(tenantId: string): Promise<AsaasPluginConfig>;
export declare function mergeConfig(base: AsaasPluginConfig, override: Partial<AsaasPluginConfig>): AsaasPluginConfig;
//# sourceMappingURL=config.d.ts.map