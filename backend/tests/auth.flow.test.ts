import AuthService from '../src/core/auth';
import { AppwriteService } from '../src/lib/appwrite';
import jwt from 'jsonwebtoken';

// InMemory Appwrite (mesma forma usada nos outros testes)
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

describe('PAC-006 — Autenticação - Core (fluxo completo)', () => {
  let inmem: InMemoryAppwrite;
  let appwriteInstance: any;

  const tenantId = 'tenant-flow-test';
  const validCpf = '11144477735';

  beforeEach(() => {
    inmem = new InMemoryAppwrite();
    appwriteInstance = AppwriteService.getInstance();
    (appwriteInstance as any).databases = inmem.databases;
  });

  test('login -> acessar rota protegida -> refresh automático -> logout', async () => {
    // 1) Login (cria usuário se não existir)
    const loginRes = await AuthService.login(validCpf, tenantId);
    expect(loginRes.success).toBe(true);
    const accessToken = loginRes.token as string;
    const refreshToken = loginRes.refreshToken as string | undefined;
    // Login rota envia refreshToken como cookie in real app; here we keep the value
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');

    // Obter documento do usuário criado
    const docs = inmem.allDocs();
    expect(docs.length).toBeGreaterThan(0);
    const user = docs[0];

    // 2) Acessar rota protegida com accessToken
    const { authenticateMiddleware } = require('../src/core/auth');

    let nextCalled = false;
    const req1: any = { headers: { authorization: `Bearer ${accessToken}` }, tenantId };
    const res1: any = {
      status: (code: number) => { res1._status = code; return res1; },
      json: (body: any) => { res1._body = body; }
    };

    await new Promise<void>((resolve) => {
      authenticateMiddleware(req1, res1, () => { nextCalled = true; resolve(); });
    });

    expect(nextCalled).toBe(true);
    expect(req1.userId).toBe(user.$id);

    // 3) Simular expiração do access token e executar refresh automático
    // Criar token expirado manualmente
    const payload = {
      userId: user.$id,
      tenantId: tenantId,
      identifier: user.identifier,
      type: user.type,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };
    const secret = process.env.JWT_SECRET || 'bigtech-secret-key';
    const expiredToken = jwt.sign(payload, secret, { expiresIn: '-1s' });

    // Verificar que middleware recusa token expirado
    const req2: any = { headers: { authorization: `Bearer ${expiredToken}` }, tenantId };
    let blocked = false;
    const res2: any = {
      status: (code: number) => { res2._status = code; return res2; },
      json: (body: any) => { res2._body = body; blocked = true; }
    };

    await new Promise<void>((resolve) => {
      // Resolver tanto se o middleware chamar next() quanto se responder com json()
      res2.json = (body: any) => { res2._body = body; blocked = true; resolve(); };
      authenticateMiddleware(req2, res2, () => { resolve(); });
    });

    expect(blocked).toBe(true);
    expect(res2._status).toBe(401);

    // Agora simular chamada ao /refresh com refreshToken
    const decodedRefresh = await AuthService.verifyRefreshToken(refreshToken!);
    expect(decodedRefresh).not.toBeNull();

    // Gerar novo access e refresh (como faz o /refresh handler)
    const fetchedUser = await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id);
    const newAccess = AuthService.generateToken(fetchedUser);
    const newRefresh = await AuthService.generateRefreshToken(fetchedUser);

    expect(typeof newAccess).toBe('string');
    expect(typeof newRefresh).toBe('string');

    // Acesso com novo token deve funcionar
    const req3: any = { headers: { authorization: `Bearer ${newAccess}` }, tenantId };
    let next3 = false;
    const res3: any = { status: (_: number) => res3, json: (_: any) => {} };
    await new Promise<void>((resolve) => {
      authenticateMiddleware(req3, res3, () => { next3 = true; resolve(); });
    });
    expect(next3).toBe(true);

    // 4) Logout revoga refresh
    await AuthService.logout(user.$id, tenantId);

    // Após logout, verifyRefreshToken para o último refresh deve falhar
    const v = await AuthService.verifyRefreshToken(newRefresh);
    expect(v).toBeNull();
  });
});
