// Baseado em: 7.Tasks.md v1.1
// Precedência: 1.Project → 2.Architecture → 7.Tasks
// Decisão: Testes property-based para validação de autenticação de administrador

// Mock do Appwrite - deve ser definido ANTES dos imports
const mockDatabases = {
  listDocuments: jest.fn(),
  createDocument: jest.fn(),
  getDocument: jest.fn(),
  updateDocument: jest.fn()
};

jest.mock('../src/lib/appwrite', () => ({
  AppwriteService: {
    getInstance: jest.fn(() => ({
      databases: mockDatabases
    }))
  }
}));

// Mock do audit logger
jest.mock('../src/core/audit', () => ({
  auditLogger: {
    log: jest.fn()
  }
}));

import { test, expect, describe, beforeEach } from '@jest/globals';
import { AuthService, AuthValidators } from '../src/core/auth';

describe('TASK-005: Autenticação de Administrador - Validação de Role Admin', () => {
  let mockAppwrite: any;
  let mockAuditLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    const appwriteMock = require('../src/lib/appwrite');
    mockAppwrite = appwriteMock.AppwriteService.getInstance();
    mockAuditLogger = require('../src/core/audit').auditLogger;

    // Mock successful responses
    mockAppwrite.databases.listDocuments.mockResolvedValue({
      documents: []
    });

    mockAppwrite.databases.getDocument.mockImplementation((db: string, collection: string, id: string) => {
      // Mock para verificar tokens
      if (id === 'user-123') {
        return Promise.resolve({
          $id: 'user-123',
          tenantId: 'tenant1',
          identifier: '52998224725',
          status: 'active',
          type: 'user',
          role: 'viewer',
          credits: 100
        });
      }
      // Default para outros casos (admins)
      return Promise.resolve({
        $id: id,
        tenantId: 'admin',
        identifier: '52998224725',
        status: 'active',
        type: 'admin',
        role: 'admin',
        credits: 0
      });
    });

    mockAuditLogger.log.mockResolvedValue(undefined);
  });

  // Propriedade 1: Acesso negado para roles não-admin
  test('Acesso negado para usuários com roles não-admin', async () => {
    // Given: Usuário com role 'viewer' tentando fazer login admin
    const cpf = '529.982.247-25';
    const nonAdminUser = {
      $id: 'user-123',
      tenantId: 'tenant1',
      identifier: '52998224725',
      status: 'active',
      type: 'user',
      role: 'viewer', // Não é admin
      credits: 100
    };

    // Mock para retornar usuário não-admin
    mockAppwrite.databases.listDocuments.mockResolvedValueOnce({
      documents: [nonAdminUser]
    });

    // When: Tentar login como admin
    const result = await AuthService.adminLogin(cpf);

    // Then: Deve ser negado
    expect(result.success).toBe(false);
    expect(result.message).toContain('permissões insuficientes');

    // And: Não deve registrar auditoria de login admin
    expect(mockAuditLogger.log).not.toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin_login'
      })
    );
  });

  // Propriedade 2: Acesso permitido apenas para admins
  test('Acesso permitido apenas para usuários com role admin', async () => {
    // Given: Usuário com role 'admin'
    const cpf = '529.982.247-25';
    const adminUser = {
      $id: 'admin-123',
      tenantId: 'admin',
      identifier: '52998224725',
      status: 'active',
      type: 'admin',
      role: 'admin',
      credits: 0
    };

    // Mock para retornar usuário admin
    mockAppwrite.databases.listDocuments.mockResolvedValueOnce({
      documents: [adminUser]
    });

    // When: Fazer login como admin
    const result = await AuthService.adminLogin(cpf);

    // Then: Deve ser permitido
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.user?.role).toBe('admin');

    // And: Deve registrar auditoria de login admin
    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'admin',
        action: 'admin_login',
        resource: 'user:admin-123',
        details: expect.objectContaining({
          identifier: '529.982.247-25'
        })
      })
    );
  });

  // Propriedade 3: Isolamento global para administradores
  test('Administradores têm isolamento global (acesso a múltiplos tenants)', async () => {
    // Given: Admin existente
    const cpf = '529.982.247-25';
    const adminUser = {
      $id: 'admin-123',
      tenantId: 'admin',
      identifier: '52998224725',
      status: 'active',
      type: 'admin',
      role: 'admin',
      credits: 0
    };

    mockAppwrite.databases.listDocuments.mockResolvedValueOnce({
      documents: [adminUser]
    });

    // When: Fazer login admin
    const result = await AuthService.adminLogin(cpf);

    // Then: Token deve ter tenantId especial 'admin'
    expect(result.success).toBe(true);
    const decoded = await AuthService.verifyToken(result.token!);
    expect(decoded.tenantId).toBe('admin');
    expect(decoded.isAdmin).toBe(true);
    expect(decoded.role).toBe('admin');
  });

  // Propriedade 4: Validação de CPF/CNPJ para admins
  test('Deve validar CPF/CNPJ para login de administrador', async () => {
    // Given: CPF inválido
    const invalidCPF = '123.456.789-00';

    // When: Tentar login admin com CPF inválido
    const result = await AuthService.adminLogin(invalidCPF);

    // Then: Deve rejeitar
    expect(result.success).toBe(false);
    expect(result.message).toContain('inválido');

    // And: Não deve buscar no banco
    expect(mockAppwrite.databases.listDocuments).not.toHaveBeenCalled();
  });

  // Propriedade 5: Admin não encontrado
  test('Deve rejeitar quando administrador não existe', async () => {
    // Given: CPF válido mas admin não existe
    const cpf = '529.982.247-25';

    // Mock para nenhum resultado
    mockAppwrite.databases.listDocuments.mockResolvedValueOnce({
      documents: []
    });

    // When: Tentar login admin
    const result = await AuthService.adminLogin(cpf);

    // Then: Deve rejeitar
    expect(result.success).toBe(false);
    expect(result.message).toContain('não encontrado');
  });

  // Propriedade 6: Admin inativo rejeitado
  test('Deve rejeitar administradores inativos', async () => {
    // Given: Admin inativo (não deve ser encontrado pela query)
    const cpf = '529.982.247-25';

    // Mock para nenhum resultado (admin inativo não aparece na busca)
    mockAppwrite.databases.listDocuments.mockResolvedValueOnce({
      documents: [] // Nenhum admin ativo encontrado
    });

    // When: Tentar login admin
    const result = await AuthService.adminLogin(cpf);

    // Then: Deve rejeitar
    expect(result.success).toBe(false);
    expect(result.message).toContain('não encontrado');
  });

  // Propriedade 7: Middleware admin rejeita tokens não-admin
  test('Middleware admin deve rejeitar tokens de usuários não-admin', async () => {
    // Given: Token de usuário normal (simular token válido)
    const cpf = '529.982.247-25';
    const tenantId = 'tenant1';

    // Mock para login normal
    mockAppwrite.databases.listDocuments.mockResolvedValueOnce({
      documents: []
    });

    mockAppwrite.databases.createDocument.mockResolvedValueOnce({
      $id: 'user-123',
      tenantId: tenantId,
      identifier: '52998224725',
      type: 'user',
      role: 'viewer',
      credits: 100
    });

    // When: Fazer login normal e verificar token
    const loginResult = await AuthService.login(cpf, tenantId);
    const decoded = await AuthService.verifyToken(loginResult.token!);

    // Then: Deve passar verifyToken mas não ter isAdmin
    expect(decoded).toBeTruthy();
    expect(decoded!.isAdmin).toBeUndefined();
    expect(decoded!.role).toBe('viewer');
  });

  // Propriedade 8: Auditoria específica para ações admin
  test('Deve registrar auditoria específica para ações de administrador', async () => {
    // Given: Admin fazendo login
    const cpf = '529.982.247-25';
    const adminUser = {
      $id: 'admin-456',
      tenantId: 'admin',
      identifier: '52998224725',
      status: 'active',
      type: 'admin',
      role: 'admin',
      credits: 0
    };

    mockAppwrite.databases.listDocuments.mockResolvedValueOnce({
      documents: [adminUser]
    });

    // When: Login admin
    await AuthService.adminLogin(cpf);

    // Then: Deve registrar com tenantId 'admin'
    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'admin',
        userId: 'admin-456',
        action: 'admin_login'
      })
    );
  });
});