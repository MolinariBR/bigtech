"use strict";
// Baseado em: 4.Entities.md v1.1, 6.UserStories.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities → 6.UserStories
// Decisão: Logger de auditoria para compliance e rastreamento (conforme US-012)
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.AuditLogger = void 0;
const appwrite_1 = require("../lib/appwrite");
class AuditLogger {
    constructor() {
        this.appwrite = appwrite_1.AppwriteService.getInstance();
        this.initialized = false;
    }
    static getInstance() {
        if (!AuditLogger.instance) {
            AuditLogger.instance = new AuditLogger();
        }
        return AuditLogger.instance;
    }
    async initialize() {
        if (this.initialized)
            return;
        // Verificar se collection de audit existe
        try {
            await this.appwrite.databases.getCollection(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'audits');
        }
        catch (error) {
            console.warn('Audit collection not found - audit logs will be skipped');
        }
        this.initialized = true;
    }
    async log(entry) {
        if (!this.initialized) {
            console.warn('AuditLogger not initialized - skipping log');
            return;
        }
        try {
            const auditData = {
                tenantId: entry.tenantId,
                userId: entry.userId || null,
                action: entry.action,
                resource: entry.resource,
                details: JSON.stringify(entry.details),
                ipAddress: entry.ipAddress,
                timestamp: entry.timestamp || new Date()
            };
            await this.appwrite.databases.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'audits', 'unique()', auditData);
        }
        catch (error) {
            console.error('Failed to log audit entry:', error);
            // Não falhar a operação principal por causa de auditoria
        }
    }
    async getLogs(tenantId, filters = {}) {
        try {
            const queries = [`tenantId=${tenantId}`];
            if (filters.userId)
                queries.push(`userId=${filters.userId}`);
            if (filters.action)
                queries.push(`action=${filters.action}`);
            if (filters.resource)
                queries.push(`resource=${filters.resource}`);
            if (filters.startDate)
                queries.push(`timestamp>=${filters.startDate.toISOString()}`);
            if (filters.endDate)
                queries.push(`timestamp<=${filters.endDate.toISOString()}`);
            const result = await this.appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'audits', queries);
            return result.documents.slice(0, filters.limit || 100);
        }
        catch (error) {
            console.error('Failed to retrieve audit logs:', error);
            return [];
        }
    }
}
exports.AuditLogger = AuditLogger;
exports.auditLogger = AuditLogger.getInstance();
//# sourceMappingURL=audit.js.map