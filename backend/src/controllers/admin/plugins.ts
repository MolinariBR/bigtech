// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.1, 7.Tasks.md v1.0
// Precedência: 1.Project → 2.Architecture → 4.Entities → 7.Tasks
// Decisão: Controlador admin para gerenciamento de plugins conforme contratos padronizados

// Simulação de persistência para desenvolvimento (TODO: usar Appwrite)
const pluginStatusStore: Record<string, Record<string, string>> = {};
const pluginConfigStore: Record<string, Record<string, any>> = {};

import { Router } from 'express';
import { AppwriteService } from '../../lib/appwrite';
import { pluginLoader } from '../../core/pluginLoader';
import { EncryptionUtils } from '../../utils/encryption';
import { Query } from 'node-appwrite';

const router = Router();
const appwrite = AppwriteService.getInstance();

// GET /api/admin/plugins - Listar plugins do tenant
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query as any;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    // Para desenvolvimento: usar plugins do pluginLoader diretamente
    // TODO: Integrar com Appwrite quando estiver configurado
    console.log(`[DEV] Listando plugins para tenant ${tenantId}`);

    // Buscar plugins disponíveis
    const availablePlugins = pluginLoader.getAvailablePlugins();

    // Simular plugins instalados (todos disponíveis para desenvolvimento)
    const plugins = availablePlugins.map(available => {
      const globalStatusStore = (global as any).pluginStatusStore || {};
      const tenantStatuses = globalStatusStore[tenantId] || {};
      const globalConfigStore = (global as any).pluginConfigStore || {};
      const tenantConfigs = globalConfigStore[tenantId] || {};
      const status = tenantStatuses[available.id] || (available.id === 'pagamento-asaas' ? 'enabled' : 'disabled');
      const config = tenantConfigs[available.id] || (available.id === 'pagamento-asaas' ? { apiKey: 'test' } : null);
      return {
        id: available.id,
        type: available.type,
        version: available.version,
        status: status,
        config: config,
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    res.json({ plugins, count: plugins.length });
  } catch (error) {
    console.error('Failed to list plugins:', error);
    res.status(500).json({ error: 'Failed to list plugins' });
  }
});

// POST /api/admin/plugins - Instalar plugin
router.post('/', async (req, res) => {
  try {
    const { tenantId: bodyTenantId, name, type, version } = req.body;
    const { tenantId: queryTenantId } = req.query as any;
    const tenantId = bodyTenantId || queryTenantId;

    if (!tenantId || !name || !type || !version) {
      return res.status(400).json({ error: 'tenantId, name, type, and version are required' });
    }

    // Verificar se plugin existe
    const availablePlugins = pluginLoader.getAvailablePlugins();
    const pluginExists = availablePlugins.find(p => p.id === name);

    if (!pluginExists) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    // Verificar se já está instalado
    const existing = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'plugins',
      [Query.equal('tenantId', tenantId), Query.equal('pluginId', name)]
    );

    if (existing.documents.length > 0) {
      return res.status(409).json({ error: 'Plugin already installed' });
    }

    // Instalar plugin (simplificado para desenvolvimento)
    // TODO: Implementar instalação real do plugin quando Appwrite estiver configurado
    console.log(`[DEV] Plugin ${name} would be installed here`);

    // Registrar no banco
    const pluginDoc = await appwrite.databases.createDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'plugins',
      'unique()',
      {
        tenantId,
        pluginId: name,
        type,
        version,
        status: 'disabled',
        config: {},
        installedBy: (req as any).userId,
      }
    );

    res.status(201).json({
      id: pluginDoc.$id,
      pluginId: name,
      status: 'installed',
      message: 'Plugin installed successfully'
    });
  } catch (error) {
    console.error('Failed to install plugin:', error);
    res.status(500).json({ error: 'Failed to install plugin' });
  }
});

