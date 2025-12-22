// Baseado em: 4.Entities.md v1.1, 6.UserStories.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities → 6.UserStories
// Decisão: Logger de auditoria para compliance e rastreamento (conforme US-012)

import { AppwriteService } from '../lib/appwrite';
import { Query } from 'appwrite';

interface AuditEntry {
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  details: any;
  ipAddress: string;
  timestamp?: Date;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private appwrite = AppwriteService.getInstance();
  private initialized = false;

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Verificar se collection de audit existe
    try {
      await this.appwrite.databases.getCollection(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'audits'
      );
    } catch (error) {
      console.warn('Audit collection not found - audit logs will be skipped');
    }

    this.initialized = true;
  }

  async log(entry: AuditEntry): Promise<void> {
    if (!this.initialized) {
      console.warn('AuditLogger not initialized - skipping log');
      return;
    }

    try {
      // Gravamos apenas os campos suportados pelo schema atual da collection
      const auditData = {
        tenantId: entry.tenantId,
        userId: entry.userId || null,
        action: entry.action,
        resource: entry.resource,
        details: JSON.stringify(entry.details),
        ipAddress: entry.ipAddress,
        timestamp: (entry.timestamp || new Date()).toISOString()
      };

      const created = await this.appwrite.databases.createDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'audits',
        'unique()',
        auditData
      );
      console.log('AuditLogger: created audit document', created);
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Não falhar a operação principal por causa de auditoria
    }
  }

  async getLogs(
    tenantId: string,
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    try {
      const queries = [Query.equal('tenantId', tenantId)];

      if (filters.userId) queries.push(Query.equal('userId', filters.userId));
      if (filters.action) queries.push(Query.equal('action', filters.action));
      if (filters.resource) queries.push(Query.equal('resource', filters.resource));
      if (filters.startDate) queries.push(Query.greaterThanEqual('timestamp', filters.startDate.toISOString()));
      if (filters.endDate) queries.push(Query.lessThanEqual('timestamp', filters.endDate.toISOString()));

      const result = await this.appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'audits',
        queries
      );

      return result.documents.slice(0, filters.limit || 100);
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return [];
    }
  }
}

export const auditLogger = AuditLogger.getInstance();