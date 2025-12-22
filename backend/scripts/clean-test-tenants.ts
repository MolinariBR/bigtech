// Script de limpeza: remove tenants de teste cujo `name` começa com 't'
// Uso: export APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID

import { Client, Databases } from 'node-appwrite';

async function run() {
  const endpoint = process.env.APPWRITE_ENDPOINT || 'http://localhost/v1';
  const project = process.env.APPWRITE_PROJECT_ID || 'bigtech';
  const key = process.env.APPWRITE_API_KEY || '';
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb';
  const collectionId = 'tenants';

  if (!key) {
    console.error('ERROR: APPWRITE_API_KEY is required');
    process.exit(1);
  }

  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const databases = new Databases(client);

  try {
    console.log('Listando tenants...');
    const all = await databases.listDocuments(databaseId, collectionId);
    const tenants = all.documents || [];
    const cleanAll = process.env.CLEAN_ALL === '1' || process.env.CLEAN_ALL === 'true';
    const toDelete = cleanAll
      ? tenants
      : tenants.filter((t: any) => typeof t.name === 'string' && t.name.startsWith('t'));

    console.log(`Found ${toDelete.length} test tenants to delete. (cleanAll=${cleanAll})`);

    for (const t of toDelete) {
      try {
        const docId = t.$id || t.id || t['$id'] || t['id'];
        console.log('Deleting tenant', docId, t.name);
        if (!docId) {
          console.error('No document id found for tenant', t);
          continue;
        }
        await databases.deleteDocument(databaseId, collectionId, docId);
      } catch (delErr: any) {
        console.error('Failed to delete tenant', t.id, delErr?.message || delErr);
      }
    }

    console.log('Cleanup finished.');
    if (cleanAll) {
      // Também limpar audits quando solicitado
      try {
        console.log('Cleaning audits collection...');
        const audits = await databases.listDocuments(databaseId, 'audits');
        for (const a of audits.documents || []) {
          const aid = a.$id || a.id || a['$id'] || a['id'];
          if (!aid) continue;
          try {
            await databases.deleteDocument(databaseId, 'audits', aid);
          } catch (err) {
            console.error('Failed to delete audit', aid, (err as any)?.message || err);
          }
        }
        console.log('Audits cleanup finished.');
      } catch (err) {
        console.warn('No audits cleaned or error during audits cleanup:', (err as any)?.message || err);
      }
    }
  } catch (err: any) {
    console.error('Failed to list tenants:', (err as any)?.message || err);
    process.exit(2);
  }
}

run().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(3);
});
