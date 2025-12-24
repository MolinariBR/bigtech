import AuthService from '../src/core/auth';
import { AppwriteService } from '../src/lib/appwrite';
import jwt from 'jsonwebtoken';

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

describe('PAC-004 — Refresh Token (core)', () => {
  let inmem: InMemoryAppwrite;
  let appwriteInstance: any;

  const tenantId = 'tenant-refresh-test';
  const validCpf = '11144477735';

  beforeEach(() => {
    inmem = new InMemoryAppwrite();
    appwriteInstance = AppwriteService.getInstance();
    (appwriteInstance as any).databases = inmem.databases;
  });

  test('refresh válido: gera refresh, verifica e renova tokens', async () => {
    const user = await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', {
      tenantId,
      identifier: validCpf,
      status: 'active',
      type: 'user',
      role: 'viewer',
      credits: 0
    });

    const refresh = await AuthService.generateRefreshToken(user);
    expect(typeof refresh).toBe('string');

    // Token deve estar salvo no documento
    const stored = (await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id)).refreshToken;
    expect(stored).toBe(refresh);

    // verifyRefreshToken deve retornar o payload decodificado
    const decoded = await AuthService.verifyRefreshToken(refresh);
    expect(decoded).not.toBeNull();
    expect(decoded.userId).toBe(user.$id);

    // Simular endpoint /refresh: gerar novo access token e novo refresh
    const freshUser = await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id);
    const newAccess = AuthService.generateToken(freshUser);
    expect(typeof newAccess).toBe('string');

    const newRefresh = await AuthService.generateRefreshToken(freshUser);
    expect(typeof newRefresh).toBe('string');

    const storedAfter = (await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id)).refreshToken;
    expect(storedAfter).toBe(newRefresh);

    // Verificar que o novo refresh é válido
    const verifyNew = await AuthService.verifyRefreshToken(newRefresh);
    expect(verifyNew).not.toBeNull();

    // Se por acaso o token anterior coincidiu com o novo (mesmo iat), garantir comportamento idempotente
    if (refresh !== newRefresh) {
      const verifyOld = await AuthService.verifyRefreshToken(refresh);
      expect(verifyOld).toBeNull();
    }
  });

  test('refresh inválido/expirado retorna null', async () => {
    const user = await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', {
      tenantId,
      identifier: validCpf,
      status: 'active',
      type: 'user',
      role: 'viewer',
      credits: 0
    });

    // Criar token expirado manualmente
    const payload = { userId: user.$id, tenantId, iat: Math.floor(Date.now() / 1000) };
    const secret = process.env.REFRESH_SECRET || 'bigtech-refresh-secret';
    const expired = jwt.sign(payload, secret, { expiresIn: '-1s' });

    const v = await AuthService.verifyRefreshToken(expired);
    expect(v).toBeNull();
  });

  test('revogação: logout limpa refreshToken e verify falha', async () => {
    const user = await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', {
      tenantId,
      identifier: validCpf,
      status: 'active',
      type: 'user',
      role: 'viewer',
      credits: 0
    });

    const refresh = await AuthService.generateRefreshToken(user);
    // Confirmar presente
    let doc = await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id);
    expect(doc.refreshToken).toBe(refresh);

    // Chamar logout para revogar
    await AuthService.logout(user.$id, tenantId);

    doc = await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id);
    expect(doc.refreshToken).toBeNull();

    const v = await AuthService.verifyRefreshToken(refresh);
    expect(v).toBeNull();
  });
});
