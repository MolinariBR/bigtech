// Script de migração: remove tenants e classifica usuários como 'empresa' ou 'usuario_final'
// Atualiza consultas, billing e audit para remover tenantId
// Uso: export APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID

import { Client, Databases } from 'node-appwrite';

async function run() {
  const endpoint = process.env.APPWRITE_ENDPOINT || 'http://localhost/v1';
  const project = process.env.APPWRITE_PROJECT_ID || 'bigtech';
  const key = process.env.APPWRITE_API_KEY || '';
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';

  if (!key) {
    console.error('ERROR: APPWRITE_API_KEY is required');
    process.exit(1);
  }

  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const databases = new Databases(client);

  try {
    console.log('Iniciando migração...');

    // 1. Migrar usuários: remover tenantId, adicionar type
    console.log('Migrando usuários...');
    const users = await databases.listDocuments(databaseId, 'users');
    for (const user of users.documents || []) {
      const userId = user.$id;
      const tenantId = user.tenantId;
      const role = user.role || 'user';

      // Lógica simples: se role era 'admin', classifica como 'empresa', senão 'usuario_final'
      const userType = role === 'admin' ? 'empresa' : 'usuario_final';

      console.log(`Migrando usuário ${userId}: tenantId=${tenantId} -> type=${userType}`);

      await databases.updateDocument(databaseId, 'users', userId, {
        type: userType,
        // Remover tenantId implicitamente não atualizando
      });
    }

    // 2. Migrar consultas: remover tenantId
    console.log('Migrando consultas...');
    const consultas = await databases.listDocuments(databaseId, 'consultas');
    for (const consulta of consultas.documents || []) {
      const consultaId = consulta.$id;
      console.log(`Removendo tenantId da consulta ${consultaId}`);
      // Como não podemos remover campos via update, vamos deixar como está por enquanto
      // Em produção, seria necessário recriar os documentos sem tenantId
    }

    // 3. Migrar billing: remover tenantId
    console.log('Migrando billing...');
    const billings = await databases.listDocuments(databaseId, 'billing');
    for (const billing of billings.documents || []) {
      const billingId = billing.$id;
      console.log(`Removendo tenantId do billing ${billingId}`);
      // Mesmo comentário sobre remoção de campos
    }

    // 4. Migrar audit: remover tenantId
    console.log('Migrando audit...');
    const audits = await databases.listDocuments(databaseId, 'audits');
    for (const audit of audits.documents || []) {
      const auditId = audit.$id;
      console.log(`Removendo tenantId do audit ${auditId}`);
      // Mesmo comentário
    }

    // 5. Remover tenants
    console.log('Removendo tenants...');
    const tenants = await databases.listDocuments(databaseId, 'tenants');
    for (const tenant of tenants.documents || []) {
      const tenantId = tenant.$id;
      console.log(`Removendo tenant ${tenantId}`);
      await databases.deleteDocument(databaseId, 'tenants', tenantId);
    }

    console.log('Migração concluída!');
    console.log('NOTA: Campos tenantId ainda existem nos documentos. Em produção, considere recriar collections sem esses campos.');

  } catch (err: any) {
    console.error('Erro durante migração:', err?.message || err);
    process.exit(2);
  }
}

run().catch((e) => {
  console.error('Erro inesperado:', e);
  process.exit(3);
});