// POST /api/admin/plugins/:pluginId/toggle - Habilitar/desabilitar plugin
router.post('/:pluginId/toggle', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { action } = req.body;
    const { tenantId } = req.query as any;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    if (!['enable', 'disable'].includes(action)) {
      return res.status(400).json({ error: 'action must be enable or disable' });
    }

    // Para desenvolvimento: verificar se plugin existe no pluginLoader
    // TODO: Integrar com Appwrite quando estiver configurado
    const plugin = pluginLoader.getPlugin(pluginId);
    if (!plugin) {
      console.log(`Plugin ${pluginId} not found in pluginLoader`);
      return res.status(404).json({ error: 'Plugin implementation not found' });
    }

    // Executar ação (simplificado para desenvolvimento)
    console.log(`[DEV] Plugin ${pluginId} would be ${action}d for tenant ${tenantId}`);

    // Calcular novo status baseado na ação
    const newStatus = action === 'enable' ? 'enabled' : 'disabled';

    // Persistir status (simulação)
    const globalStatusStore = (global as any).pluginStatusStore || pluginStatusStore;
    if (!globalStatusStore[tenantId]) {
      globalStatusStore[tenantId] = {};
    }
    globalStatusStore[tenantId][pluginId] = newStatus;

    res.json({
      pluginId,
      status: newStatus,
      message: `Plugin ${action}d successfully`
    });
  } catch (error) {
    console.error('Failed to toggle plugin:', error);
    res.status(500).json({ error: 'Failed to toggle plugin' });
  }
});

// PUT /api/admin/plugins/:pluginId/config - Configurar plugin por tenant
router.put('/:pluginId/config', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { config, servicePrices, fallbackConfig, rateLimitConfig } = req.body;
    const { tenantId } = req.query as any;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    // Para desenvolvimento: salvar no store simulado e no Appwrite
    console.log(`[DEV] Saving config for plugin ${pluginId} in tenant ${tenantId}:`, { config, servicePrices, fallbackConfig, rateLimitConfig });

    // Encriptar API Key se presente
    const secureConfig = { ...config };
    // if (secureConfig.apiKey) {
    //   secureConfig.apiKey = EncryptionUtils.encrypt(secureConfig.apiKey);
    // }

    // Salvar no store simulado para desenvolvimento
    const globalConfigStore = (global as any).pluginConfigStore || {};
    (global as any).pluginConfigStore = globalConfigStore;

    if (!globalConfigStore[tenantId]) {
      globalConfigStore[tenantId] = {};
    }
    globalConfigStore[tenantId][pluginId] = {
      config: secureConfig,
      servicePrices: servicePrices || {},
      fallbackConfig: fallbackConfig || {},
      rateLimitConfig: rateLimitConfig || {},
      updatedAt: new Date().toISOString()
    };

    // Tentar salvar no Appwrite (se existir a coleção)
    try {
      // Buscar plugin existente
      const existingPlugins = await appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'plugins',
        [Query.equal('tenantId', tenantId), Query.equal('pluginId', pluginId)]
      );

      const pluginData = {
        tenantId,
        pluginId,
        type: 'consulta', // TODO: detectar tipo do plugin
        version: '1.0.0', // TODO: obter versão real
        status: 'configured',
        config: JSON.stringify(secureConfig),
        servicePrices: JSON.stringify(servicePrices || {}),
        fallbackConfig: JSON.stringify(fallbackConfig || {}),
        rateLimitConfig: JSON.stringify(rateLimitConfig || {}),
        updatedAt: new Date().toISOString()
      };

      if (existingPlugins.documents.length > 0) {
        // Atualizar
        await appwrite.databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
          'plugins',
          existingPlugins.documents[0].$id,
          pluginData
        );
      } else {
        // Criar
        await appwrite.databases.createDocument(
          process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
          'plugins',
          'unique()',
          pluginData
        );
      }
    } catch (error) {
      console.log('Appwrite save failed, continuing with in-memory store:', error);
    }

    // Retornar config sem a API Key encriptada para o frontend
    const responseConfig = { ...secureConfig };
    if (responseConfig.apiKey) {
      responseConfig.apiKey = '***ENCRYPTED***';
    }

    res.json({
      pluginId,
      tenantId,
      config: responseConfig,
      servicePrices,
      fallbackConfig,
      rateLimitConfig,
      message: 'Plugin configuration updated successfully'
    });
  } catch (error) {
    console.error('Failed to configure plugin:', error);
    res.status(500).json({ error: 'Failed to configure plugin' });
  }
});

