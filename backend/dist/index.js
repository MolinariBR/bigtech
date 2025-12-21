"use strict";
// Baseado em: 2.Architecture.md v1.0.1, 3.Structure.md v1.1
// Precedência: 1.Project → 2.Architecture → 3.Structure
// Decisão: Ponto de entrada CORE mínimo e agnóstico (conforme 2.Architecture.md seção 3.2)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const body_parser_1 = require("body-parser");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const multiTenant_1 = require("./core/multiTenant");
const pluginLoader_1 = require("./core/pluginLoader");
const eventBus_1 = require("./core/eventBus");
const billingEngine_1 = require("./core/billingEngine");
const audit_1 = require("./core/audit");
const billing_1 = require("./controllers/admin/billing");
const plugins_1 = require("./controllers/admin/plugins");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware de segurança
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://app.bigtech.com.br', 'https://admin.bigtech.com.br']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
// Body parsing
app.use((0, body_parser_1.json)({ limit: '10mb' }));
// Endpoint para listar plugins disponíveis (antes do middleware multi-tenant)
app.get('/api/plugins', (req, res) => {
    try {
        const plugins = pluginLoader_1.pluginLoader.getAvailablePlugins();
        res.json({ plugins, count: plugins.length });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get plugins' });
    }
});
// Middleware multi-tenant
app.use(multiTenant_1.multiTenantMiddleware);
// Rotas admin
app.use('/api/admin/billing', billing_1.adminBillingRouter);
app.use('/api/admin/plugins', plugins_1.adminPluginsRouter);
// Inicialização de componentes CORE
async function initializeCore() {
    try {
        // Inicializar plugin loader
        await pluginLoader_1.pluginLoader.initialize();
        // Inicializar event bus
        await eventBus_1.eventBus.initialize();
        // Inicializar billing engine
        await billingEngine_1.billingEngine.initialize();
        // Inicializar audit logger
        await audit_1.auditLogger.initialize();
        console.log('✅ CORE initialized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize CORE:', error);
        process.exit(1);
    }
}
// Inicializar e iniciar servidor
initializeCore().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 BigTech CORE running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down CORE...');
    await pluginLoader_1.pluginLoader.shutdown();
    await eventBus_1.eventBus.shutdown();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down CORE...');
    await pluginLoader_1.pluginLoader.shutdown();
    await eventBus_1.eventBus.shutdown();
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map