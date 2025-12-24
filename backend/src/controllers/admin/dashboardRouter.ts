// Baseado em: 5.Pages.md v1.4, 4.Entities.md v1.5
// Dashboard Administrativo: Exibe métricas globais e gráficos de uso (5.3.6)
// Agregação de dados por tenant (4.5)
// Relacionado: 2.Architecture.md (Appwrite para dados)

import { Router } from 'express';
import { DashboardController } from './dashboard';
import { authenticateAdminMiddleware } from '../../core/auth';

const router = Router();
const dashboardController = new DashboardController();

// Middleware de autenticação admin para todas as rotas
router.use(authenticateAdminMiddleware);

// TASK-011: Dashboard Administrativo - Métricas globais
router.get('/metrics', (req, res) => dashboardController.getMetrics(req, res));

// TASK-011: Dashboard Administrativo - Alertas em tempo real
router.get('/alerts', (req, res) => dashboardController.getAlerts(req, res));

// TASK-011: Dashboard Administrativo - Gráficos de uso
router.get('/charts', (req, res) => dashboardController.getCharts(req, res));

// TASK-011: Dashboard Administrativo - Status do sistema
router.get('/status', (req, res) => dashboardController.getSystemStatus(req, res));

export { router as adminDashboardRouter };