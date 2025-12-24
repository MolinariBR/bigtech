import AuthService from '../src/core/auth';
import { AppwriteService } from '../src/lib/appwrite';
import jwt from 'jsonwebtoken';

// InMemory Appwrite (duplicado leve do usado em auth.register.test.ts)
class InMemoryAppwrite {
  public databases: any;
  private storage: Record<string, any[]> = {};
  private idCounter = 1;

  constructor() {
    this.databases = {
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

  async createDocument(dbId: string, collection: string, id: string, data: any) {
    const key = this.ensureCollection(dbId, collection);
    const $id = `doc-${this.idCounter++}`;
    const doc = { $id, ...data };
    this.storage[key].push(doc);
    return doc;
  }

  async listDocuments(dbId: string, collection: string, queries: string[] = []) {
    const key = this.ensureCollection(dbId, collection);
    let docs = this.storage[key].slice();
    for (const q of queries) {
      const parts = q.split('=');
      if (parts.length === 2) {
        const [field, value] = parts;
        docs = docs.filter(d => String(d[field]) === value);
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

  allDocs(collection = 'users', dbId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb') {
    const key = `${dbId}:${collection}`;
    return (this.storage[key] || []).slice();
  }
}

describe('PAC-003 — Login (credenciais)', () => {
  let inmem: InMemoryAppwrite;
  let appwriteInstance: any;

  const tenantId = 'tenant-login-test';
  const validCpf = '11144477735';

  beforeEach(() => {
    inmem = new InMemoryAppwrite();
    appwriteInstance = AppwriteService.getInstance();
    (appwriteInstance as any).databases = inmem.databases;
  });

  test('credenciais válidas retornam JWT válido', async () => {
    // Pré-criar usuário no test-double
    const created = await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', {
      tenantId,
      identifier: validCpf,
      status: 'active',
      type: 'user',
      role: 'viewer',
      credits: 10
    });

    const res = await AuthService.login(validCpf, tenantId);
    expect(res.success).toBe(true);
    expect(res.token).toBeDefined();

    // Verificar token JWT com o segredo do processo
    const secret = process.env.JWT_SECRET || 'bigtech-secret-key';
    const decoded: any = jwt.verify(res.token as string, secret);
    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe(created.$id);
    expect(decoded.tenantId).toBe(tenantId);
    expect(decoded.identifier).toBe(validCpf);
  });

  test('credenciais inválidas retornam erro de validação', async () => {
    const res = await AuthService.login('invalid-id', tenantId);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/CPF\/CNPJ inválido/i);
  });

  test('repetidas tentativas inválidas não causam bloqueio (comportamento atual)', async () => {
    // O sistema atual não implementa bloqueio; test verifica comportamento atual
    for (let i = 0; i < 5; i++) {
      const r = await AuthService.login('000', tenantId);
      expect(r.success).toBe(false);
      expect(r.message).toMatch(/CPF\/CNPJ inválido/i);
    }
  });
});
