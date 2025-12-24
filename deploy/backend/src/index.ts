// Baseado em: 2.Architecture.md v1.0.1, 3.Structure.md v1.1
// Precedência: 1.Project → 2.Architecture → 3.Structure
// Decisão: Ponto de entrada CORE mínimo e agnóstico (conforme 2.Architecture.md seção 3.2)

import { config } from 'dotenv';
import path from 'path';
// Carregar explicitamente variáveis de ambiente do diretório `backend`
config({ path: path.join(__dirname, '..', '.env') });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { json } from 'body-parser';
import rateLimit from 'express-rate-limit';
import { authRouter } from './core/auth';
import { multiTenantMiddleware } from './core/multiTenant';
import { pluginLoader } from './core/pluginLoader';
import { eventBus } from './core/eventBus';
import { billingEngine } from './core/billingEngine';
import { auditLogger } from './core/audit';
import { adminBillingRouter } from './controllers/admin/billing';
import { adminPluginsRouter } from './controllers/admin/plugins';
import { adminTenantsRouter } from './controllers/admin/tenants';
import { pluginsRouter } from './controllers/plugins';

const app = express();
const PORT = process.env.PORT || 4000;

// Se o app estiver atrás de um proxy (Next.js rewrites, nginx, etc.),
// habilitar `trust proxy` para que express-rate-limit possa usar
// corretamente o cabeçalho `X-Forwarded-For` para identificação de IP.
// NÃO usar `true` em produção pois é permissivo; para desenvolvimento
// especificamos 'loopback' (endereços locais) para manter a proteção.
app.set('trust proxy', 'loopback');

// Middleware de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://app.bigtech.com.br', 'https://admin.bigtech.com.br']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(json({ limit: '10mb' }));

// Endpoint para listar plugins disponíveis (antes do middleware multi-tenant)
app.get('/api/plugins', (req, res) => {
  try {
    const plugins = pluginLoader.getAvailablePlugins();
    res.json({ plugins, count: plugins.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get plugins' });
  }
});

// Middleware multi-tenant
app.use(multiTenantMiddleware);

// Rotas de autenticação (login, refresh, logout, me)
app.use('/api/auth', authRouter);

// Rotas admin
app.use('/api/admin/billing', adminBillingRouter);
app.use('/api/admin/plugins', adminPluginsRouter);
app.use('/api/admin/tenants', adminTenantsRouter);

// Rotas de execução de plugins (após middleware multi-tenant)
app.use('/api/plugins', pluginsRouter);

// Inicialização de componentes CORE
async function initializeCore() {
  try {
    // Inicializar plugin loader
    await pluginLoader.initialize();

    // Inicializar event bus
    await eventBus.initialize();

    // Inicializar billing engine
    await billingEngine.initialize();

    // Inicializar audit logger
    await auditLogger.initialize();

    console.log('✅ CORE initialized successfully');
  } catch (error) {
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
  } else {
    console.log('✅ CORE initialized (test mode) - HTTP listener não iniciado');
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down CORE...');
  await pluginLoader.shutdown();
  await eventBus.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down CORE...');
  await pluginLoader.shutdown();
  await eventBus.shutdown();
  process.exit(0);
});

export default app;