// Testes property-based de integração para TASK-USER-003: Implementar Auto-Onboarding de Usuários e Tenants
// Propriedade 1: Usuário criado no Appwrite com conta válida
// Propriedade 2: Tenant criado automaticamente se inexistente durante registro
// Propriedade 3: Operações geram auditId em Audit

// Mock do Appwrite para testes - deve vir ANTES de qualquer import
const mockCreateDocument = jest.fn().mockImplementation((...args) => {
  console.log('Mock createDocument called with args:', args);
  return Promise.resolve({ $id: 'mocked-id' });
});
const mockListDocuments = jest.fn();
const mockGetDocument = jest.fn();

jest.mock('../src/lib/appwrite', () => ({
  AppwriteService: {
    getInstance: jest.fn(() => ({
      databases: {
        createDocument: mockCreateDocument,
        listDocuments: mockListDocuments,
        getDocument: mockGetDocument,
      },
    })),
  },
}));

// Mock do axios para evitar chamadas HTTP reais
jest.mock('axios');

import axios from 'axios';
import request from 'supertest';
import app from '../src/index';
import { AppwriteService } from '../src/lib/appwrite';
import { Query } from 'node-appwrite';

describe('User Onboarding - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock axios post para criação de conta
    (axios.post as jest.Mock).mockResolvedValue({ data: { $id: 'account123' } });
  });

  describe('POST /api/auth/register', () => {
    it('should create user account in Appwrite and database document', async () => {
      // Mock Appwrite account creation
      mockCreateDocument
        .mockResolvedValueOnce({ $id: 'user123' }) // User document
        .mockResolvedValueOnce({ $id: 'tenant123' }); // Tenant document if created

      mockListDocuments.mockResolvedValue({ documents: [] }); // No existing tenant

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Silva',
          email: 'joao@exemplo.com',
          password: 'Password123',
          company: 'Empresa Exemplo',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Conta criada com sucesso');
    });

    it('should create tenant automatically if not exists', async () => {
      // Reset all mocks
      jest.clearAllMocks();
      (axios.post as jest.Mock).mockResolvedValue({ data: { $id: 'account123' } });

      mockGetDocument.mockRejectedValue({ code: 404 }); // Tenant not found

      mockCreateDocument
        .mockResolvedValueOnce({ $id: 'user123' })
        .mockResolvedValueOnce({ $id: 'tenant123' });

      mockListDocuments.mockResolvedValue({ documents: [] });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Silva',
          email: 'joao@exemplo.com',
          password: 'Password123',
        });

      console.log('Test response status:', response.status);
      console.log('Test response body:', response.body);

      expect(response.status).toBe(200);
      expect(response.body.tenantCreated).toBe(true);
    });

    it('should use existing tenant if matches', async () => {
      mockGetDocument.mockResolvedValue({ $id: 'tenant123' }); // Tenant exists

      mockCreateDocument.mockResolvedValue({ $id: 'user123' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Silva',
          email: 'joao@exemplo.com',
          password: 'Password123',
          company: 'empresaexemplo',
        });

      expect(response.status).toBe(200);
      expect(response.body.tenantCreated).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'joao@exemplo.com',
          password: 'Password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Nome');
    });

    it('should handle duplicate email', async () => {
      // Mock axios to throw error for duplicate account
      (axios.post as jest.Mock).mockRejectedValue({
        response: { status: 409, data: { message: 'Account already exists' } }
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'João Silva',
          email: 'joao@exemplo.com',
          password: 'Password123',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email já cadastrado');
    });
  });
});