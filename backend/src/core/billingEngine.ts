// Baseado em: 4.Entities.md v1.1, 6.UserStories.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities → 6.UserStories
// Decisão: Engine genérica de cobrança para consumo de créditos

import { AppwriteService } from '../lib/appwrite';
import { eventBus } from './eventBus';
import { auditLogger } from './audit';

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

export class BillingEngine {
  private static instance: BillingEngine;
  private appwrite = AppwriteService.getInstance();

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): BillingEngine {
    if (!BillingEngine.instance) {
      BillingEngine.instance = new BillingEngine();
    }
    return BillingEngine.instance;
  }

  async initialize(): Promise<void> {
    console.log('💰 Billing Engine initialized');
  }

  private setupEventListeners(): void {
    // Escutar eventos de consumo
    eventBus.subscribe('query.executed', async (event) => {
      if (event.payload.cost && event.payload.cost > 0) {
        await this.debitCredits({
          tenantId: event.tenantId,
          userId: event.userId,
          type: 'query_debit',
          amount: -event.payload.cost,
          currency: 'BRL',
          consultaId: event.payload.consultaId,
          description: `Consulta ${event.payload.type}`
        });
      }
    });

    eventBus.subscribe('credits.purchased', async (event) => {
      await this.creditPurchase({
        tenantId: event.tenantId,
        userId: event.userId,
        type: 'credit_purchase',
        amount: event.payload.amount,
        currency: 'BRL',
        pluginId: event.payload.pluginId,
        description: 'Compra de créditos'
      });
    });
  }

  async debitCredits(transaction: BillingTransaction): Promise<BillingResult> {
    try {
      if (!transaction.userId) {
        return { success: false, error: 'Missing userId for debit' };
      }
      // Verificar saldo do usuário
      const user = await this.appwrite.databases.getDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        transaction.userId
      );

      if (user.credits + transaction.amount < 0) {
        return {
          success: false,
          error: 'Saldo insuficiente'
        };
      }

      // Criar transação
      const billingData = {
        tenantId: transaction.tenantId,
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        pluginId: transaction.pluginId || null,
        consultaId: transaction.consultaId || null,
        status: 'completed',
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const billingDoc = await this.appwrite.databases.createDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'billings',
        'unique()',
        billingData
      );

      // Atualizar saldo do usuário
      await this.appwrite.databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        transaction.userId,
        {
          credits: user.credits + transaction.amount,
          updatedAt: new Date().toISOString()
        }
      );

      // Log de auditoria
      await auditLogger.log({
        tenantId: transaction.tenantId,
        userId: transaction.userId,
        action: 'billing_debit',
        resource: `billing:${billingDoc.$id}`,
        details: {
          amount: transaction.amount,
          type: transaction.type,
          newBalance: user.credits + transaction.amount
        },
        ipAddress: 'system'
      });

      return {
        success: true,
        transactionId: billingDoc.$id
      };

    } catch (error) {
      console.error('Billing debit error:', error);
      return {
        success: false,
        error: 'Erro ao processar débito'
      };
    }
  }

  async creditPurchase(transaction: BillingTransaction): Promise<BillingResult> {
    try {
      if (!transaction.userId) {
        return { success: false, error: 'Missing userId for credit purchase' };
      }
      // Criar transação
      const billingData = {
        tenantId: transaction.tenantId,
        userId: transaction.userId,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        pluginId: transaction.pluginId || null,
        consultaId: null,
        status: 'completed',
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const billingDoc = await this.appwrite.databases.createDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'billings',
        'unique()',
        billingData
      );

      // Atualizar saldo do usuário
      const user = await this.appwrite.databases.getDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        transaction.userId
      );

      await this.appwrite.databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        transaction.userId,
        {
          credits: user.credits + transaction.amount,
          updatedAt: new Date().toISOString()
        }
      );

      // Log de auditoria
      await auditLogger.log({
        tenantId: transaction.tenantId,
        userId: transaction.userId,
        action: 'billing_credit',
        resource: `billing:${billingDoc.$id}`,
        details: {
          amount: transaction.amount,
          type: transaction.type,
          newBalance: user.credits + transaction.amount
        },
        ipAddress: 'system'
      });

      return {
        success: true,
        transactionId: billingDoc.$id
      };

    } catch (error) {
      console.error('Billing credit error:', error);
      return {
        success: false,
        error: 'Erro ao processar crédito'
      };
    }
  }

  async getBalance(userId: string): Promise<number> {
    try {
      const user = await this.appwrite.databases.getDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        userId
      );
      return user.credits || 0;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  async getTransactionHistory(
    userId: string,
    limit = 50
  ): Promise<any[]> {
    try {
      const result = await this.appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'billings',
        [`userId=${userId}`]
      );

      return result.documents
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  async listBillings(filters: { tenantId?: string; from?: string; to?: string; type?: string; status?: string; page?: number; perPage?: number }) {
    try {
      const queries: string[] = [];
      if (filters.tenantId) queries.push(`tenantId=${filters.tenantId}`);
      if (filters.type) queries.push(`type=${filters.type}`);
      if (filters.status) queries.push(`status=${filters.status}`);
      // Note: Appwrite supports range queries; for simplicity we'll filter client-side after list

      const result = await this.appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'billings',
        queries
      );

      let docs = result.documents || [];

      if (filters.from) docs = docs.filter((d: any) => new Date(d.createdAt) >= new Date(filters.from!));
      if (filters.to) docs = docs.filter((d: any) => new Date(d.createdAt) <= new Date(filters.to!));

      const page = filters.page || 1;
      const perPage = filters.perPage || 50;
      const total = docs.length;
      const items = docs.slice((page - 1) * perPage, page * perPage);

      return { total, page, perPage, items };
    } catch (error) {
      console.error('Error listing billings:', error);
      return { total: 0, page: 1, perPage: 50, items: [] };
    }
  }

  async aggregateBillings(filters: { tenantId?: string; from?: string; to?: string; granularity?: 'day' | 'week' | 'month'; metrics?: string[] }) {
    try {
      const res = await this.listBillings(filters as any);
      const items = res.items || [];

      // Simple aggregation by day/week/month using createdAt
      const groups: Record<string, any[]> = {};

      items.forEach((it: any) => {
        const d = new Date(it.createdAt);
        let key = d.toISOString().slice(0, 10); // day
        if (filters.granularity === 'week') {
          const week = `${d.getUTCFullYear()}-W${Math.ceil((d.getUTCDate() - d.getUTCDay() + 1) / 7)}`;
          key = week;
        } else if (filters.granularity === 'month') {
          key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        }
        groups[key] = groups[key] || [];
        groups[key].push(it);
      });

      const series = Object.keys(groups).sort().map((k) => {
        const arr = groups[k];
        const sum = arr.reduce((s: number, x: any) => s + (Number(x.amount) || 0), 0);
        const avg = arr.length ? sum / arr.length : 0;
        const count = arr.length;
        return { key: k, sum, avg, count };
      });

      return { series };
    } catch (error) {
      console.error('Error aggregating billings:', error);
      return { series: [] };
    }
  }

  async refundTransaction(billingId: string, amount?: number, reason?: string, auditMeta?: { tenantId: string; userId?: string; auditId?: string }) {
    try {
      // Buscar transação original
      const original = await this.appwrite.databases.getDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'billings',
        billingId
      );

      if (!original) return { success: false, error: 'Original transaction not found' };

      const refundAmount = amount ? Number(amount) : Number(original.amount) * -1;

      const refundDoc = await this.appwrite.databases.createDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'billings',
        'unique()',
        {
          tenantId: original.tenantId,
          userId: original.userId || null,
          type: 'refund',
          amount: refundAmount,
          currency: original.currency || 'BRL',
          pluginId: original.pluginId || null,
          consultaId: original.consultaId || null,
          status: 'refunded',
          processedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          referenceId: `refund_${billingId}`,
          reason: reason || null
        }
      );

      // Atualizar status da transação original
      await this.appwrite.databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'billings',
        billingId,
        { status: 'refunded', updatedAt: new Date().toISOString() }
      );

      // Ajustar saldo do usuário (creditar de volta)
      if (original.userId) {
        const user = await this.appwrite.databases.getDocument(
          process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
          'users',
          original.userId
        );

        await this.appwrite.databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
          'users',
          original.userId,
          { credits: (user.credits || 0) + Math.abs(Number(refundAmount)), updatedAt: new Date().toISOString() }
        );
      }

      // Audit
      await auditLogger.log({
        tenantId: original.tenantId,
        userId: auditMeta?.userId,
        action: 'billing_refund',
        resource: `billing:${billingId}`,
        details: { refundDocId: refundDoc.$id, amount: refundAmount, reason },
        ipAddress: 'system'
      });

      // Emit event
      await eventBus.publish({ tenantId: original.tenantId, userId: original.userId, type: 'billing.refund.initiated', payload: { billingId, refundId: refundDoc.$id } });

      return { success: true, refundId: refundDoc.$id };
    } catch (error) {
      console.error('Refund error:', error);
      return { success: false, error: 'Erro ao processar reembolso' };
    }
  }
}

export const billingEngine = BillingEngine.getInstance();