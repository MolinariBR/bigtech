"use strict";
// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.1, 7.Tasks.md v1.0
// Precedência: 1.Project → 2.Architecture → 4.Entities → 7.Tasks
// Decisão: Controlador admin para gerenciamento de plugins conforme contratos padronizados
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPluginsRouter = void 0;
const express_1 = require("express");
const pluginLoader_1 = require("../../core/pluginLoader");
const appwrite_1 = require("../../lib/appwrite");
const router = (0, express_1.Router)();
const appwrite = appwrite_1.AppwriteService.getInstance();
// GET /api/admin/plugins - Listar plugins do tenant
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req.query;
        if (!tenantId) {
            return res.status(400).json({ error: 'tenantId is required' });
        }
        // Para desenvolvimento: simular plugins ativos (TODO: integrar com Appwrite)
        const activePlugins = [
            // Simular alguns plugins ativos para desenvolvimento
            { pluginId: 'pagamento-asaas', status: 'enabled', config: { apiKey: 'test' }, $createdAt: new Date().toISOString(), $updatedAt: new Date().toISOString() }
        ];
        // Buscar plugins disponíveis
        const availablePlugins = pluginLoader_1.pluginLoader.getAvailablePlugins();
        // Combinar informações
        const plugins = availablePlugins.map(available => {
            const active = activePlugins.find((active) => active.pluginId === available.id);
            return {
                id: available.id,
                type: available.type,
                version: available.version,
                status: active ? active.status : 'disabled',
                config: active ? active.config : null,
                installedAt: active ? active.$createdAt : null,
                updatedAt: active ? active.$updatedAt : null,
            };
        });
        res.json({ plugins, count: plugins.length });
    }
    catch (error) {
        console.error('Failed to list plugins:', error);
        res.status(500).json({ error: 'Failed to list plugins' });
    }
});
// POST /api/admin/plugins - Instalar plugin
router.post('/', async (req, res) => {
    try {
        const { tenantId, name, type, version } = req.body;
        if (!tenantId || !name || !type || !version) {
            return res.status(400).json({ error: 'tenantId, name, type, and version are required' });
        }
        // Verificar se plugin existe
        const availablePlugins = pluginLoader_1.pluginLoader.getAvailablePlugins();
        const pluginExists = availablePlugins.find(p => p.id === name);
        if (!pluginExists) {
            return res.status(404).json({ error: 'Plugin not found' });
        }
        // Verificar se já está instalado
        const existing = await appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'plugins', [`tenantId=${tenantId}`, `pluginId=${name}`]);
        if (existing.documents.length > 0) {
            return res.status(409).json({ error: 'Plugin already installed' });
        }
        // Instalar plugin (simplificado para desenvolvimento)
        // TODO: Implementar instalação real do plugin quando Appwrite estiver configurado
        console.log(`[DEV] Plugin ${name} would be installed here`);
        // Registrar no banco
        const pluginDoc = await appwrite.databases.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'plugins', 'unique()', {
            tenantId,
            pluginId: name,
            type,
            version,
            status: 'disabled',
            config: {},
            installedBy: req.userId,
        });
        res.status(201).json({
            id: pluginDoc.$id,
            pluginId: name,
            status: 'installed',
            message: 'Plugin installed successfully'
        });
    }
    catch (error) {
        console.error('Failed to install plugin:', error);
        res.status(500).json({ error: 'Failed to install plugin' });
    }
});
// POST /api/admin/plugins/:pluginId/toggle - Habilitar/desabilitar plugin
router.post('/:pluginId/toggle', async (req, res) => {
    try {
        const { pluginId } = req.params;
        const { action } = req.body;
        const { tenantId } = req.query;
        if (!tenantId) {
            return res.status(400).json({ error: 'tenantId is required' });
        }
        if (!['enable', 'disable'].includes(action)) {
            return res.status(400).json({ error: 'action must be enable or disable' });
        }
        // Buscar plugin no banco
        const plugins = await appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'plugins', [`tenantId=${tenantId}`, `pluginId=${pluginId}`]);
        if (plugins.documents.length === 0) {
            return res.status(404).json({ error: 'Plugin not found' });
        }
        const pluginDoc = plugins.documents[0];
        const plugin = Array.from(pluginLoader_1.pluginLoader['plugins'].values()).find(p => p.id === pluginId);
        if (!plugin) {
            return res.status(404).json({ error: 'Plugin implementation not found' });
        }
        // Executar ação (simplificado para desenvolvimento)
        console.log(`[DEV] Plugin ${pluginId} would be ${action}d for tenant ${tenantId}`);
        // Atualizar no banco
        await appwrite.databases.updateDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'plugins', pluginDoc.$id, { status: pluginDoc.status });
        res.json({
            pluginId,
            status: pluginDoc.status,
            message: `Plugin ${action}d successfully`
        });
    }
    catch (error) {
        console.error('Failed to toggle plugin:', error);
        res.status(500).json({ error: 'Failed to toggle plugin' });
    }
});
// PUT /api/admin/plugins/:pluginId/config - Configurar plugin
router.put('/:pluginId/config', async (req, res) => {
    try {
        const { pluginId } = req.params;
        const { config } = req.body;
        const { tenantId } = req.query;
        if (!tenantId) {
            return res.status(400).json({ error: 'tenantId is required' });
        }
        // Buscar plugin no banco
        const plugins = await appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'plugins', [`tenantId=${tenantId}`, `pluginId=${pluginId}`]);
        if (plugins.documents.length === 0) {
            return res.status(404).json({ error: 'Plugin not found' });
        }
        const pluginDoc = plugins.documents[0];
        // Atualizar configuração
        await appwrite.databases.updateDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'plugins', pluginDoc.$id, { config: config || {} });
        res.json({
            pluginId,
            config,
            message: 'Plugin configuration updated successfully'
        });
    }
    catch (error) {
        console.error('Failed to configure plugin:', error);
        res.status(500).json({ error: 'Failed to configure plugin' });
    }
});
// DELETE /api/admin/plugins/:pluginId - Remover plugin
router.delete('/:pluginId', async (req, res) => {
    try {
        const { pluginId } = req.params;
        const { tenantId } = req.query;
        if (!tenantId) {
            return res.status(400).json({ error: 'tenantId is required' });
        }
        // Buscar plugin no banco
        const plugins = await appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'plugins', [`tenantId=${tenantId}`, `pluginId=${pluginId}`]);
        if (plugins.documents.length === 0) {
            return res.status(404).json({ error: 'Plugin not found' });
        }
        const pluginDoc = plugins.documents[0];
        // Desabilitar plugin primeiro (simplificado para desenvolvimento)
        console.log(`[DEV] Plugin ${pluginId} would be disabled for tenant ${tenantId}`);
        // Remover do banco
        await appwrite.databases.deleteDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'plugins', pluginDoc.$id);
        res.json({
            pluginId,
            message: 'Plugin removed successfully'
        });
    }
    catch (error) {
        console.error('Failed to remove plugin:', error);
        res.status(500).json({ error: 'Failed to remove plugin' });
    }
});
exports.adminPluginsRouter = router;
//# sourceMappingURL=plugins.js.map