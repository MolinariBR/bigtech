import jwt from 'jsonwebtoken';
import { authenticateMiddleware, AuthService } from '../src/core/auth';
import { AppwriteService } from '../src/lib/appwrite';
import { Request, Response } from 'express';

// Test-double in-memory para Appwrite (instância compartilhada)
class InMemoryAppwrite {
  public databases: any;
  private users: Map<string, any> = new Map();

  constructor() {
    this.databases = {
      listDocuments: this.listDocuments.bind(this),
      getDocument: this.getDocument.bind(this),
      createDocument: this.createDocument.bind(this),
      updateDocument: this.updateDocument.bind(this)
    };
  }

  async listDocuments(dbId: string, collectionId: string, queries: string[]) {
    if (collectionId !== 'users') return { documents: [] };
    // extrair tenantId e identifier das queries simples do formato 'key=value'
    const q: any = {};
    (queries || []).forEach((s: string) => {
      const [k, v] = s.split('=');
      q[k] = v;
    });

    const docs = Array.from(this.users.values()).filter((u) => {
      if (q.tenantId && u.tenantId !== q.tenantId) return false;
      if (q.identifier && u.identifier !== q.identifier) return false;
      if (q['status'] && u.status !== q['status']) return false;
      if (q.role && u.role !== q.role) return false;
      return true;
    });

    return { documents: docs };
  }

  async getDocument(dbId: string, collectionId: string, id: string) {
    const user = this.users.get(id);
    if (!user) throw new Error('Document not found');
    return user;
  }

  async createDocument(dbId: string, collectionId: string, id: string, data: any) {
    const newId = data.$id || `user-${Math.random().toString(36).slice(2, 9)}`;
    const doc = { $id: newId, ...data };
    this.users.set(newId, doc);
    return doc;
  }

  async updateDocument(dbId: string, collectionId: string, id: string, patch: any) {
    const user = this.users.get(id);
    if (!user) throw new Error('Document not found');
    const updated = { ...user, ...patch };
    this.users.set(id, updated);
    return updated;
  }

  // Helper para testes
  seedUser(user: any) {
    this.users.set(user.$id, user);
  }
}

describe('PAC-001 — Autenticação básica (sem mocks globais)', () => {
  let inmem: InMemoryAppwrite;

  beforeEach(() => {
    // Criar test-double in-memory e aplicar ao singleton existente (substituir databases apenas)
    inmem = new InMemoryAppwrite();
    const existing = AppwriteService.getInstance();
    (existing as any).databases = inmem.databases;
    jest.resetAllMocks();
  });

  test('token válido permite acesso e popula req.userId e req.user', async () => {
    const user = {
      $id: 'u1',
      tenantId: 't1',
      identifier: '52998224725',
      type: 'user',
      role: 'viewer',
      status: 'active'
    } as any;

    inmem.seedUser(user);

    const token = AuthService.generateToken(user);

    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status, json } as unknown as Response;
    const next = jest.fn();

    await authenticateMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).userId).toBe(user.$id);
    expect((req as any).user).toBeDefined();
    // validar payload do JWT
    const decoded: any = jwt.verify(token, (AuthService as any).JWT_SECRET || process.env.JWT_SECRET || 'bigtech-secret-key');
    expect(decoded.userId).toBe(user.$id);
    expect(decoded.tenantId).toBe(user.tenantId);
  });

  test('token expirado retorna 401', async () => {
    const user = { $id: 'u2', tenantId: 't2', identifier: '52998224725', type: 'user', role: 'viewer', status: 'active' } as any;
    inmem.seedUser(user);

    const secret = (AuthService as any).JWT_SECRET || process.env.JWT_SECRET || 'bigtech-secret-key';
    const expired = jwt.sign({ userId: user.$id, tenantId: user.tenantId }, secret, { expiresIn: -10 });

    const req = { headers: { authorization: `Bearer ${expired}` } } as unknown as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status, json } as unknown as Response;
    const next = jest.fn();

    await authenticateMiddleware(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  test('token mal formado retorna 401', async () => {
    const req = { headers: { authorization: 'Bearer not-a-valid-token' } } as unknown as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status, json } as unknown as Response;
    const next = jest.fn();

    await authenticateMiddleware(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  test('ausência de token retorna 401', async () => {
    const req = { headers: {} } as unknown as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status, json } as unknown as Response;
    const next = jest.fn();

    await authenticateMiddleware(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: expect.any(String) }));
    expect(next).not.toHaveBeenCalled();
  });

  test('token com tenant diferente do usuário resulta em 401', async () => {
    const user = { $id: 'u3', tenantId: 't3', identifier: '52998224725', type: 'user', role: 'viewer', status: 'active' } as any;
    inmem.seedUser(user);

    // criar token com tenant diferente
    const secret = (AuthService as any).JWT_SECRET || process.env.JWT_SECRET || 'bigtech-secret-key';
    const token = jwt.sign({ userId: user.$id, tenantId: 'other-tenant' }, secret, { expiresIn: '1h' });

    const req = { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status, json } as unknown as Response;
    const next = jest.fn();

    await authenticateMiddleware(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
