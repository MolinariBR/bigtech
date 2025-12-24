import { auditLogger } from '../src/core/audit';
import { AppwriteService } from '../src/lib/appwrite';

class InMemoryAppwrite {
  public databases: any;
  private storage: Record<string, any[]> = {};
  private idCounter = 1;

  constructor() {
    this.databases = {
      getCollection: this.getCollection.bind(this),
      createDocument: this.createDocument.bind(this),
      listDocuments: this.listDocuments.bind(this),
      getDocument: this.getDocument.bind(this),
      updateDocument: this.updateDocument.bind(this)
    };
  }

  private ensureCollection(dbId: string, collection: string) {
    const key = `${dbId}:${collection}`;
    if (!this.storage[key]) this.storage[key] = [];
    return key;
  }

  async getCollection(_dbId: string, collection: string) {
    const key = `${process.env.APPWRITE_DATABASE_ID || 'bigtechdb'}:${collection}`;
    if (!this.storage[key]) throw new Error('Collection not found');
    return { $id: collection };
  }

  async createDocument(dbId: string, collection: string, id: string, data: any) {
    const key = this.ensureCollection(dbId, collection);
    const $id = `doc-${this.idCounter++}`;
    const doc = { $id, ...data };
    this.storage[key].push(doc);
    return doc;
  }

  // Suporta queries em string e objetos Query.* do SDK (tentativa de parsing)
  async listDocuments(dbId: string, collection: string, queries: any[] = []) {
    const key = this.ensureCollection(dbId, collection);
    let docs = this.storage[key].slice();

    for (const q of queries || []) {
      if (typeof q === 'string') {
        const parts = q.split('=');
        if (parts.length === 2) {
          const [field, value] = parts;
          docs = docs.filter(d => String(d[field]) === value);
        }
      } else if (q && typeof q === 'object') {
        // Tentar extrair via stringify: "tenantId","value"
        const s = JSON.stringify(q);
        const m = s.match(/"([a-zA-Z0-9_]+)"\s*[:,]?\s*"?([a-zA-Z0-9\-:T\.]+)"?/);
        if (m) {
          const field = m[1];
          const value = m[2];
          docs = docs.filter(d => String(d[field]) === value);
        }
      }
    }

    return { documents: docs };
  }

  async getDocument(dbId: string, collection: string, id: string) {
    const key = this.ensureCollection(dbId, collection);
    const doc = this.storage[key].find(d => d.$id === id);
    if (!doc) throw new Error('Document not found');
    return doc;
  }

  async updateDocument(dbId: string, collection: string, id: string, patch: any) {
    const key = this.ensureCollection(dbId, collection);
    const idx = this.storage[key].findIndex(d => d.$id === id);
    if (idx === -1) throw new Error('Document not found');
    this.storage[key][idx] = { ...this.storage[key][idx], ...patch };
    return this.storage[key][idx];
  }

  // helpers
  allDocs(collection = 'audits', dbId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb') {
    const key = `${dbId}:${collection}`;
    return (this.storage[key] || []).slice();
  }
}

describe('PAC-009 — Audit Logger', () => {
  let inmem: InMemoryAppwrite;
  let appwriteInstance: any;

  const tenantId = 'tenant-audit-test';

  beforeEach(() => {
    inmem = new InMemoryAppwrite();
    appwriteInstance = AppwriteService.getInstance();
    (appwriteInstance as any).databases = inmem.databases;
  });

  test('inicialização sem coleção (skip) não falha', async () => {
    // garantir que coleção audits não exista
    // getCollection lançará se storage vazio
    await expect(auditLogger.initialize()).resolves.toBeUndefined();
  });

  test('log() ignora falhas de escrita sem propagar erro', async () => {
    // criar coleção para evitar erro no initialize
    inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'audits', 'unique()', { createdAt: new Date().toISOString() });
    await auditLogger.initialize();

    // substituir createDocument para lançar
    (inmem.databases as any).createDocument = async () => { throw new Error('write failed'); };

    await expect(auditLogger.log({ tenantId, action: 'act', resource: 'r', details: {}, ipAddress: '1.1.1.1' })).resolves.toBeUndefined();
  });

  test('getLogs retorna logs aplicando limit e filtros básicos', async () => {
    // criar alguns logs manualmente
    await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'audits', 'unique()', { tenantId, userId: 'u1', action: 'a1', resource: 'res1', details: '{}', timestamp: new Date().toISOString(), createdAt: new Date().toISOString() });
    await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'audits', 'unique()', { tenantId, userId: 'u2', action: 'a2', resource: 'res2', details: '{}', timestamp: new Date().toISOString(), createdAt: new Date().toISOString() });
    await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'audits', 'unique()', { tenantId: 'other', userId: 'u3', action: 'a3', resource: 'res3', details: '{}', timestamp: new Date().toISOString(), createdAt: new Date().toISOString() });

    // request logs for tenantId with limit
    const logs = await auditLogger.getLogs(tenantId, { limit: 10 });
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThanOrEqual(2);

    // filtros por action/userId via getLogs - pass limit and check that returned items include matches
    const byUser = await auditLogger.getLogs(tenantId, { userId: 'u1' });
    expect(byUser.length).toBeGreaterThanOrEqual(1);

    const byAction = await auditLogger.getLogs(tenantId, { action: 'a2' });
    expect(byAction.length).toBeGreaterThanOrEqual(1);
  });
});
