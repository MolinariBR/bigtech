interface BillingTransaction {
    tenantId: string;
    userId?: string;
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
    private userLocks;
    private runWithUserLock;
    private normalizeAmount;
    private getISOWeekKey;
    private constructor();
    static getInstance(): BillingEngine;
    initialize(): Promise<void>;
    private setupEventListeners;
    debitCredits(transaction: BillingTransaction): Promise<BillingResult>;
    creditPurchase(transaction: BillingTransaction): Promise<BillingResult>;
    getBalance(userId: string): Promise<number>;
    getTransactionHistory(userId: string, limit?: number): Promise<any[]>;
    listBillings(filters: {
        tenantId?: string;
        from?: string;
        to?: string;
        type?: string;
        status?: string;
        page?: number;
        perPage?: number;
    }): Promise<{
        total: number;
        page: number;
        perPage: number;
        items: import("node-appwrite").Models.DefaultDocument[];
    }>;
    aggregateBillings(filters: {
        tenantId?: string;
        from?: string;
        to?: string;
        granularity?: 'day' | 'week' | 'month';
        metrics?: string[];
    }): Promise<{
        series: {
            key: string;
            sum: number;
            avg: number;
            count: number;
        }[];
    }>;
    refundTransaction(billingId: string, amount?: number, reason?: string, auditMeta?: {
        tenantId: string;
        userId?: string;
        auditId?: string;
    }): Promise<{
        success: boolean;
        error: string;
        refundId?: undefined;
    } | {
        success: boolean;
        refundId: string;
        error?: undefined;
    }>;
    getBillingStats(): Promise<{
        totalRevenue: number;
        totalTransactions: number;
        pendingAmount: number;
        refundedAmount: number;
        monthlyRevenue: number;
    }>;
}
export declare const billingEngine: BillingEngine;
export {};
//# sourceMappingURL=billingEngine.d.ts.map