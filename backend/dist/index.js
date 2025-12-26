"use strict";
// Baseado em: 2.Architecture.md v1.0.1, 3.Structure.md v1.1
// Precedência: 1.Project → 2.Architecture → 3.Structure
// Decisão: Ponto de entrada CORE mínimo e agnóstico (conforme 2.Architecture.md seção 3.2)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
// Carregar explicitamente variáveis de ambiente do diretório `backend`
(0, dotenv_1.config)({ path: path_1.default.join(__dirname, '..', '.env') });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const body_parser_1 = require("body-parser");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("./core/auth");
const multiTenant_1 = require("./core/multiTenant");
const pluginLoader_1 = require("./core/pluginLoader");
const eventBus_1 = require("./core/eventBus");
const billingEngine_1 = require("./core/billingEngine");
const audit_1 = require("./core/audit");
const billing_1 = require("./controllers/admin/billing");
const plugins_1 = require("./controllers/admin/plugins");
const tenants_1 = require("./controllers/admin/tenants");
const systemSettings_1 = __importDefault(require("./controllers/admin/systemSettings"));
const audit_2 = require("./controllers/admin/audit");
const dashboardRouter_1 = require("./controllers/admin/dashboardRouter");
const pluginAccess_1 = require("./controllers/admin/pluginAccess");
const users_1 = require("./controllers/admin/users");
const plugins_2 = require("./controllers/plugins");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Se o app estiver atrás de um proxy (Next.js rewrites, nginx, etc.),
// habilitar `trust proxy` para que express-rate-limit possa usar
// corretamente o cabeçalho `X-Forwarded-For` para identificação de IP.
// NÃO usar `true` em produção pois é permissivo; para desenvolvimento
// especificamos 'loopback' (endereços locais) para manter a proteção.
app.set('trust proxy', 'loopback');
// Middleware de segurança
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://app.bigtech.com.br', 'https://admin.bigtech.com.br']
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:8080'],
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
// Rotas de autenticação (login, refresh, logout, me)
app.use('/api/auth', auth_1.authRouter);
// Rotas admin
app.use('/api/admin/billing', billing_1.adminBillingRouter);
app.use('/api/admin/plugins', plugins_1.adminPluginsRouter);
app.use('/api/admin/tenants', tenants_1.adminTenantsRouter);
app.use('/api/admin/system-settings', systemSettings_1.default);
app.use('/api/admin/audit', audit_2.adminAuditRouter);
app.use('/api/admin/dashboard', dashboardRouter_1.adminDashboardRouter);
app.use('/api/admin/plugin-access', pluginAccess_1.adminPluginAccessRouter);
app.use('/api/admin/users', users_1.adminUsersRouter);
// Rotas de execução de plugins (após middleware multi-tenant)
app.use('/api/plugins', plugins_2.pluginsRouter);
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
    // Em ambiente de teste (Jest) evitar iniciar o listener HTTP para não causar EADDRINUSE
    if (!process.env.JEST_WORKER_ID) {
        app.listen(PORT, () => {
            console.log(`🚀 BigTech CORE running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
        });
    }
    else {
        console.log('✅ CORE initialized (test mode) - HTTP listener não iniciado');
    }
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