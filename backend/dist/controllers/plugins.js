"use strict";
// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.1, 6.UserStories.md v1.2
// Precedência: 1.Project → 2.Architecture → 4.Entities → 6.UserStories
// Decisão: Rotas para execução de plugins com isolamento por tenant (PAC-002)
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginsRouter = void 0;
const express_1 = require("express");
const pluginLoader_1 = require("../core/pluginLoader");
const router = (0, express_1.Router)();
exports.pluginsRouter = router;
// Middleware para validar contexto de execução
const validateExecutionContext = (req, res, next) => {
    const { tenantId, userId } = req;
    if (!tenantId || !userId) {
        return res.status(400).json({
            error: 'Missing tenant or user context',
            details: 'tenantId and userId are required in request context'
        });
    }
    next();
};
// POST /api/plugins/:pluginId/execute - Executar plugin específico
router.post('/:pluginId/execute', validateExecutionContext, async (req, res) => {
    try {
        const { pluginId } = req.params;
        const { input = {}, config = {} } = req.body;
        const { tenantId, userId } = req;
        // Validar entrada
        if (!pluginId) {
            return res.status(400).json({
                error: 'Plugin ID is required',
                details: 'pluginId parameter is missing from URL'
            });
        }
        // Criar contexto de execução isolado por tenant
        const context = {
            tenantId,
            userId,
            input,
            config
        };
        // Executar plugin com isolamento
        const result = await pluginLoader_1.pluginLoader.executePlugin(pluginId, context);
        if (!result.success) {
            // Plugin não pôde ser executado (não ativo, não encontrado, etc.)
            return res.status(403).json({
                error: 'Plugin execution failed',
                details: result.error,
                pluginId,
                tenantId
            });
        }
        // Sucesso - retornar dados do plugin
        res.json({
            success: true,
            pluginId,
            tenantId,
            userId,
            data: result.data,
            executedAt: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Plugin execution error:', error);
        res.status(500).json({
            error: 'Internal server error during plugin execution',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET /api/plugins/active - Listar plugins ativos para o tenant atual
router.get('/active', validateExecutionContext, async (req, res) => {
    try {
        const { tenantId } = req;
        // Obter plugins ativos para o tenant
        const activePlugins = pluginLoader_1.pluginLoader.getActivePluginsForTenant(tenantId);
        res.json({
            tenantId,
            activePlugins: Array.from(activePlugins),
            count: activePlugins.size
        });
    }
    catch (error) {
        console.error('Error getting active plugins:', error);
        res.status(500).json({
            error: 'Failed to get active plugins',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET /api/plugins/:pluginId/status - Verificar se plugin está ativo para o tenant
router.get('/:pluginId/status', validateExecutionContext, async (req, res) => {
    try {
        const { pluginId } = req.params;
        const { tenantId } = req;
        if (!pluginId) {
            return res.status(400).json({
                error: 'Plugin ID is required',
                details: 'pluginId parameter is missing from URL'
            });
        }
        // Verificar se plugin está ativo para o tenant
        const isActive = pluginLoader_1.pluginLoader.isPluginActiveForTenant(pluginId, tenantId);
        res.json({
            pluginId,
            tenantId,
            isActive
        });
    }
    catch (error) {
        console.error('Error checking plugin status:', error);
        res.status(500).json({
            error: 'Failed to check plugin status',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=plugins.js.map