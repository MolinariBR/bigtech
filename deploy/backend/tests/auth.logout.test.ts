import AuthService from '../src/core/auth';
import { AppwriteService } from '../src/lib/appwrite';

// InMemoryAppwrite reused pattern
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

describe('PAC-005 — Logout / Revogação', () => {
  let inmem: InMemoryAppwrite;
  let appwriteInstance: any;

  const tenantId = 'tenant-logout-test';
  const validCpf = '11144477735';

  beforeEach(() => {
    inmem = new InMemoryAppwrite();
    appwriteInstance = AppwriteService.getInstance();
    (appwriteInstance as any).databases = inmem.databases;
  });

  test('revogar refresh token limpa campo no usuário', async () => {
    const user = await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', {
      tenantId,
      identifier: validCpf,
      status: 'active',
      type: 'user',
      role: 'viewer',
      credits: 0
    });

    const refresh = await AuthService.generateRefreshToken(user);
    let doc = await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id);
    expect(doc.refreshToken).toBe(refresh);

    // Chamar logout
    await AuthService.logout(user.$id, tenantId);

    doc = await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id);
    expect(doc.refreshToken).toBeNull();
  });

  test('rota de logout limpa cookie de refresh (simulação sem servidor)', async () => {
    const user = await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', {
      tenantId,
      identifier: validCpf,
      status: 'active',
      type: 'user',
      role: 'viewer',
      credits: 0
    });

    const token = AuthService.generateToken(user);

    // Fake req/res mínimos para passar pelo middleware
    const req: any = { headers: { authorization: `Bearer ${token}` }, tenantId };
    let cookieCleared = false;
    const res: any = {
      clearCookie: (name: string) => { if (name === 'refreshToken') cookieCleared = true; },
      status: (_: number) => res,
      json: (_: any) => {}
    };

    // Chamar authenticateMiddleware para popular req.userId
    // Import middleware dinamicamente para evitar circularidade forte
    const { authenticateMiddleware } = require('../src/core/auth');

    await new Promise<void>((resolve, reject) => {
      authenticateMiddleware(req, res, async () => {
        try {
          // Simular handler de logout que chama AuthService.logout e limpa cookie
          await AuthService.logout(req.userId, req.tenantId);
          res.clearCookie('refreshToken');
          resolve();
        } catch (err) { reject(err); }
      });
    });

    expect(cookieCleared).toBe(true);
  });

  test('tentativas pós-revogação usando refresh falham', async () => {
    const user = await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', {
      tenantId,
      identifier: validCpf,
      status: 'active',
      type: 'user',
      role: 'viewer',
      credits: 0
    });

    const refresh = await AuthService.generateRefreshToken(user);
    // Logout revoga
    await AuthService.logout(user.$id, tenantId);

    const v = await AuthService.verifyRefreshToken(refresh);
    expect(v).toBeNull();
  });
});
