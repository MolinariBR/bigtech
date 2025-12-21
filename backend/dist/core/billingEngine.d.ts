interface BillingTransaction {
    tenantId: string;
    userId: string;
    type: 'credit_purchase' | 'query_debit' | 'refund';
    amount: number;
    currency: string;
    pluginId?: string;
    consultaId?: string;
    description?: string;
}
interface BillingResult {
    success: boolean;
    transactionId?: string;
    error?: string;
}
export declare class BillingEngine {
    private static instance;
    private appwrite;
    private constructor();
    static getInstance(): BillingEngine;
    initialize(): Promise<void>;
    private setupEventListeners;
    debitCredits(transaction: BillingTransaction): Promise<BillingResult>;
    creditPurchase(transaction: BillingTransaction): Promise<BillingResult>;
    getBalance(userId: string): Promise<number>;
    getTransactionHistory(userId: string, limit?: number): Promise<any[]>;
}
export declare const billingEngine: BillingEngine;
export {};
//# sourceMappingURL=billingEngine.d.ts.map