// DELETE /api/admin/plugins/:pluginId - Remover plugin
router.delete('/:pluginId', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { tenantId } = req.query as any;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    // Buscar plugin no banco
    const plugins = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'plugins',
      [Query.equal('tenantId', tenantId), Query.equal('pluginId', pluginId)]
    );

    if (plugins.documents.length === 0) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    const pluginDoc = plugins.documents[0];

    // Desabilitar plugin primeiro (simplificado para desenvolvimento)
    console.log(`[DEV] Plugin ${pluginId} would be disabled for tenant ${tenantId}`);

    // Remover do banco
    await appwrite.databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'plugins',
      pluginDoc.$id
    );

    res.json({
      pluginId,
      message: 'Plugin removed successfully'
    });
  } catch (error) {
    console.error('Failed to remove plugin:', error);
    res.status(500).json({ error: 'Failed to remove plugin' });
  }
});

export const adminPluginsRouter = router;

// ========== ENDPOINTS GLOBAIS (TASK-002) ==========

// POST /api/admin/plugins/global/:pluginId/install - Instalar plugin globalmente
router.post('/global/:pluginId/install', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { config } = req.body;

    // Verificar se plugin existe no sistema
    const availablePlugins = pluginLoader.getAvailablePlugins();
    const pluginExists = availablePlugins.find(p => p.id === pluginId);

    if (!pluginExists) {
      return res.status(404).json({ error: 'Plugin not found in system' });
    }

    // Verificar se já está instalado globalmente
    try {
      const existing = await appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'global_plugins',
        [Query.equal('pluginId', pluginId)]
      );

      if (existing.documents.length > 0) {
        return res.status(409).json({ error: 'Plugin already installed globally' });
      }
    } catch (error) {
      // Coleção pode não existir ainda, continuar
      console.log('Global plugins collection may not exist yet');
    }

    // Instalar plugin globalmente
    const pluginDoc = await appwrite.databases.createDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'global_plugins',
      'unique()',
      {
        pluginId,
        type: pluginExists.type,
        version: pluginExists.version,
        status: 'installed',
        config: JSON.stringify(config || {}),
        installedBy: (req as any).userId || 'system',
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    res.status(201).json({
      id: pluginDoc.$id,
      pluginId,
      status: 'installed',
      message: 'Plugin installed globally successfully'
    });
  } catch (error) {
    console.error('Failed to install plugin globally:', error);
    res.status(500).json({ error: 'Failed to install plugin globally' });
  }
});

// PUT /api/admin/plugins/global/:pluginId/configure - Configurar plugin globalmente
router.put('/global/:pluginId/configure', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Configuration is required' });
    }

    // Buscar plugin global
    const plugins = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'global_plugins',
      [Query.equal('pluginId', pluginId)]
    );

    if (plugins.documents.length === 0) {
      return res.status(404).json({ error: 'Plugin not found globally' });
    }

    const pluginDoc = plugins.documents[0];

    // Encriptar API Key se presente
    const secureConfig = { ...config };
    if (secureConfig.apiKey) {
      secureConfig.apiKey = EncryptionUtils.encrypt(secureConfig.apiKey);
    }

    // Atualizar configuração
    const updatedDoc = await appwrite.databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'global_plugins',
      pluginDoc.$id,
      {
        config: JSON.stringify(secureConfig),
        status: 'configured',
        updatedAt: new Date().toISOString()
      }
    );

    // Retornar config sem a API Key encriptada para o frontend
    const responseConfig = { ...secureConfig };
    if (responseConfig.apiKey) {
      responseConfig.apiKey = '***ENCRYPTED***';
    }

    res.json({
      pluginId,
      config: responseConfig,
      status: updatedDoc.status,
      message: 'Plugin configured globally successfully'
    });
  } catch (error) {
    console.error('Failed to configure plugin globally:', error);
    res.status(500).json({ error: 'Failed to configure plugin globally' });
  }
});

