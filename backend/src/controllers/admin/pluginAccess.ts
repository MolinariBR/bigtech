// Baseado em: 2.Architecture.md v1.2.0, 4.Entities.md v1.4.0, 7.Tasks.md v1.0
// Precedência: 1.Project → 2.Architecture → 4.Entities → 7.Tasks
// Decisão: Controlador admin para gerenciamento de plugins por tipo de usuário

import { Router } from 'express';
import { Query } from 'node-appwrite';
import { AppwriteService as LocalAppwriteService } from '../../lib/appwrite';
import { auditLogger } from '../../core/audit';
import { pluginLoader } from '../../core/pluginLoader';

const router = Router();
const appwrite = LocalAppwriteService.getInstance();

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

    // Buscar plugins disponíveis globalmente
    const allPlugins = pluginLoader.getAvailablePlugins();
    const consultaPlugins = allPlugins.filter(p => p.type === 'consulta');

    let userAllowedPlugins = [];
    try {
      userAllowedPlugins = user.allowedPlugins ? JSON.parse(user.allowedPlugins) : [];
    } catch (e) {
      userAllowedPlugins = [];
    }

    // Retornar plugins disponíveis e quais o usuário pode acessar
    const availablePlugins = consultaPlugins.map(plugin => ({
      pluginId: plugin.id,
      allowed: userAllowedPlugins.includes(plugin.id),
      config: {}
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

    // Verificar se plugins existem no sistema
    const allPlugins = pluginLoader.getAvailablePlugins();
    const consultaPluginIds = allPlugins.filter(p => p.type === 'consulta').map(p => p.id);

    // Validar que usuário só pode ter acesso a plugins que existem
    const invalidPlugins = allowedPlugins.filter(pluginId => !consultaPluginIds.includes(pluginId));
    if (invalidPlugins.length > 0) {
      return res.status(400).json({
        error: 'Cannot allow access to plugins that do not exist',
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
      userId,
      action: 'UPDATE_USER_PLUGINS',
      resource: `user:${userId}`,
      details: { allowedPlugins },
      ipAddress: req.ip || 'unknown',
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

export const adminPluginAccessRouter = router;