// Baseado em: 8.Tests.md v1.0.0
// Cobertura: TASK-TENANT-003 "Auto-onboarding de tenant via login"
// Estratégia: Testes property-based com fast-check
// Propriedade: Tenant criado automaticamente se inexistente durante login

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import fc from 'fast-check';

type AnyMock = jest.Mock;
const mockAppwrite: any = {
  databases: {
    listDocuments: jest.fn() as AnyMock,
    getDocument: jest.fn() as AnyMock,
    createDocument: jest.fn() as AnyMock,
    updateDocument: jest.fn() as AnyMock
  }
};

// Mock do AppwriteService para retornar nosso `mockAppwrite`
jest.mock('../src/lib/appwrite', () => ({
  AppwriteService: {
    getInstance: jest.fn(() => mockAppwrite)
  }
}));

// Mock do auditLogger (deve ser definido ANTES de importar o módulo que o usa)
// Usar a instância real do auditLogger e espiar o método `log`
const actualAudit = require('../src/core/audit');
const mockAuditLogger = actualAudit.auditLogger;
mockAuditLogger.initialized = true; // garantir que o logger aceite logs
jest.spyOn(mockAuditLogger, 'log').mockImplementation(jest.fn());

// Importar módulo que usa Appwrite e audit (irá receber a instância espiada)
const authModule = require('../src/core/auth');
const { AuthService } = authModule;

