// Baseado em: 8.Tests.md v1.0, 4.Entities.md v1.7 (seção 4.8), 7.Tasks.md v1.26
// Precedência: 1.Project → 2.Architecture → 4.Entities → 7.Tasks → 8.Tests
// Decisão: Testes property-based para plugin Asaas, validando processamento seguro de pagamentos conforme regras documentadas

import { test, expect, describe, beforeEach, afterEach } from '@jest/globals';
import fc from 'fast-check';

// Mock do AppwriteService ANTES de qualquer importação
const mockDatabases = {
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  getDocument: jest.fn(),
  listDocuments: jest.fn(),
  deleteDocument: jest.fn()
};

const mockAppwriteInstance = {
  databases: mockDatabases
};

// Mock do axios ANTES de qualquer importação
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Agora importar os módulos após os mocks
import AsaasPlugin, { handleAsaasWebhook } from '../src/plugins/pagamentos/asaas/index';
import { AppwriteService } from '../src/lib/appwrite';
import { Query } from 'node-appwrite';

describe('Plugin Asaas - Testes Property-Based', () => {
  let plugin: typeof AsaasPlugin;
  let getInstanceSpy: jest.SpyInstance;

  beforeEach(() => {
    plugin = AsaasPlugin;
    jest.clearAllMocks();
    
    // Mock do AppwriteService usando spyOn
    getInstanceSpy = jest.spyOn(AppwriteService, 'getInstance').mockReturnValue(mockAppwriteInstance as any);
    
    // Mock das variáveis de ambiente para Asaas
    process.env.ASAAS_API_KEY = 'test-api-key';
    process.env.ASAAS_WEBHOOK_URL = 'https://test-webhook.com';
  });

  afterEach(() => {
    jest.resetAllMocks();
    getInstanceSpy.mockRestore();
  });

  describe('Propriedade 1: Transações únicas - externalTransactionId não permite duplicatas', () => {
    it('Transações com mesmo externalTransactionId são rejeitadas', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.float({ min: 1, max: 10000 }),
          fc.string({ minLength: 10, maxLength: 50 }),
          async (tenantId: string, userId: string, amount: number, externalId: string) => {
            // Limpar mocks para cada execução
            jest.clearAllMocks();
            
            // Arrange
            // Mock: nenhuma transação pending com este externalId (já foi processada)
            mockDatabases.listDocuments.mockResolvedValue({
              documents: [] // Lista vazia - transação já foi processada
            });

            // Act: tentar processar webhook para mesma transação
            await handleAsaasWebhook({
              event: 'PAYMENT_RECEIVED',
              payment: {
                id: externalId,
                customer: 'customer-123',
                value: amount,
                netValue: amount,
                billingType: 'PIX',
                status: 'RECEIVED',
                dueDate: '2024-12-31',
                description: 'Test payment',
                externalReference: `credit_purchase_${userId}_${Date.now()}`
              },
              customer: {
                id: 'customer-123',
                name: 'Test Customer',
                cpfCnpj: '12345678901',
                email: 'test@example.com'
              }
            });

            // Assert: não deve tentar atualizar novamente (não chama updateDocument)
            expect(mockDatabases.updateDocument).not.toHaveBeenCalled();
          }
        )
      );
    });
  });

  describe('Propriedade 2: Rollback em falha - status permanece pending se webhook falha', () => {
    it('Falha no webhook mantém transação como pending', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.float({ min: 1, max: 10000 }),
          fc.string({ minLength: 10, maxLength: 50 }),
          async (tenantId: string, userId: string, amount: number, externalId: string) => {
            // Limpar mocks para cada execução
            jest.clearAllMocks();
            
            // Arrange
            // Mock: transação pending existe
            mockDatabases.listDocuments.mockResolvedValue({
              documents: [{
                $id: 'pending-transaction',
                externalTransactionId: externalId,
                status: 'pending',
                userId,
                creditAmount: Math.floor(amount / 10)
              }]
            });

            // Mock: falha ao atualizar documento (apenas primeira chamada - billing)
            mockDatabases.updateDocument
              .mockRejectedValueOnce(new Error('Database error')) // Falha na atualização do billing
              .mockResolvedValue({}); // Sucesso nas outras chamadas (se houver)

            // Act & Assert: deve lançar erro, mantendo status pending
            await expect(handleAsaasWebhook({
              event: 'PAYMENT_RECEIVED',
              payment: {
                id: externalId,
                customer: 'customer-123',
                value: amount,
                netValue: amount,
                billingType: 'PIX',
                status: 'RECEIVED',
                dueDate: '2024-12-31',
                description: 'Test payment',
                externalReference: `credit_purchase_${userId}_${Date.now()}`
              },
              customer: {
                id: 'customer-123',
                name: 'Test Customer',
                cpfCnpj: '12345678901',
                email: 'test@example.com'
              }
            })).rejects.toThrow('Database error');

            // Verificar que tentou atualizar billing mas falhou
            expect(mockDatabases.updateDocument).toHaveBeenCalledTimes(1);
            expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
              expect.any(String),
              'billing',
              'pending-transaction',
              expect.objectContaining({ status: 'completed' })
            );

            // Verificar que não tentou atualizar créditos (porque billing falhou)
            expect(mockDatabases.getDocument).not.toHaveBeenCalled();
          }
        )
      );
    });
  });

  describe('Propriedade 3: Créditos adicionados apenas após confirmação via webhook', () => {
    it('Webhook de sucesso atualiza créditos corretamente', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.float({ min: 1, max: 10000 }),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          async (tenantId: string, userId: string, amount: number, currentCredits: number, creditAmount: number) => {
            // Arrange
            const externalId = `asaas_${Date.now()}_${Math.random()}`;

            // Mock: transação pending
            mockDatabases.listDocuments.mockResolvedValue({
              documents: [{
                $id: 'transaction-123',
                externalTransactionId: externalId,
                status: 'pending',
                userId,
                creditAmount
              }]
            });

            // Mock: usuário atual
            mockDatabases.getDocument.mockResolvedValue({
              credits: currentCredits
            });

            // Act
            await handleAsaasWebhook({
              event: 'PAYMENT_CONFIRMED',
              payment: {
                id: externalId,
                customer: 'customer-123',
                value: amount,
                netValue: amount,
                billingType: 'PIX',
                status: 'CONFIRMED',
                dueDate: '2024-12-31',
                description: 'Test payment',
                externalReference: `credit_purchase_${userId}_${Date.now()}`
              },
              customer: {
                id: 'customer-123',
                name: 'Test Customer',
                cpfCnpj: '12345678901',
                email: 'test@example.com'
              }
            });

            // Assert: status atualizado para completed
            expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
              expect.any(String),
              'billing',
              'transaction-123',
              expect.objectContaining({ status: 'completed' })
            );

            // Assert: créditos do usuário incrementados
            expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
              expect.any(String),
              'users',
              userId,
              expect.objectContaining({ credits: currentCredits + creditAmount })
            );
          }
        )
      );
    });
  });

  describe('Propriedade 4: Validação de métodos de pagamento suportados', () => {
    it('Métodos de pagamento não suportados são rejeitados', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.float({ min: 1, max: 10000 }),
          fc.constantFrom('crypto', 'bank_transfer', 'cash', 'invalid_method'),
          async (tenantId: string, userId: string, amount: number, invalidMethod: string) => {
            // Limpar mocks para cada execução
            jest.clearAllMocks();
            
            // Mock getTenantConfig para retornar configuração válida
            const mockGetTenantConfig = jest.spyOn(require('../src/plugins/pagamentos/asaas/config'), 'getTenantConfig');
            mockGetTenantConfig.mockResolvedValue({
              apiKey: 'test-api-key',
              webhookUrl: 'https://test-webhook.com',
              environment: 'sandbox' as const,
              defaultPaymentMethods: ['pix', 'boleto', 'credit_card'],
              maxRetries: 3,
              timeout: 30000,
              successUrl: 'http://localhost:3000/success',
              failureUrl: 'http://localhost:3000/failure',
              defaultDueDateDays: 1,
              minAmount: 1.00,
              maxAmount: 10000.00
            });

            // Act: tentar executar plugin com método não suportado
            const result = await AsaasPlugin.execute({
              tenantId,
              userId,
              input: {
                tenantId,
                userId,
                amount,
                creditAmount: Math.floor(amount / 10),
                creditValue: 10,
                paymentMethod: invalidMethod,
                customerDocument: '12345678901',
                customerName: 'Test User',
                customerEmail: 'test@example.com'
              },
              config: {}
            });

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('Método de pagamento não suportado');

            // Limpar spy
            mockGetTenantConfig.mockRestore();
          }
        )
      );
    });
  });

  describe('Propriedade 5: Mapeamento correto de status Asaas para status interno', () => {
    it('Status Asaas são mapeados corretamente para interno', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 50 }),
          fc.constantFrom(
            'PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE', 'REFUNDED',
            'RECEIVED_IN_CASH', 'REFUND_REQUESTED', 'REFUND_IN_PROGRESS'
          ),
          async (externalId: string, asaasStatus: string) => {
            // Limpar mocks para cada execução
            jest.clearAllMocks();
            
            // Arrange
            // Mock transação pending
            mockDatabases.listDocuments.mockResolvedValue({
              documents: [{
                $id: 'transaction-123',
                externalTransactionId: externalId,
                status: 'pending',
                userId: 'user-123',
                creditAmount: 10
              }]
            });

            // Mock usuário
            mockDatabases.getDocument.mockResolvedValue({
              credits: 100
            });

            // Determinar event baseado no status
            let event = 'PAYMENT_UPDATED'; // default
            if (asaasStatus === 'RECEIVED' || asaasStatus === 'CONFIRMED') {
              event = 'PAYMENT_RECEIVED';
            }

            // Act
            await handleAsaasWebhook({
              event,
              payment: {
                id: externalId,
                customer: 'customer-123',
                value: 100,
                netValue: 100,
                billingType: 'PIX',
                status: asaasStatus,
                dueDate: '2024-12-31',
                description: 'Test payment',
                externalReference: 'ref-123'
              },
              customer: {
                id: 'customer-123',
                name: 'Test Customer',
                cpfCnpj: '12345678901',
                email: 'test@example.com'
              }
            });

            // Assert: apenas RECEIVED/CONFIRMED atualizam para completed
            if (asaasStatus === 'RECEIVED' || asaasStatus === 'CONFIRMED') {
              expect(mockDatabases.updateDocument).toHaveBeenCalledWith(
                expect.any(String),
                'billing',
                'transaction-123',
                expect.objectContaining({ status: 'completed' })
              );
            } else {
              // Outros status não devem atualizar billing
              const billingUpdateCalls = mockDatabases.updateDocument.mock.calls.filter(
                call => call[1] === 'billing'
              );
              expect(billingUpdateCalls).toHaveLength(0);
            }
          }
        )
      );
    });
  });
});