// Testes property-based para TASK-USER-004: Garantir Visibilidade de Tenants Criados na Página Admin
// Propriedade 1: Tenants criados via auto-onboarding aparecem na lista admin

// Mock do Appwrite - deve vir ANTES de qualquer import
const mockListDocuments = jest.fn();

jest.mock('../src/lib/appwrite', () => ({
  AppwriteService: {
    getInstance: jest.fn(() => ({
      databases: {
        listDocuments: mockListDocuments,
      },
    })),
  },
}));

import request from 'supertest';
import app from '../src/index';
import { AppwriteService } from '../src/lib/appwrite';

describe('Tenants Admin Visibility - Property-based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/tenants', () => {
    it('should return all tenants including auto-created ones', async () => {
      const mockTenants = [
        {
          $id: 'tenant1',
          name: 'Empresa Exemplo',
          status: 'active',
          plugins: ['consulta'],
          createdAt: '2025-12-24T00:00:00.000Z',
        },
        {
          $id: 'tenant2',
          name: 'default',
          status: 'pending',
          plugins: ['consulta'],
          createdAt: '2025-12-24T00:00:00.000Z',
        },
      ];

      mockListDocuments.mockResolvedValue({ documents: mockTenants });

      const response = await request(app)
        .get('/api/admin/tenants')
        .set('Authorization', 'Bearer admin-token'); // Mock auth

      expect(response.status).toBe(200);
      expect(response.body.tenants).toHaveLength(2);
      expect(response.body.tenants[0].name).toBe('Empresa Exemplo');
      expect(response.body.tenants[1].name).toBe('default');
    });
  });
});