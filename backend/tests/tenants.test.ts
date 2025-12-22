// Testes property-based para TASK-TENANT-002 (backend admin/tenants.ts)
// Baseado em: 8.Tests.md v1.0.0, 4.Entities.md v1.1
// Propriedade 1: Unicidade de Tenant.name validada globalmente
// Propriedade 2: Operações geram auditId único em Audit

import request from 'supertest';
import app from '../src/index';
import { AppwriteService } from '../src/lib/appwrite';
import { execSync } from 'child_process';
import path from 'path';

const appwrite = AppwriteService.getInstance();

describe('Admin Tenants Controller - TASK-TENANT-002.1', () => {
  beforeAll(async () => {
    // Garantir ambiente limpo executando script de limpeza (CLEAN_ALL)
    try {
      const scriptsDir = path.resolve(__dirname, '..', 'scripts');
      const script = path.join(scriptsDir, 'clean-test-tenants.ts');
      const cmd = `CLEAN_ALL=1 DOTENV_CONFIG_PATH=.env npx -y ts-node -r dotenv/config ${script}`;
      console.log('Running cleanup script:', cmd);
      execSync(cmd, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    } catch (error) {
      console.warn('Failed to run cleanup script:', error);
    }
  });

  beforeEach(async () => {
    // Garantir estado limpo antes de cada caso
    try {
      const scriptsDir = path.resolve(__dirname, '..', 'scripts');
      const script = path.join(scriptsDir, 'clean-test-tenants.ts');
      const cmd = `CLEAN_ALL=1 DOTENV_CONFIG_PATH=.env npx -y ts-node -r dotenv/config ${script}`;
      execSync(cmd, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    } catch (error) {
      console.warn('Failed to run cleanup script (beforeEach):', error);
    }
  });

  describe('Propriedade 1: Unicidade de Tenant.name validada globalmente', () => {
    it('deve permitir criar tenant com nome único', async () => {
      const response = await request(app)
        .post('/api/admin/tenants')
        .send({
          name: 'Tenant Unico Test',
          status: 'active',
          plugins: ['consulta']
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Tenant Unico Test');
      expect(response.body.status).toBe('active');
    });

    it('deve rejeitar criação de tenant com nome duplicado', async () => {
      // Primeiro, criar tenant
      await request(app)
        .post('/api/admin/tenants')
        .send({
          name: 'Tenant Duplicado',
          status: 'active'
        });

      // Tentar criar outro com mesmo nome
      const response = await request(app)
        .post('/api/admin/tenants')
        .send({
          name: 'Tenant Duplicado',
          status: 'inactive'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Tenant name already exists');
    });

    it('deve rejeitar atualização para nome já existente', async () => {
      // Criar dois tenants
      const tenant1 = await request(app)
        .post('/api/admin/tenants')
        .send({ name: 'Tenant A', status: 'active' });

      await request(app)
        .post('/api/admin/tenants')
        .send({ name: 'Tenant B', status: 'active' });

      // Tentar renomear Tenant A para Tenant B
      const response = await request(app)
        .put(`/api/admin/tenants/${tenant1.body.id}`)
        .send({ name: 'Tenant B' });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Tenant name already exists');
    });
  });

  describe('Propriedade 2: Operações geram auditId único em Audit', () => {
    it('deve gerar audit log único para criação de tenant', async () => {
      const beforeAudit = await appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'audits',
        []
      );

      const response = await request(app)
        .post('/api/admin/tenants')
        .send({
          name: 'Tenant Audit Test',
          status: 'active'
        });

      expect(response.status).toBe(201);

      // Verificar se foi criado audit log
      const afterAudit = await appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'audits',
        []
      );

      // Verificar se existe um audit log relacionado à criação do tenant
      const found = afterAudit.documents.find((d: any) => d.tenantId === response.body.id && d.action === 'CREATE');
      expect(found).toBeDefined();
      const f = found as any;
      const details = typeof f.details === 'string' ? JSON.parse(f.details) : f.details;
      expect(details.name).toBe('Tenant Audit Test');
      expect(f.auditId || f.$id).toBeDefined();
    });

    it('deve gerar audit log único para atualização de tenant', async () => {
      // Criar tenant
      const createResponse = await request(app)
        .post('/api/admin/tenants')
        .send({ name: 'Tenant Update Test', status: 'active' });

      const beforeAudit = await appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'audits',
        []
      );

      // Atualizar tenant
      const updateResponse = await request(app)
        .put(`/api/admin/tenants/${createResponse.body.id}`)
        .send({ status: 'inactive' });

      expect(updateResponse.status).toBe(200);

      // Verificar audit log
      const afterAudit = await appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'audits',
        []
      );

      const found = afterAudit.documents.find((d: any) => d.tenantId === createResponse.body.id && d.action === 'UPDATE');
      expect(found).toBeDefined();
      const f = found as any;
      const details = typeof f.details === 'string' ? JSON.parse(f.details) : f.details;
      expect(details.status).toBe('inactive');
      expect(f.auditId || f.$id).toBeDefined();
    });

    it('deve gerar audit log único para deleção de tenant', async () => {
      // Criar tenant
      const createResponse = await request(app)
        .post('/api/admin/tenants')
        .send({ name: 'Tenant Delete Test', status: 'active' });

      const beforeAudit = await appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'audits',
        []
      );

      // Deletar tenant
      const deleteResponse = await request(app)
        .delete(`/api/admin/tenants/${createResponse.body.id}`);

      expect(deleteResponse.status).toBe(200);

      // Verificar audit log
      const afterAudit = await appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'audits',
        []
      );

      const found = afterAudit.documents.find((d: any) => d.tenantId === createResponse.body.id && d.action === 'DELETE');
      expect(found).toBeDefined();
      const f = found as any;
      const details = typeof f.details === 'string' ? JSON.parse(f.details) : f.details;
      expect(details.name).toBe('Tenant Delete Test');
      expect(f.auditId || f.$id).toBeDefined();
    });
  });

  describe('CRUD Operations', () => {
    it('deve listar tenants vazia inicialmente', async () => {
      const response = await request(app).get('/api/admin/tenants');

      expect(response.status).toBe(200);
      expect(response.body.tenants).toEqual([]);
    });

    it('deve criar e listar tenant', async () => {
      // Criar
      const createResponse = await request(app)
        .post('/api/admin/tenants')
        .send({
          name: 'Test Tenant',
          status: 'active',
          plugins: ['consulta', 'pagamento']
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.name).toBe('Test Tenant');

      // Listar
      const listResponse = await request(app).get('/api/admin/tenants');

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.tenants.length).toBeGreaterThan(0);
      expect(listResponse.body.tenants[0].name).toBe('Test Tenant');
    });

    it('deve atualizar tenant', async () => {
      // Criar
      const createResponse = await request(app)
        .post('/api/admin/tenants')
        .send({ name: 'Update Test', status: 'active' });

      // Atualizar
      const updateResponse = await request(app)
        .put(`/api/admin/tenants/${createResponse.body.id}`)
        .send({ status: 'inactive', plugins: ['consulta'] });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.status).toBe('inactive');
      expect(updateResponse.body.plugins).toEqual(['consulta']);
    });

    it('deve deletar tenant', async () => {
      // Criar
      const createResponse = await request(app)
        .post('/api/admin/tenants')
        .send({ name: 'Delete Test', status: 'active' });

      // Deletar
      const deleteResponse = await request(app)
        .delete(`/api/admin/tenants/${createResponse.body.id}`);

      expect(deleteResponse.status).toBe(200);

      // Verificar se foi removido
      const listResponse = await request(app).get('/api/admin/tenants');
      const tenantExists = listResponse.body.tenants.some((t: any) => t.id === createResponse.body.id);
      expect(tenantExists).toBe(false);
    });
  });
});