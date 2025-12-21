// Baseado em: 4.Entities.md v1.1, 6.UserStories.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities → 6.UserStories
// Decisão: Engine genérica de cobrança para consumo de créditos

import { AppwriteService } from '../lib/appwrite';
import { eventBus } from './eventBus';
import { auditLogger } from './audit';

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
}

export const billingEngine = BillingEngine.getInstance();