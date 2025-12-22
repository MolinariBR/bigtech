import AuthService from '../src/core/auth';
import { AppwriteService } from '../src/lib/appwrite';

// Test-double in-memory minimal para Appwrite Databases
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

    // Aplicar filtros simples do formato `field=value` e flags como `status=active`
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

  // Helpers para asserções nos testes
  allDocs(collection = 'users', dbId = process.env.APPWRITE_DATABASE_ID || 'bigtechdb') {
    const key = `${dbId}:${collection}`;
    return (this.storage[key] || []).slice();
  }
}

describe('PAC-002 — Registro de usuário', () => {
  let inmem: InMemoryAppwrite;
  let appwriteInstance: any;

  const tenantId = 'tenant-test';
  // CPF válido de exemplo (formato apenas dígitos) - deve passar validação do algoritmo
  const validCpf = '11144477735';

  beforeEach(() => {
    inmem = new InMemoryAppwrite();
    appwriteInstance = AppwriteService.getInstance();
    // Injetar a instância de databases do test-double no singleton existente
    (appwriteInstance as any).databases = inmem.databases;
  });

  test('validação de payload: identificador inválido retorna erro', async () => {
    const res = await AuthService.login('123', tenantId);
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/CPF\/CNPJ inválido/i);
  });

  test('criação no Appwrite quando usuário não existe', async () => {
    // Verificar que storage está vazia antes
    expect(inmem.allDocs().length).toBe(0);

    const res = await AuthService.login(validCpf, tenantId);

    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user.id).toBeDefined();

    // Um documento deve ter sido criado na coleção users
    const docs = inmem.allDocs();
    expect(docs.length).toBe(1);
    const created = docs[0];
    expect(created.identifier).toBe(validCpf);
    expect(created.tenantId).toBe(tenantId);

    // O refreshToken deve ter sido salvo no documento (generateRefreshToken faz update)
    const stored = created.refreshToken;
    expect(typeof stored).toBe('string');
    // E o refreshToken retornado pela função deve bater com o salvo
    expect(res.refreshToken).toBeDefined();
    expect(res.refreshToken).toBe(stored);
  });

  test('não cria novo usuário quando identificador já existe (duplicidade)', async () => {
    // Criar um usuário manualmente no test-double
    const precreated = await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', {
      tenantId,
      identifier: validCpf,
      status: 'active',
      type: 'user',
      role: 'viewer',
      credits: 0
    });

    const beforeCount = inmem.allDocs().length;

    const res = await AuthService.login(validCpf, tenantId);

    expect(res.success).toBe(true);
    expect(res.user.id).toBe(precreated.$id);

    const afterCount = inmem.allDocs().length;
    // Nenhum documento adicional deve ter sido criado
    expect(afterCount).toBe(beforeCount);
  });
});
