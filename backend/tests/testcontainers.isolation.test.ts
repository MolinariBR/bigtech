import { GenericContainer } from 'testcontainers';

describe('Testcontainers - Isolamento Multi-Tenant (E2E)', () => {
  jest.setTimeout(120000);

  let container1: any;
  let container2: any;

  afterAll(async () => {
    if (container1) await container1.stop();
    if (container2) await container2.stop();
  });

  test('Deve levantar dois containers isolados com TENANT_ID diferente', async () => {
    // Start container para tenant1
    container1 = await new GenericContainer('alpine:3.18')
      .withCommand(['sh', '-c', 'export TENANT_ID=tenant-one && echo "$TENANT_ID" > /tenant_id.txt && sleep 60'])
      .withExposedPorts(80)
      .start();

    // Start container para tenant2
    container2 = await new GenericContainer('alpine:3.18')
      .withCommand(['sh', '-c', 'export TENANT_ID=tenant-two && echo "$TENANT_ID" > /tenant_id.txt && sleep 60'])
      .withExposedPorts(80)
      .start();

    // Executar comando para ler o arquivo com TENANT_ID
    const exec1 = await container1.exec(['cat', '/tenant_id.txt']);
    const exec2 = await container2.exec(['cat', '/tenant_id.txt']);

    const out1 = Array.isArray(exec1.output) ? exec1.output.join('') : String(exec1.output || '');
    const out2 = Array.isArray(exec2.output) ? exec2.output.join('') : String(exec2.output || '');

    // Normalizar saída
    const tenantValue1 = out1.trim();
    const tenantValue2 = out2.trim();

    expect(tenantValue1).toBe('tenant-one');
    expect(tenantValue2).toBe('tenant-two');
    expect(tenantValue1).not.toBe(tenantValue2);

    // Verificar que containers estão distintos
    expect(container1.getId()).not.toBe(container2.getId());
  });
});
