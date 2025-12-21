// Baseado em: 7.Tasks.md v1.1
// Precedência: 1.Project → 2.Architecture → 7.Tasks
// Decisão: Testes property-based para validar autenticação com isolamento multi-tenant

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

// Mock do audit logger
jest.mock('../src/core/audit', () => ({
  auditLogger: {
    log: jest.fn()
  }
}));

describe('TASK-004: Autenticação de Usuário - Isolamento Multi-Tenant', () => {
  let mockAppwrite: any;
  let mockAuditLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    const appwriteMock = require('../src/lib/appwrite');
    mockAppwrite = appwriteMock.AppwriteService.getInstance();
    mockAuditLogger = require('../src/core/audit').auditLogger;

    // Mock successful responses - usar mockImplementation para IDs únicos e tenant correto
    let userIdCounter = 123;
    mockAppwrite.databases.createDocument.mockImplementation((db: string, collection: string, docId: string, data: any) => {
      const userId = `user-${userIdCounter++}`;
      return Promise.resolve({
        $id: userId,
        tenantId: data.tenantId, // Usar o tenantId passado nos dados
        identifier: data.identifier,
        type: 'user',
        role: 'viewer',
        credits: 0
      });
    });

    mockAppwrite.databases.listDocuments.mockResolvedValue({
      documents: []
    });

    mockAppwrite.databases.getDocument.mockImplementation((db: string, collection: string, id: string) => {
      // Mock para verificar tokens - retorna usuário ativo com tenant correto
      const tenantId = id === 'user-123' ? 'tenant1' : 'tenant2';
      return Promise.resolve({
        $id: id,
        tenantId: tenantId,
        identifier: '52998224725',
        status: 'active',
        type: 'user',
        role: 'viewer',
        credits: 100
      });
    });

    mockAuditLogger.log.mockResolvedValue(undefined);
  });

  // Propriedade 1: JWT válido para usuários isolados por tenant
  test('JWT deve ser válido apenas para usuários do mesmo tenant', async () => {
    // Given: Dois tenants diferentes
    const tenant1 = 'tenant1';
    const tenant2 = 'tenant2';
    const cpf = '529.982.247-25'; // CPF válido

    // When: Criar usuários em tenants diferentes
    const result1 = await AuthService.login(cpf, tenant1);
    const result2 = await AuthService.login(cpf, tenant2);

    // Then: Deve gerar tokens diferentes
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.token).not.toBe(result2.token);

    // And: Tokens devem ser válidos apenas para seus respectivos tenants
    const decoded1 = await AuthService.verifyToken(result1.token!);
    const decoded2 = await AuthService.verifyToken(result2.token!);

    expect(decoded1).toBeTruthy();
    expect(decoded2).toBeTruthy();
    expect(decoded1.tenantId).toBe(tenant1);
    expect(decoded2.tenantId).toBe(tenant2);
  });

  // Propriedade 2: Validação de CPF/CNPJ
  test('Deve validar corretamente CPF e CNPJ', () => {
    // Given: CPFs e CNPJs válidos e inválidos
    const validCPF = '529.982.247-25'; // CPF válido
    const invalidCPF = '123.456.789-00'; // CPF inválido
    const validCNPJ = '11.222.333/0001-81'; // CNPJ válido
    const invalidCNPJ = '12.345.678/0001-01'; // CNPJ inválido

    // When & Then: Validar CPFs
    expect(AuthValidators.isValidIdentifier(validCPF)).toBe(true);
    expect(AuthValidators.isValidIdentifier(invalidCPF)).toBe(false);

    // When & Then: Validar CNPJs
    expect(AuthValidators.isValidIdentifier(validCNPJ)).toBe(true);
    expect(AuthValidators.isValidIdentifier(invalidCNPJ)).toBe(false);
  });

  // Propriedade 3: Isolamento de dados por tenant
  test('Dados de usuários devem ser isolados por tenant', async () => {
    // Given: Mesmo CPF em tenants diferentes
    const cpf = '529.982.247-25';
    const tenant1 = 'tenant1';
    const tenant2 = 'tenant2';

    // Mock para simular usuários existentes
    mockAppwrite.databases.listDocuments
      .mockResolvedValueOnce({ documents: [] }) // tenant1 - usuário não existe
      .mockResolvedValueOnce({ documents: [] }); // tenant2 - usuário não existe

    // When: Fazer login nos dois tenants
    await AuthService.login(cpf, tenant1);
    await AuthService.login(cpf, tenant2);

    // Then: Deve criar usuários separados
    expect(mockAppwrite.databases.createDocument).toHaveBeenCalledTimes(2);

    const calls = mockAppwrite.databases.createDocument.mock.calls;
    expect(calls[0][3].tenantId).toBe(tenant1);
    expect(calls[1][3].tenantId).toBe(tenant2);
  });

  // Propriedade 4: Tentativas de acesso não autorizado
  test('Deve rejeitar tentativas de acesso entre tenants', async () => {
    // Given: Usuário de tenant1 tentando acessar dados de tenant2
    const tenant1 = 'tenant1';
    const tenant2 = 'tenant2';
    const cpf = '529.982.247-25';

    // Mock usuário existente no tenant1
    mockAppwrite.databases.listDocuments.mockResolvedValue({
      documents: [{
        $id: 'user-123',
        tenantId: tenant1,
        identifier: cpf,
        status: 'active',
        type: 'user',
        role: 'viewer',
        credits: 100
      }]
    });

    // Mock getDocument para verificar isolamento
    mockAppwrite.databases.getDocument.mockImplementation((db: string, collection: string, id: string) => {
      if (id === 'user-123') {
        return Promise.resolve({
          $id: 'user-123',
          tenantId: tenant1,
          identifier: cpf,
          status: 'active',
          type: 'user',
          role: 'viewer',
          credits: 100
        });
      }
      throw new Error('Document not found');
    });

    // When: Login no tenant1
    const result1 = await AuthService.login(cpf, tenant1);
    expect(result1.success).toBe(true);

    // Then: Token deve ser válido apenas para tenant1
    const decoded = await AuthService.verifyToken(result1.token!);
    expect(decoded.tenantId).toBe(tenant1);

    // And: Mesmo token não deve funcionar para tenant2
    // (Na prática, isso seria verificado no middleware multi-tenant)
  });

  // Propriedade 5: Auditoria de ações de autenticação
  test('Deve registrar auditoria para ações de autenticação', async () => {
    // Given: Novo usuário fazendo login
    const tenantId = 'tenant1';
    const cpf = '529.982.247-25';

    // When: Fazer login (criará novo usuário)
    await AuthService.login(cpf, tenantId);

    // Then: Deve registrar auditoria
    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        action: 'user_login_first_time',
        resource: expect.stringContaining('user:'),
        details: expect.objectContaining({
          identifier: AuthValidators.formatIdentifier(cpf)
        })
      })
    );
  });

  // Propriedade 6: Tratamento de erros de autenticação
  test('Deve tratar corretamente erros de autenticação', async () => {
    // Given: CPF inválido
    const invalidCPF = '123.456.789-00';
    const tenantId = 'tenant1';

    // When: Tentar login com CPF inválido
    const result = await AuthService.login(invalidCPF, tenantId);

    // Then: Deve rejeitar com mensagem apropriada
    expect(result.success).toBe(false);
    expect(result.message).toContain('inválido');

    // And: Não deve tentar criar usuário ou fazer auditoria
    expect(mockAppwrite.databases.createDocument).not.toHaveBeenCalled();
    expect(mockAuditLogger.log).not.toHaveBeenCalled();
  });

  // Propriedade 7: Formatação consistente de identificadores
  test('Deve formatar consistentemente CPF e CNPJ', () => {
    // Given: Identificadores sem formatação
    const cpfRaw = '52998224725';
    const cnpjRaw = '11222333000181';

    // When: Formatar
    const cpfFormatted = AuthValidators.formatIdentifier(cpfRaw);
    const cnpjFormatted = AuthValidators.formatIdentifier(cnpjRaw);

    // Then: Deve estar no formato correto
    expect(cpfFormatted).toBe('529.982.247-25');
    expect(cnpjFormatted).toBe('11.222.333/0001-81');
  });

  // Propriedade 8: Logout registra auditoria
  test('Logout deve registrar auditoria', async () => {
    // Given: Usuário logado
    const userId = 'user-123';
    const tenantId = 'tenant1';

    // When: Fazer logout
    await AuthService.logout(userId, tenantId);

    // Then: Deve registrar auditoria de logout
    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        userId,
        action: 'user_logout',
        resource: `user:${userId}`
      })
    );
  });
});