// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.1, 7.Tasks.md v1.0
// Precedência: 1.Project → 2.Architecture → 4.Entities → 7.Tasks
// Decisão: Controlador admin para gerenciamento de plugins conforme contratos padronizados

// Simulação de persistência para desenvolvimento (TODO: usar Appwrite)
const pluginStatusStore: Record<string, Record<string, string>> = {};
const pluginConfigStore: Record<string, Record<string, any>> = {};

import { Router } from 'express';
import { AppwriteService } from '../../lib/appwrite';
import { pluginLoader } from '../../core/pluginLoader';

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
      [`tenantId=${tenantId}`, `pluginId=${name}`]
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

// PUT /api/admin/plugins/:pluginId/config - Configurar plugin
router.put('/:pluginId/config', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const { config } = req.body;
    const { tenantId } = req.query as any;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    // Para desenvolvimento: salvar no store simulado
    console.log(`[DEV] Saving config for plugin ${pluginId} in tenant ${tenantId}:`, config);

    if (!pluginConfigStore[tenantId]) {
      pluginConfigStore[tenantId] = {};
    }
    pluginConfigStore[tenantId][pluginId] = config || {};

    res.json({
      pluginId,
      config,
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
      [`tenantId=${tenantId}`, `pluginId=${pluginId}`]
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

// Expor stores para desenvolvimento
(global as any).pluginConfigStore = pluginConfigStore;
(global as any).pluginStatusStore = pluginStatusStore;