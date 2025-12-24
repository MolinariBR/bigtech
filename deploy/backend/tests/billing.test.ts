import { billingEngine } from '../src/core/billingEngine';
import { AppwriteService } from '../src/lib/appwrite';

// InMemory Appwrite helper (same pattern used across auth tests)
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

describe('PAC-007 — Billing Engine', () => {
  let inmem: InMemoryAppwrite;
  let appwriteInstance: any;

  const tenantId = 'tenant-billing-test';

  beforeEach(() => {
    inmem = new InMemoryAppwrite();
    appwriteInstance = AppwriteService.getInstance();
    (appwriteInstance as any).databases = inmem.databases;
  });

  test('normalização monetária para duas casas decimais via creditPurchase', async () => {
    const user = await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', {
      tenantId,
      identifier: '00000000000',
      status: 'active',
      credits: 10
    });

    // crédito com valor que causa float impreciso
    const res = await billingEngine.creditPurchase({ tenantId, userId: user.$id, type: 'credit_purchase', amount: 1.005, currency: 'BRL' } as any);
    expect(res.success).toBe(true);

    const updated = await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id);
    // 10 + 1.005 normalizado => 1.01 => 11.01
    expect(updated.credits).toBeCloseTo(11.01, 2);
  });

  test('débito respeita saldo e cria transação; falha em saldo insuficiente', async () => {
    const user = await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', {
      tenantId,
      identifier: '00000000001',
      status: 'active',
      credits: 5
    });

    // débito menor que saldo
    const ok = await billingEngine.debitCredits({ tenantId, userId: user.$id, type: 'query_debit', amount: -3, currency: 'BRL' } as any);
    expect(ok.success).toBe(true);
    const after1 = await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id);
    expect(after1.credits).toBe(2);

    // débito que ultrapassa saldo
    const fail = await billingEngine.debitCredits({ tenantId, userId: user.$id, type: 'query_debit', amount: -10, currency: 'BRL' } as any);
    expect(fail.success).toBe(false);
    expect(fail.error).toMatch(/Saldo insuficiente/i);

    const after2 = await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id);
    expect(after2.credits).toBe(2);
  });

  test('refund ajusta saldo e cria documento de reembolso', async () => {
    const user = await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', {
      tenantId,
      identifier: '00000000002',
      status: 'active',
      credits: 20
    });

    // Criar débito manualmente via engine
    const debit = await billingEngine.debitCredits({ tenantId, userId: user.$id, type: 'query_debit', amount: -5, currency: 'BRL' } as any);
    expect(debit.success).toBe(true);

    const history = await billingEngine.getTransactionHistory(user.$id);
    expect(history.length).toBeGreaterThanOrEqual(1);
    const billingId = history[0].$id || history[0].$id === undefined ? history[0].$id : history[0].$id;

    // Fazer refund
    const r = await billingEngine.refundTransaction(history[0].$id, undefined, 'teste');
    expect(r.success).toBe(true);

    const updated = await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id);
    // saldo inicial 20 -5 +5 = 20
    expect(updated.credits).toBe(20);
  });

  test('concorrência: locks por usuário previnem overdraw', async () => {
    const user = await inmem.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', {
      tenantId,
      identifier: '00000000003',
      status: 'active',
      credits: 10
    });

    // Três débitos concorrentes de 4 => apenas dois devem passar
    const promises = [
      billingEngine.debitCredits({ tenantId, userId: user.$id, type: 'query_debit', amount: -4, currency: 'BRL' } as any),
      billingEngine.debitCredits({ tenantId, userId: user.$id, type: 'query_debit', amount: -4, currency: 'BRL' } as any),
      billingEngine.debitCredits({ tenantId, userId: user.$id, type: 'query_debit', amount: -4, currency: 'BRL' } as any)
    ];

    const results = await Promise.all(promises);
    const successes = results.filter(r => r.success).length;
    const failures = results.filter(r => !r.success).length;
    expect(successes).toBe(2);
    expect(failures).toBe(1);

    const final = await inmem.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id);
    expect(final.credits).toBe(2);
  });
});