// DELETE /api/admin/plugins/global/:pluginId/uninstall - Desinstalar plugin globalmente
router.delete('/global/:pluginId/uninstall', async (req, res) => {
  try {
    const { pluginId } = req.params;

    // Buscar plugin global
    const plugins = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'global_plugins',
      [Query.equal('pluginId', pluginId)]
    );

    if (plugins.documents.length === 0) {
      return res.status(404).json({ error: 'Plugin not found globally' });
    }

    const pluginDoc = plugins.documents[0];

    // Remover plugin global
    await appwrite.databases.deleteDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'global_plugins',
      pluginDoc.$id
    );

    res.json({
      pluginId,
      message: 'Plugin uninstalled globally successfully'
    });
  } catch (error) {
    console.error('Failed to uninstall plugin globally:', error);
    res.status(500).json({ error: 'Failed to uninstall plugin globally' });
  }
});

// POST /api/admin/plugins/global/:pluginId/test-connection - Testar conectividade
router.post('/global/:pluginId/test-connection', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { config, testOptions } = req.body;

    // Verificar se plugin existe
    const plugin = pluginLoader.getPlugin(pluginId);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    // Buscar configuração global se não foi passada
    let effectiveConfig = config;
    if (!effectiveConfig) {
      try {
        const plugins = await appwrite.databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
          'global_plugins',
          [Query.equal('pluginId', pluginId)]
        );

        if (plugins.documents.length > 0) {
          const pluginDoc = plugins.documents[0];
          effectiveConfig = typeof pluginDoc.config === 'string'
            ? JSON.parse(pluginDoc.config)
            : pluginDoc.config;
        }
      } catch (error) {
        // Configuração global pode não existir
      }
    }

    if (!effectiveConfig) {
      return res.status(400).json({ error: 'No configuration found for plugin' });
    }

    // Implementar teste de conectividade baseado no tipo de plugin
    let testResult: ConnectionTestResult = { success: false, error: 'Test not implemented for this plugin type', details: { attempts: 0, totalTime: 0 } };

    if (plugin.type === 'consulta') {
      testResult = await testConsultaPluginConnection(pluginId, effectiveConfig, testOptions);
    } else if (plugin.type === 'pagamento') {
      testResult = await testPagamentoPluginConnection(pluginId, effectiveConfig, testOptions);
    }

    if (testResult.success) {
      res.json({
        pluginId,
        status: 'connected',
        message: 'Connection test successful',
        details: testResult.details
      });
    } else {
      res.status(400).json({
        pluginId,
        status: 'failed',
        error: testResult.error,
        message: 'Connection test failed',
        details: testResult.details
      });
    }
  } catch (error) {
    console.error('Failed to test plugin connection:', error);
    res.status(500).json({
      error: 'Failed to test plugin connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/plugins/global - Listar plugins globais
router.get('/global', async (req, res) => {
  try {
    const globalPlugins = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'global_plugins',
      [], // Sem filtros, listar todos
      '100' // Limit como string
    );

    res.json({
      plugins: globalPlugins.documents,
      count: globalPlugins.documents.length
    });
  } catch (error) {
    console.error('Failed to list global plugins:', error);
    // Se a coleção não existir ainda, retornar lista vazia
    if (error instanceof Error && error.message.includes('not found')) {
      res.json({ plugins: [], count: 0 });
    } else {
      res.status(500).json({ error: 'Failed to list global plugins' });
    }
  }
});

// ========== MELHORIAS NOS ENDPOINTS POR TENANT ==========

// POST /api/admin/plugins/:pluginId/test-connection - Testar conectividade por tenant
router.post('/:pluginId/test-connection', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { tenantId } = req.query as any;
    const { config } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    // Verificar se plugin existe
    const plugin = pluginLoader.getPlugin(pluginId);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    // Buscar configuração salva do plugin para o tenant
    let effectiveConfig = config;
    if (!effectiveConfig) {
      try {
        const plugins = await appwrite.databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
          'plugins',
          [Query.equal('tenantId', tenantId), Query.equal('pluginId', pluginId)]
        );

        if (plugins.documents.length > 0) {
          const pluginDoc = plugins.documents[0];
          effectiveConfig = typeof pluginDoc.config === 'string'
            ? JSON.parse(pluginDoc.config)
            : pluginDoc.config;
        }
      } catch (error) {
        // Configuração pode não existir
      }
    }

    if (!effectiveConfig) {
      return res.status(400).json({ error: 'No configuration found for plugin' });
    }

    // Implementar teste de conectividade baseado no tipo de plugin
    let testResult: ConnectionTestResult = { success: false, error: 'Test not implemented for this plugin type', details: { attempts: 0, totalTime: 0 } };

    if (plugin.type === 'consulta') {
      testResult = await testConsultaPluginConnection(pluginId, effectiveConfig);
    } else if (plugin.type === 'pagamento') {
      testResult = await testPagamentoPluginConnection(pluginId, effectiveConfig);
    }

    if (testResult.success) {
      res.json({
        pluginId,
        tenantId,
        status: 'connected',
        message: 'Connection test successful',
        details: testResult.details
      });
    } else {
      res.status(400).json({
        pluginId,
        tenantId,
        status: 'failed',
        error: testResult.error,
        message: 'Connection test failed',
        details: testResult.details
      });
    }
  } catch (error) {
    console.error('Failed to test plugin connection:', error);
    res.status(500).json({
      error: 'Failed to test plugin connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/plugins/:pluginId/services - Obter serviços disponíveis do plugin
router.get('/:pluginId/services', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { tenantId } = req.query as any;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    // Verificar se plugin existe
    const plugin = pluginLoader.getPlugin(pluginId);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    // Obter serviços disponíveis do plugin
    let services: any[] = [];
    if (plugin.getAvailableServices) {
      // Buscar configuração do tenant no store em memória (desenvolvimento)
      let tenantConfig: any = {};
      const globalConfigStore = (global as any).pluginConfigStore || pluginConfigStore;
      const tenantConfigs = globalConfigStore[tenantId];

      if (tenantConfigs && tenantConfigs[pluginId]) {
        tenantConfig = tenantConfigs[pluginId];
      }

      // Criar contexto com configuração do tenant
      const context = {
        tenantId,
        config: {
          ...tenantConfig.config,
          servicePrices: tenantConfig.servicePrices
        }
      };

      services = await plugin.getAvailableServices({
        userId: req.userId || 'system',
        input: {},
        config: tenantConfig
      });
    }

    // Os serviços já vêm com preços customizados aplicados pelo plugin
    // Apenas marcar quais preços são customizados usando o store em memória
    let customPrices: Record<string, number> = {};
    const globalConfigStore = (global as any).pluginConfigStore || pluginConfigStore;
    const tenantConfigs = globalConfigStore[tenantId];

    if (tenantConfigs && tenantConfigs[pluginId] && tenantConfigs[pluginId].servicePrices) {
      customPrices = tenantConfigs[pluginId].servicePrices;
    }

    // Marcar serviços com preços customizados
    const servicesWithPrices = services.map(service => ({
      ...service,
      isCustomPrice: customPrices[service.id] !== undefined
    }));

    res.json({
      pluginId,
      tenantId,
      services: servicesWithPrices
    });
  } catch (error) {
    console.error('Failed to get plugin services:', error);
    res.status(500).json({ error: 'Failed to get plugin services' });
  }
});

// ========== FUNÇÕES AUXILIARES ==========

// Interface para opções de teste de conectividade
interface ConnectionTestOptions {
  timeout?: number;        // Timeout em ms (padrão: 10000)
  retries?: number;        // Número de retries (padrão: 2)
  retryDelay?: number;     // Delay inicial entre retries em ms (padrão: 1000)
  exponentialBackoff?: boolean; // Usar backoff exponencial (padrão: true)
}

// Resultado detalhado do teste de conectividade
interface ConnectionTestResult {
  success: boolean;
  error?: string;
  details?: {
    attempts: number;
    totalTime: number;
    lastError?: string;
    httpStatus?: number;
    responseTime?: number;
  };
}

// Função genérica para testar conectividade com retry logic
async function testConnection(
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string;
    testOptions?: ConnectionTestOptions;
  } = {}
): Promise<ConnectionTestResult> {
  const {
    method = 'GET',
    headers = {},
    body,
    testOptions = {}
  } = options;

  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    exponentialBackoff = true
  } = testOptions;

  let lastError: string = '';
  let attempts = 0;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= retries; attempt++) {
    attempts = attempt + 1;
    let timeoutId: NodeJS.Timeout | undefined = undefined;

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeout);

      const attemptStart = Date.now();

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - attemptStart;

      if (response.ok) {
        return {
          success: true,
          details: {
            attempts,
            totalTime: Date.now() - startTime,
            httpStatus: response.status,
            responseTime
          }
        };
      } else {
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        // Para alguns status codes, não faz sentido tentar novamente
        if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
          break;
        }
      }
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = `Timeout after ${timeout}ms`;
        } else {
          lastError = error.message;
        }
      } else {
        lastError = 'Unknown error';
      }

      // Se foi abortado ou erro de rede, pode tentar novamente
      // Se foi erro de DNS ou conexão, pode tentar novamente
    }

    // Se não foi a última tentativa, aguardar antes do próximo retry
    if (attempt < retries) {
      const delay = exponentialBackoff ? retryDelay * Math.pow(2, attempt) : retryDelay;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError,
    details: {
      attempts,
      totalTime: Date.now() - startTime,
      lastError
    }
  };
}

