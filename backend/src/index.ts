// Baseado em: 2.Architecture.md v1.0.1, 3.Structure.md v1.1
// Precedência: 1.Project → 2.Architecture → 3.Structure
// Decisão: Ponto de entrada CORE mínimo e agnóstico (conforme 2.Architecture.md seção 3.2)

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

const app = express();
const PORT = process.env.PORT || 4000;

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

// Middleware multi-tenant
app.use(multiTenantMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    tenant: req.tenantId || 'unknown'
  });
});

// Rotas CORE
app.use('/auth', authRouter);

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
  app.listen(PORT, () => {
    console.log(`🚀 BigTech CORE running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
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