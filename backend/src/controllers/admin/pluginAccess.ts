// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.2, 7.Tasks.md v1.0
// Precedência: 1.Project → 2.Architecture → 4.Entities → 7.Tasks
// Decisão: Controlador admin para gerenciamento de plugins de consulta por tenant e usuário

import { Router } from 'express';
import { Query } from 'node-appwrite';
import { AppwriteService as LocalAppwriteService } from '../../lib/appwrite';
import { auditLogger } from '../../core/audit';
import { pluginLoader } from '../../core/pluginLoader';

const router = Router();
const appwrite = LocalAppwriteService.getInstance();

// GET /api/admin/tenants/:tenantId/plugins - Listar plugins ativos para um tenant
router.get('/tenants/:tenantId/plugins', async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Verificar se tenant existe
    const tenant = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      tenantId
    );

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Desserializar plugins do tenant de JSON string para array
    let plugins = [];
    try {
      plugins = tenant.plugins ? JSON.parse(tenant.plugins) : [];
    } catch (e) {
      plugins = [];
    }

    // Retornar plugins do tenant como array
    res.json({ plugins });
  } catch (error) {
    console.error('Failed to get tenant plugins:', error);
    res.status(500).json({ error: 'Failed to load tenant plugins' });
  }
});

// PUT /api/admin/tenants/:tenantId/plugins - Atualizar plugins ativos para um tenant
router.put('/tenants/:tenantId/plugins', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { plugins } = req.body; // Array de TenantPluginConfig

    if (!Array.isArray(plugins)) {
      return res.status(400).json({ error: 'plugins must be an array' });
    }

    // Validar estrutura dos plugins
    for (const plugin of plugins) {
      if (!plugin.pluginId || typeof plugin.status !== 'string') {
        return res.status(400).json({ error: 'Invalid plugin structure' });
      }
    }

    // Buscar tenant atual
    const tenant = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      tenantId
    );

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Atualizar plugins do tenant - serializar como JSON string
    const updatedTenant = await appwrite.databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      tenantId,
      { plugins: JSON.stringify(plugins) }
    );

    // Quando plugins são ativados no tenant, conceder acesso automático a todos usuários
    const activePluginIds = plugins
      .filter(p => p.status === 'active')
      .map(p => p.pluginId);

    // Buscar todos usuários do tenant
    const users = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      [Query.equal('tenantId', tenantId), Query.equal('status', 'active')]
    );

    // Atualizar allowedPlugins de cada usuário
    for (const user of users.documents) {
      let currentAllowed = [];
      try {
        currentAllowed = user.allowedPlugins ? JSON.parse(user.allowedPlugins) : [];
      } catch (e) {
        currentAllowed = [];
      }
      const newAllowed = [...new Set([...currentAllowed, ...activePluginIds])];

      await appwrite.databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        user.$id,
        { allowedPlugins: JSON.stringify(newAllowed) }
      );
    }

    // Auditar mudança
    await auditLogger.log({
      tenantId,
      action: 'UPDATE_TENANT_PLUGINS',
      resource: `tenant:${tenantId}`,
      details: { plugins },
      ipAddress: req.ip || 'unknown',
      userId: (req as any).userId,
    });

    res.json({ plugins });
  } catch (error) {
    console.error('Failed to update tenant plugins:', error);
    res.status(500).json({ error: 'Failed to update tenant plugins' });
  }
});

// GET /api/admin/users/:userId/plugins - Listar plugins permitidos para um usuário
router.get('/users/:userId/plugins', async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar usuário
    const user = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      userId
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Buscar tenant para contexto
    const tenant = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      user.tenantId
    );

    // Desserializar plugins do tenant de JSON string para array
    let tenantPlugins = [];
    try {
      tenantPlugins = tenant.plugins ? JSON.parse(tenant.plugins) : [];
    } catch (e) {
      tenantPlugins = [];
    }

    let userAllowedPlugins = [];
    try {
      userAllowedPlugins = user.allowedPlugins ? JSON.parse(user.allowedPlugins) : [];
    } catch (e) {
      userAllowedPlugins = [];
    }

    // Retornar plugins disponíveis (ativos no tenant) e quais o usuário pode acessar
    const availablePlugins = tenantPlugins
      .filter((tp: any) => tp.status === 'active')
      .map((tp: any) => ({
        pluginId: tp.pluginId,
        allowed: userAllowedPlugins.includes(tp.pluginId),
        config: tp.config
      }));

    res.json({ plugins: availablePlugins });
  } catch (error) {
    console.error('Failed to get user plugins:', error);
    res.status(500).json({ error: 'Failed to load user plugins' });
  }
});

// PUT /api/admin/users/:userId/plugins - Atualizar plugins permitidos para um usuário
router.put('/users/:userId/plugins', async (req, res) => {
  try {
    const { userId } = req.params;
    const { allowedPlugins } = req.body; // Array de pluginIds

    if (!Array.isArray(allowedPlugins)) {
      return res.status(400).json({ error: 'allowedPlugins must be an array' });
    }

    // Buscar usuário
    const user = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      userId
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Buscar tenant para validação
    const tenant = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      user.tenantId
    );

    // Verificar plugins do tenant como array
    let tenantPlugins = tenant.plugins || [];
    const activeTenantPluginIds = tenantPlugins
      .filter((tp: any) => tp.status === 'active')
      .map((tp: any) => tp.pluginId);

    // Validar que usuário só pode ter acesso a plugins ativos no tenant
    const invalidPlugins = allowedPlugins.filter(pluginId => !activeTenantPluginIds.includes(pluginId));
    if (invalidPlugins.length > 0) {
      return res.status(400).json({
        error: 'Cannot allow access to plugins not active in tenant',
        invalidPlugins
      });
    }

    // Atualizar allowedPlugins do usuário
    const updatedUser = await appwrite.databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      userId,
      { allowedPlugins: JSON.stringify(allowedPlugins) }
    );

    // Auditar mudança
    await auditLogger.log({
      tenantId: user.tenantId,
      action: 'UPDATE_USER_PLUGINS',
      resource: `user:${userId}`,
      details: { allowedPlugins },
      ipAddress: req.ip || 'unknown',
      userId: (req as any).userId,
    });

    let formattedAllowedPlugins = [];
    try {
      formattedAllowedPlugins = updatedUser.allowedPlugins ? JSON.parse(updatedUser.allowedPlugins) : [];
    } catch (e) {
      formattedAllowedPlugins = [];
    }

    res.json({ allowedPlugins: formattedAllowedPlugins });
  } catch (error) {
    console.error('Failed to update user plugins:', error);
    res.status(500).json({ error: 'Failed to update user plugins' });
  }
});

// GET /api/admin/plugins/available - Listar todos plugins de consulta disponíveis no sistema
router.get('/plugins/available', async (req, res) => {
  try {
    // Buscar plugins de consulta disponíveis no pluginLoader
    const allPlugins = pluginLoader.getAvailablePlugins();
    const consultaPlugins = allPlugins.filter(p => p.type === 'consulta');

    // Mapear para o formato esperado pelo frontend
    const availablePlugins = consultaPlugins.map(plugin => ({
      id: plugin.id,
      name: plugin.id === 'bigtech' ? 'BigTech' : plugin.id === 'infosimples' ? 'InfoSimples' : plugin.id,
      type: plugin.type,
      version: plugin.version,
      config: {}
    }));

    res.json({ plugins: availablePlugins });
  } catch (error) {
    console.error('Failed to get available plugins:', error);
    res.status(500).json({ error: 'Failed to load available plugins' });
  }
});

export const adminPluginAccessRouter = router;