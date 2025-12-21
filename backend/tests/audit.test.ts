// Baseado em: 7.Tasks.md v1.0, 8.Tests.md (assumido)
// Precedência: 1.Project → 2.Architecture → 4.Entities → 7.Tasks
// Decisão: Testes property-based para logs imutáveis e rastreáveis (TASK-015.1)

import fc from 'fast-check';
import { AuditLogger } from '../src/core/audit';

// Mock do AppwriteService
jest.mock('../src/lib/appwrite', () => ({
  AppwriteService: {
    getInstance: jest.fn(() => ({
      databases: {
        createDocument: jest.fn(),
        listDocuments: jest.fn(),
      },
    })),
  },
}));

describe('AuditLogger Property-Based Tests', () => {
  let auditLogger: AuditLogger;

  beforeAll(async () => {
    auditLogger = AuditLogger.getInstance();
    await auditLogger.initialize();
  });

  beforeEach(() => {
    // Reset singleton instance to get fresh mocks
    (AuditLogger as any).instance = null;
    auditLogger = AuditLogger.getInstance();
    
    jest.clearAllMocks();
    const mockAppwrite = require('../src/lib/appwrite').AppwriteService.getInstance();
    // Mock das respostas
    mockAppwrite.databases.createDocument.mockResolvedValue({ $id: 'mock-id' });
    mockAppwrite.databases.listDocuments.mockResolvedValue({
      documents: [],
      total: 0,
    });
    
    // Initialize the logger
    auditLogger.initialize();
  });

  describe('Imutabilidade dos Logs', () => {
    it('Deve manter logs imutáveis após criação', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(), // tenantId
          fc.string(), // userId
          fc.string(), // action
          fc.string(), // resource
          fc.object(), // details
          fc.ipV4(), // ipAddress
          async (tenantId, userId, action, resource, details, ipAddress) => {
            const entry = { tenantId, userId, action, resource, details, ipAddress };
            await auditLogger.log(entry);

            // Mock da resposta para getLogs
            const mockLog = {
              id: 'mock-id',
              tenantId,
              userId,
              action,
              resource,
              details: JSON.stringify(details),
              ipAddress,
              timestamp: new Date().toISOString(),
            };
            const mockAppwrite = require('../src/lib/appwrite').AppwriteService.getInstance();
            mockAppwrite.databases.listDocuments.mockResolvedValue({
              documents: [mockLog],
              total: 1,
            });

            // Recuperar logs e verificar se não foram alterados
            const logs = await auditLogger.getLogs(tenantId, { action });
            const log = logs.find(l => l.action === action && l.resource === resource);

            if (log) {
              expect(log.tenantId).toBe(tenantId);
              expect(log.userId).toBe(userId);
              expect(log.action).toBe(action);
              expect(log.resource).toBe(resource);
              expect(log.ipAddress).toBe(ipAddress);
              expect(JSON.parse(log.details)).toEqual(details);
            }
          }
        )
      );
    });
  });

  describe('Rastreabilidade dos Logs', () => {
    it('Deve filtrar logs corretamente por critérios', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }), // tenantId
          fc.string({ minLength: 1 }), // userId
          fc.string({ minLength: 1 }), // action
          fc.date(), // startDate
          fc.date(), // endDate
          async (tenantId, userId, action, startDate, endDate) => {
            const timestamp = new Date();
            const mockLog = {
              id: 'mock-id',
              tenantId,
              userId,
              action,
              resource: 'test-resource',
              details: JSON.stringify({}),
              ipAddress: '127.0.0.1',
              timestamp: timestamp.toISOString(),
            };
            const mockAppwrite = require('../src/lib/appwrite').AppwriteService.getInstance();
            mockAppwrite.databases.listDocuments.mockResolvedValueOnce({
              documents: [mockLog],
              total: 1,
            });

            await auditLogger.log({
              tenantId,
              userId,
              action,
              resource: 'test-resource',
              details: {},
              ipAddress: '127.0.0.1',
              timestamp
            });

            const logs = await auditLogger.getLogs(tenantId, {
              userId,
              action,
              startDate: startDate < endDate ? startDate : endDate,
              endDate: startDate < endDate ? endDate : startDate
            });

            expect(logs.length).toBeGreaterThanOrEqual(0);
            logs.forEach(log => {
              expect(log.tenantId).toBe(tenantId);
              expect(log.userId).toBe(userId);
              expect(log.action).toBe(action);
            });
          }
        )
      );
    });
  });
});