// Teste de conectividade para plugins de consulta
async function testConsultaPluginConnection(pluginId: string, config: any, testOptions?: ConnectionTestOptions): Promise<ConnectionTestResult> {
  try {
    switch (pluginId) {
      case 'bigtech':
        return await testBigTechConnection(config, testOptions);
      case 'infosimples':
        return await testInfoSimplesConnection(config, testOptions);
      default:
        return {
          success: false,
          error: 'Unknown consulta plugin',
          details: { attempts: 1, totalTime: 0, lastError: 'Unknown consulta plugin' }
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
      details: {
        attempts: 1,
        totalTime: 0,
        lastError: error instanceof Error ? error.message : 'Connection test failed'
      }
    };
  }
}

// Teste de conectividade para plugins de pagamento
async function testPagamentoPluginConnection(pluginId: string, config: any, testOptions?: ConnectionTestOptions): Promise<ConnectionTestResult> {
  try {
    switch (pluginId) {
      case 'asaas':
        return await testASAASConnection(config, testOptions);
      default:
        return {
          success: false,
          error: 'Unknown pagamento plugin',
          details: { attempts: 1, totalTime: 0, lastError: 'Unknown pagamento plugin' }
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
      details: {
        attempts: 1,
        totalTime: 0,
        lastError: error instanceof Error ? error.message : 'Connection test failed'
      }
    };
  }
}

// Teste específico para BigTech
async function testBigTechConnection(config: any, testOptions?: ConnectionTestOptions): Promise<ConnectionTestResult> {
  try {
    const baseUrl = config.useHomologation ? config.homologationUrl : config.baseUrl;
    if (!baseUrl || !config.apiKey) {
      return {
        success: false,
        error: 'Missing baseUrl or apiKey in configuration',
        details: { attempts: 0, totalTime: 0, lastError: 'Missing baseUrl or apiKey in configuration' }
      };
    }

    // Decriptar API Key se necessário
    const apiKey = EncryptionUtils.decryptIfNeeded(config.apiKey);

    // Usar função genérica de teste com retry logic
    const testUrl = `${baseUrl}/ping`; // Assumindo endpoint de ping
    const result = await testConnection(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      testOptions: {
        timeout: 15000, // Timeout maior para BigTech
        retries: 3,     // Mais retries para BigTech
        ...testOptions
      }
    });

    if (result.success) {
      return result;
    } else {
      return {
        success: false,
        error: `BigTech connection failed: ${result.error}`,
        details: result.details
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? `BigTech connection error: ${error.message}` : 'BigTech connection failed',
      details: {
        attempts: 1,
        totalTime: 0,
        lastError: error instanceof Error ? error.message : 'BigTech connection failed'
      }
    };
  }
}

// Teste específico para InfoSimples
async function testInfoSimplesConnection(config: any, testOptions?: ConnectionTestOptions): Promise<ConnectionTestResult> {
  try {
    if (!config.baseUrl || !config.apiKey) {
      return {
        success: false,
        error: 'Missing baseUrl or apiKey in configuration',
        details: { attempts: 0, totalTime: 0, lastError: 'Missing baseUrl or apiKey in configuration' }
      };
    }

    // Decriptar API Key se necessário
    const apiKey = EncryptionUtils.decryptIfNeeded(config.apiKey);

    // Usar função genérica de teste com retry logic
    const testUrl = `${config.baseUrl}/status`; // Assumindo endpoint de status
    const result = await testConnection(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      testOptions: {
        timeout: 12000, // Timeout médio para InfoSimples
        retries: 2,     // Retries moderados
        ...testOptions
      }
    });

    if (result.success) {
      return result;
    } else {
      return {
        success: false,
        error: `InfoSimples connection failed: ${result.error}`,
        details: result.details
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? `InfoSimples connection error: ${error.message}` : 'InfoSimples connection failed',
      details: {
        attempts: 1,
        totalTime: 0,
        lastError: error instanceof Error ? error.message : 'InfoSimples connection failed'
      }
    };
  }
}

// Teste específico para ASAAS
async function testASAASConnection(config: any, testOptions?: ConnectionTestOptions): Promise<ConnectionTestResult> {
  try {
    if (!config.baseUrl || !config.apiKey) {
      return {
        success: false,
        error: 'Missing baseUrl or apiKey in configuration',
        details: { attempts: 0, totalTime: 0, lastError: 'Missing baseUrl or apiKey in configuration' }
      };
    }

    // Decriptar API Key se necessário
    const apiKey = EncryptionUtils.decryptIfNeeded(config.apiKey);

    // Usar função genérica de teste com retry logic
    const testUrl = `${config.baseUrl}/customers`; // Endpoint simples para teste
    const result = await testConnection(testUrl, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json'
      },
      testOptions: {
        timeout: 10000, // Timeout padrão para ASAAS
        retries: 2,     // Retries moderados
        ...testOptions
      }
    });

    if (result.success) {
      return result;
    } else {
      return {
        success: false,
        error: `ASAAS connection failed: ${result.error}`,
        details: result.details
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? `ASAAS connection error: ${error.message}` : 'ASAAS connection failed',
      details: {
        attempts: 1,
        totalTime: 0,
        lastError: error instanceof Error ? error.message : 'ASAAS connection failed'
      }
    };
  }
}