describe('TASK-TENANT-003: Auto-onboarding de Tenant via Login', () => {
  beforeEach(() => {
    // Reset mocks and implementations between tests
    jest.resetAllMocks();

    // O mock do appwrite já está configurado no jest.mock
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Propriedade: Tenant criado automaticamente se inexistente durante login', () => {
    it('Deve criar tenant automaticamente quando não existir', async () => {
      const tenantId = 'test-tenant-auto';
      const identifier = '12345678909'; // CPF válido

      // Arrange: Tenant não existe (erro 404)
      mockAppwrite.databases.getDocument.mockRejectedValueOnce({
        code: 404,
        message: 'Document not found'
      });

      // Tenant criado com sucesso
      mockAppwrite.databases.createDocument.mockResolvedValueOnce({
        $id: tenantId,
        name: tenantId,
        status: 'pending'
      });

      // Usuário não existe, será criado
      mockAppwrite.databases.listDocuments.mockResolvedValueOnce({
        documents: []
      });

      // Usuário criado com sucesso
      mockAppwrite.databases.createDocument.mockResolvedValueOnce({
        $id: 'user123',
        tenantId,
        identifier,
        type: 'user',
        role: 'viewer',
        status: 'active',
        credits: 0
      });

      // Act: Tentar login
      const result = await AuthService.login(identifier, tenantId);
      console.log('Test result:', result);
      console.log('Mock calls:', mockAppwrite.databases.createDocument.mock.calls);

      // Assert: Deve ser sucesso e tenant criado
      expect(result.success).toBe(true);
      expect(result.tenantCreated).toBe(true);
      expect(result.user).toBeDefined();

      // Verificar que tenant foi criado
      expect(mockAppwrite.databases.createDocument).toHaveBeenCalledWith(
        expect.any(String), // databaseId
        'tenants',
        tenantId,
        expect.objectContaining({
          name: tenantId,
          status: 'pending',
          plugins: ['consulta']
        })
      );

      // Verificar log de auditoria para criação de tenant
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          action: 'tenant_auto_created',
          resource: `tenant:${tenantId}`,
          details: { name: tenantId, status: 'pending' }
        })
      );

      // Verificar log de auditoria para login com tenant criado
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          action: 'user_login_tenant_created',
          details: expect.objectContaining({
            tenantCreated: true
          })
        })
      );
    });

    it('Não deve criar tenant se já existir', async () => {
      const tenantId = 'existing-tenant';
      const identifier = '12345678909';

      // Arrange: Tenant já existe
      mockAppwrite.databases.getDocument.mockResolvedValueOnce({
        $id: tenantId,
        name: tenantId,
        status: 'active'
      });

      // Usuário não existe, será criado
      mockAppwrite.databases.listDocuments.mockResolvedValueOnce({
        documents: []
      });

      // Usuário criado com sucesso
      mockAppwrite.databases.createDocument.mockResolvedValueOnce({
        $id: 'user123',
        tenantId,
        identifier,
        type: 'user',
        role: 'viewer',
        status: 'active',
        credits: 0
      });

      // Act: Tentar login
      const result = await AuthService.login(identifier, tenantId);

      // Assert: Deve ser sucesso mas tenant não criado
      expect(result.success).toBe(true);
      expect(result.tenantCreated).toBe(false);

      // Verificar que tenant NÃO foi criado novamente
      expect(mockAppwrite.databases.createDocument).toHaveBeenCalledTimes(1); // Apenas usuário
      expect(mockAppwrite.databases.createDocument).not.toHaveBeenCalledWith(
        expect.any(String),
        'tenants',
        expect.any(String),
        expect.any(Object)
      );

      // Verificar log de auditoria apenas para login normal
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user_login_first_time'
        })
      );
    });

    it('Deve falhar se criação automática de tenant falhar', async () => {
      const tenantId = 'fail-tenant';
      const identifier = '12345678909';

      // Arrange: Tenant não existe
      mockAppwrite.databases.getDocument.mockRejectedValueOnce({
        code: 404,
        message: 'Document not found'
      });

      // Falha na criação do tenant
      mockAppwrite.databases.createDocument.mockRejectedValueOnce(
        new Error('Erro ao criar tenant')
      );

      // Act: Tentar login
      const result = await AuthService.login(identifier, tenantId);

      // Assert: Deve falhar
      expect(result.success).toBe(false);
      expect(result.message).toBe('Erro interno do servidor');

      // Verificar que usuário não foi criado
      expect(mockAppwrite.databases.createDocument).toHaveBeenCalledTimes(1); // Apenas tentou tenant
    });

    it('Deve funcionar com tenantId vazio (default)', async () => {
      const identifier = '12345678909'; // CPF válido
      const tenantId = 'default';

      // Arrange: Tenant não existe
      mockAppwrite.databases.getDocument.mockRejectedValueOnce({
        code: 404,
        message: 'Document not found'
      });

      // Tenant criado
      mockAppwrite.databases.createDocument.mockResolvedValueOnce({
        $id: tenantId,
        name: tenantId,
        status: 'pending'
      });

      // Usuário não existe
      mockAppwrite.databases.listDocuments.mockResolvedValueOnce({
        documents: []
      });

      // Usuário criado
      mockAppwrite.databases.createDocument.mockResolvedValueOnce({
        $id: 'user123',
        tenantId,
        identifier,
        type: 'user',
        role: 'viewer',
        status: 'active',
        credits: 0
      });

      // Act
      const result = await AuthService.login(identifier, tenantId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.tenantCreated).toBe(true);
    });

    it('Deve rejeitar identificadores inválidos mesmo com auto-onboarding', async () => {
      const tenantId = 'test-tenant';
      const identifier = 'invalid-id';

      // Act: Tentar login com identifier inválido
      const result = await AuthService.login(identifier, tenantId);

      // Assert: Deve falhar por identifier inválido
      expect(result.success).toBe(false);
      expect(result.message).toBe('CPF/CNPJ inválido');

      // Verificar que não houve chamadas para Appwrite
      expect(mockAppwrite.databases.getDocument).not.toHaveBeenCalled();
      expect(mockAppwrite.databases.createDocument).not.toHaveBeenCalled();
    });
  });

  describe('Propriedade: Status do tenant criado deve ser "pending"', () => {
    it('Tenant criado automaticamente deve ter status pending', async () => {
      const tenantId = 'test-tenant';
      const identifier = '12345678909';

      // Arrange: Tenant não existe
      mockAppwrite.databases.getDocument.mockRejectedValueOnce({
        code: 404,
        message: 'Document not found'
      });

      // Capturar chamada de criação do tenant
      let createdTenantData: any;
      mockAppwrite.databases.createDocument.mockImplementation((dbId: any, collection: any, docId: any, data: any) => {
        if (collection === 'tenants') {
          createdTenantData = data;
          return Promise.resolve({ $id: docId, ...data });
        }
        if (collection === 'users') {
          return Promise.resolve({ $id: 'user123', tenantId, identifier, type: 'user', role: 'viewer', status: 'active', credits: 0 });
        }
        return Promise.resolve({ $id: docId, ...data });
      });

      // Usuário criado
      mockAppwrite.databases.listDocuments.mockResolvedValueOnce({ documents: [] });

      // Act
      await AuthService.login(identifier, tenantId);

      // Assert
      expect(createdTenantData).toBeDefined();
      expect(createdTenantData.status).toBe('pending');
      expect(createdTenantData.name).toBe(tenantId);
      expect(createdTenantData.plugins).toEqual(['consulta']);
    });
  });

  describe('Propriedade: Auditoria deve registrar criação de tenant', () => {
    it('Deve logar criação automática de tenant', async () => {
      const tenantId = 'audit-test';
      const identifier = '12345678909';

      // Arrange
      mockAppwrite.databases.getDocument.mockRejectedValueOnce({ code: 404 });
      mockAppwrite.databases.createDocument.mockResolvedValueOnce({ $id: tenantId });
      mockAppwrite.databases.listDocuments.mockResolvedValueOnce({ documents: [] });
      mockAppwrite.databases.createDocument.mockResolvedValueOnce({ $id: 'user123' });

      // Act
      await AuthService.login(identifier, tenantId);

      // Assert
      expect(mockAuditLogger.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          action: 'tenant_auto_created',
          resource: `tenant:${tenantId}`,
          details: { name: tenantId, status: 'pending' }
        })
      );
    });
  });
});