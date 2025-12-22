import request from 'supertest';
import fc from 'fast-check';
import app from '../src/index';
import { AppwriteService } from '../src/lib/appwrite';

const appwrite = AppwriteService.getInstance();

// Teste de integração property-based para TASK-TENANT-003
// Observação: este teste é uma integração real e deve rodar contra a stack Docker (Appwrite + backend).
// Para executá-lo localmente, faça `npm run e2e:up` (levantar Appwrite) antes de rodar os testes.

const VALID_CPF = '12345678909'; // CPF de teste válido usado no projeto

describe('TASK-TENANT-003 integration: auto-onboarding via login', () => {
  beforeAll(async () => {
    const healthy = await appwrite.healthCheck();
    if (!healthy) {
      // Se a stack Docker/Appwrite não estiver disponível, pular todos os testes deste describe
      console.warn('Appwrite não disponível — pulando testes de integração TASK-TENANT-003');
      // @ts-ignore
      jest.skip();
    }
  });

  test('auto-onboarding: cria tenant inexistente no primeiro login (property-based)', async () => {
    // Gerar tenantIds seguros (hex) para evitar caracteres inválidos
    // Prefixar com 't' para evitar IDs numéricos/padronizados que geram comportamentos inesperados
    const tenantGen = fc
      .hexaString({ minLength: 6, maxLength: 12 })
      .filter((s) => s.length > 0 && !s.split('').every((ch) => ch === s[0]))
      .map((s) => `t${s}`);

    await fc.assert(
      fc.asyncProperty(tenantGen, async (tenantId) => {
        // Garantir formato simples
        if (!tenantId) return true;

        // Garantir estado inicial: remover tenant e usuários associados se existirem
        try {
          await appwrite.databases.deleteDocument(
            process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
            'tenants',
            tenantId
          );
        } catch (err) {
          // ignorar se não existir
        }

        try {
          // listar usuários do tenant e deletar
          const users = await appwrite.databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
            'users',
            [
              // usar Query.equal via SDK
              // Not importing Query aqui para manter o teste simples; usar string filter se necessário
            ]
          );
          if (users && users.documents && users.documents.length) {
            for (const u of users.documents) {
              if (u.tenantId === tenantId) {
                try {
                  await appwrite.databases.deleteDocument(
                    process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
                    'users',
                    u.$id
                  );
                } catch (e) {
                  // ignorar falhas individuais
                }
              }
            }
          }
        } catch (err) {
          // ignorar erros de listagem
        }

        // Primeiro login: deve criar tenant
        const res1 = await request(app)
          .post('/api/auth/login')
          .set('X-Tenant-Id', tenantId)
          .send({ identifier: VALID_CPF })
          .timeout({ deadline: 20000 });

        expect(res1.status).toBe(200);
        expect(res1.body).toHaveProperty('success', true);
        expect(res1.body).toHaveProperty('tenantCreated');
        expect(res1.body.tenantCreated).toBe(true);

        // Verificar que o tenant foi criado no Appwrite
        const tenantDoc = await appwrite.databases.getDocument(
          process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
          'tenants',
          tenantId
        );
        expect(tenantDoc).toBeDefined();

        // Segundo login: tenant já existe, tenantCreated deve ser false
        const res2 = await request(app)
          .post('/api/auth/login')
          .set('X-Tenant-Id', tenantId)
          .send({ identifier: VALID_CPF })
          .timeout({ deadline: 20000 });

        expect(res2.status).toBe(200);
        expect(res2.body).toHaveProperty('success', true);
        expect(res2.body).toHaveProperty('tenantCreated');
        expect(res2.body.tenantCreated).toBe(false);

        // Limpar: deletar tenant criado para não poluir ambiente
        try {
          await appwrite.databases.deleteDocument(
            process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
            'tenants',
            tenantId
          );
        } catch (err) {
          // ignorar
        }

        return true;
      }),
      { numRuns: 20, interruptAfterTimeLimit: 1000 * 60 }
    );
  }, 120000);
});

export {};
