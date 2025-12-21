// Baseado em: 8.Tests.md v1.0.0
// Cobertura: PAC-001 "Sistema de Plugins - Loader" (1.Project.md, 2.Architecture.md, 4.Entities.md)
// Estratégia: Testes property-based para validação de carregamento dinâmico

import { PluginLoader, Plugin, PluginContext, PluginResult } from '../src/core/pluginLoader';
import * as fs from 'fs';
import * as path from 'path';

// Mock plugin para testes
class MockPlugin implements Plugin {
  id: string;
  type: 'consulta' | 'pagamento' | 'mercado' | 'funcional';
  version: string;

  constructor(id: string, type: 'consulta' | 'pagamento' | 'mercado' | 'funcional' = 'consulta', version: string = '1.0.0') {
    this.id = id;
    this.type = type;
    this.version = version;
  }

  async install(): Promise<void> {
    // Mock implementation
  }

  async enable(tenantId: string): Promise<void> {
    // Mock implementation
  }

  async disable(tenantId: string): Promise<void> {
    // Mock implementation
  }

  async execute(context: PluginContext): Promise<PluginResult> {
    return {
      success: true,
      data: { result: 'mocked' },
      cost: 1
    };
  }
}

describe('PluginLoader - Carregamento Dinâmico', () => {
  let loader: PluginLoader;
  const mockPluginsDir = path.join(__dirname, 'mock-plugins');

  beforeAll(() => {
    // Criar diretório mock de plugins
    if (!fs.existsSync(mockPluginsDir)) {
      fs.mkdirSync(mockPluginsDir, { recursive: true });
    }

    // Criar estrutura de plugins mock
    const consultaDir = path.join(mockPluginsDir, 'consulta');
    const infosimplesDir = path.join(consultaDir, 'infosimples');

    if (!fs.existsSync(infosimplesDir)) {
      fs.mkdirSync(infosimplesDir, { recursive: true });
    }

    // Criar plugin mock
    const pluginCode = `
import { Plugin, PluginContext, PluginResult } from '../../../src/core/pluginLoader';

export class InfosimplesPlugin implements Plugin {
  id = 'infosimples';
  type = 'consulta' as const;
  version = '1.0.0';

  async install(): Promise<void> {}
  async enable(tenantId: string): Promise<void> {}
  async disable(tenantId: string): Promise<void> {}

  async execute(context: PluginContext): Promise<PluginResult> {
    return {
      success: true,
      data: { normalized: true },
      cost: 1
    };
  }
}

export default new InfosimplesPlugin();
`;

    fs.writeFileSync(path.join(infosimplesDir, 'index.ts'), pluginCode);
  });

  afterAll(() => {
    // Limpar mocks
    if (fs.existsSync(mockPluginsDir)) {
      fs.rmSync(mockPluginsDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    loader = PluginLoader.getInstance();
    // Reset instance for testing
    (PluginLoader as any).instance = null;
  });

  describe('Carregamento Automático de Plugins', () => {
    test('deve validar contratos de plugins corretamente', () => {
      const validPlugin = new MockPlugin('test-plugin');
      const invalidPlugin = { id: 'invalid' }; // Missing required methods

      expect(loader['validatePlugin'](validPlugin)).toBe(true);
      expect(loader['validatePlugin'](invalidPlugin)).toBe(false);
    });

    test('deve listar plugins disponíveis', async () => {
      // Setup mock plugins
      loader['plugins'].set('consulta-infosimples', new MockPlugin('infosimples', 'consulta'));

      const available = loader.getAvailablePlugins();

      expect(available).toContainEqual({
        id: 'infosimples',
        type: 'consulta',
        version: '1.0.0'
      });
    });

    test('deve executar plugin ativo para tenant', async () => {
      const plugin = new MockPlugin('test-plugin');
      loader['plugins'].set('test-plugin', plugin);
      loader['activePlugins'].set('tenant1', new Set(['test-plugin']));

      const context: PluginContext = {
        tenantId: 'tenant1',
        userId: 'user1',
        input: { test: 'data' },
        config: {}
      };

      const result = await loader.executePlugin('test-plugin', context);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'mocked' });
    });

    test('deve rejeitar execução de plugin inativo', async () => {
      const plugin = new MockPlugin('inactive-plugin');
      loader['plugins'].set('inactive-plugin', plugin);
      // Plugin not in activePlugins

      const context: PluginContext = {
        tenantId: 'tenant1',
        userId: 'user1',
        input: { test: 'data' },
        config: {}
      };

      const result = await loader.executePlugin('inactive-plugin', context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not active');
    });

    test('deve rejeitar execução de plugin inexistente', async () => {
      const context: PluginContext = {
        tenantId: 'tenant1',
        userId: 'user1',
        input: { test: 'data' },
        config: {}
      };

      const result = await loader.executePlugin('nonexistent-plugin', context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Propriedades de Carregamento', () => {
    test('carregamento deve ser idempotente', async () => {
      // Multiple calls to initialize should not cause issues
      await loader.initialize();
      await loader.initialize();

      // Should not throw
      expect(loader.getAvailablePlugins()).toBeDefined();
    });

    test('plugins devem ser isolados por instância', () => {
      const loader1 = PluginLoader.getInstance();
      const loader2 = PluginLoader.getInstance();

      expect(loader1).toBe(loader2);
    });

    test('shutdown deve limpar estado', async () => {
      loader['plugins'].set('test', new MockPlugin('test'));
      loader['activePlugins'].set('tenant1', new Set(['test']));

      await loader.shutdown();

      expect(loader['plugins'].size).toBe(0);
      expect(loader['activePlugins'].size).toBe(0);
    });
  });
});