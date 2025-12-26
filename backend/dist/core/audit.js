"use strict";
// Baseado em: 4.Entities.md v1.1, 6.UserStories.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities → 6.UserStories
// Decisão: Logger de auditoria para compliance e rastreamento (conforme US-012)
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.AuditLogger = void 0;
const appwrite_1 = require("../lib/appwrite");
const appwrite_2 = require("appwrite");
class AuditLogger {
    static instance;
    appwrite = appwrite_1.AppwriteService.getInstance();
    initialized = false;
    constructor() { }
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
            // Gravamos apenas os campos suportados pelo schema atual da collection
            const auditData = {
                tenantId: entry.tenantId || null,
                userId: entry.userId || null,
                action: entry.action,
                resource: entry.resource,
                details: JSON.stringify(entry.details),
                ipAddress: entry.ipAddress,
                timestamp: (entry.timestamp || new Date()).toISOString()
            };
            const created = await this.appwrite.databases.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'audits', 'unique()', auditData);
            console.log('AuditLogger: created audit document', created);
        }
        catch (error) {
            console.error('Failed to log audit entry:', error);
            // Não falhar a operação principal por causa de auditoria
        }
    }
    async getLogs(tenantId, filters = {}) {
        try {
            const queries = [];
            if (tenantId)
                queries.push(appwrite_2.Query.equal('tenantId', tenantId));
            if (filters.userId)
                queries.push(appwrite_2.Query.equal('userId', filters.userId));
            if (filters.action)
                queries.push(appwrite_2.Query.equal('action', filters.action));
            if (filters.resource)
                queries.push(appwrite_2.Query.equal('resource', filters.resource));
            if (filters.startDate)
                queries.push(appwrite_2.Query.greaterThanEqual('timestamp', filters.startDate.toISOString()));
            if (filters.endDate)
                queries.push(appwrite_2.Query.lessThanEqual('timestamp', filters.endDate.toISOString()));
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