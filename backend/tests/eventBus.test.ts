import { eventBus } from '../src/core/eventBus';

describe('PAC-008 — Event Bus', () => {
  afterEach(async () => {
    await eventBus.shutdown();
  });

  test('subscribe e publish entregam evento aos handlers', async () => {
    const received: any[] = [];
    const handler = (ev: any) => { received.push(ev); };

    eventBus.subscribe('test.event', handler);

    await eventBus.publish({ tenantId: 't1', type: 'test.event', payload: { x: 1 } as any });

    expect(received.length).toBe(1);
    expect(received[0].payload.x).toBe(1);
    expect(received[0].tenantId).toBe('t1');
  });

  test('múltiplos subscribers recebem o evento', async () => {
    const calls: string[] = [];
    const h1 = async (ev: any) => { calls.push('h1'); };
    const h2 = async (ev: any) => { calls.push('h2'); };

    eventBus.subscribe('multi.event', h1);
    eventBus.subscribe('multi.event', h2);

    await eventBus.publish({ tenantId: 't2', type: 'multi.event', payload: {} as any });

    expect(calls).toContain('h1');
    expect(calls).toContain('h2');
  });

  test('unsubscribe remove o handler', async () => {
    const calls: string[] = [];
    const h = (ev: any) => { calls.push('x'); };

    eventBus.subscribe('u.event', h);
    eventBus.unsubscribe('u.event', h);

    await eventBus.publish({ tenantId: 't3', type: 'u.event', payload: {} as any });

    expect(calls.length).toBe(0);
  });

  test('ordering: handlers executam na ordem de inscrição', async () => {
    const order: string[] = [];
    const a = async () => { order.push('a'); };
    const b = async () => { order.push('b'); };

    eventBus.subscribe('ord.event', a);
    eventBus.subscribe('ord.event', b);

    await eventBus.publish({ tenantId: 't4', type: 'ord.event', payload: {} as any });

    expect(order).toEqual(['a', 'b']);
  });

  test('handler que lança erro não impede outros handlers', async () => {
    const calls: string[] = [];
    const bad = async () => { throw new Error('boom'); };
    const ok = async () => { calls.push('ok'); };

    eventBus.subscribe('err.event', bad);
    eventBus.subscribe('err.event', ok);

    // não deve rejeitar
    await expect(eventBus.publish({ tenantId: 't5', type: 'err.event', payload: {} as any })).resolves.toBeUndefined();
    expect(calls).toEqual(['ok']);
  });

  test('waitForEvent resolve quando evento publicado (filtro tenant)', async () => {
    const waitPromise = eventBus.waitForEvent('wait.event', 'tenant-w');

    // publicar evento para outro tenant - não deve resolver
    await eventBus.publish({ tenantId: 'tenant-other', type: 'wait.event', payload: {} as any });

    // publicar o evento esperado
    await eventBus.publish({ tenantId: 'tenant-w', type: 'wait.event', payload: { ok: true } as any });

    const ev = await waitPromise;
    expect(ev.tenantId).toBe('tenant-w');
    expect(ev.payload.ok).toBe(true);
  });
});
