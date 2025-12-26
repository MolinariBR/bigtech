interface AuditEntry {
    tenantId?: string;
    userId?: string;
    action: string;
    resource: string;
    details: any;
    ipAddress: string;
    timestamp?: Date;
}
export declare class AuditLogger {
    private static instance;
    private appwrite;
    private initialized;
    private constructor();
    static getInstance(): AuditLogger;
    initialize(): Promise<void>;
    log(entry: AuditEntry): Promise<void>;
    getLogs(tenantId?: string, filters?: {
        userId?: string;
        action?: string;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<any[]>;
}
export declare const auditLogger: AuditLogger;
export {};
//# sourceMappingURL=audit.d.ts.map