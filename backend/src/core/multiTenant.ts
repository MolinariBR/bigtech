// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities
// Decisão: Middleware para isolamento multi-tenant via tenantId

import { Request, Response, NextFunction } from 'express';
import { AppwriteService } from '../lib/appwrite';

// Extender Request interface para incluir tenantId
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
      user?: any;
    }
  }
}

export const multiTenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Para rotas admin, não exigir tenant (admin é global)
    if (req.path.includes('/admin/')) {
      req.tenantId = 'admin';
      return next();
    }

    // Extrair tenantId do header, query param ou subdomain
    let tenantId = req.headers['x-tenant-id'] as string ||
                   req.query.tenantId as string;

    // Se não especificado, tentar extrair do subdomain
    if (!tenantId && req.subdomains.length > 0) {
      // Para subdomínios como tenant1.app.bigtech.com.br
      tenantId = req.subdomains[0];
    }

    // Se ainda não tem tenantId, usar default para desenvolvimento
    if (!tenantId) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({
          error: 'Tenant ID is required',
          message: 'Please specify tenant via X-Tenant-ID header or subdomain'
        });
      }
      tenantId = 'default';
    }

    // Em desenvolvimento, permitir sem userId ou pegar do header
    if (!req.userId && process.env.NODE_ENV !== 'production') {
      req.userId = req.headers['x-user-id'] as string || 'dev-user';
    }
    const appwrite = AppwriteService.getInstance();
    try {
      const tenant = await appwrite.databases.getDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'tenants',
        tenantId
      );

      // Se tenant existe mas não está ativo, permitir login em ambientes de desenvolvimento
      // ou para rotas de autenticação (permitir primeiro acesso / auto-onboarding)
      if (tenant.status !== 'active') {
        if (process.env.NODE_ENV === 'development' || req.path.includes('/auth/login')) {
          req.tenantId = tenantId;
        } else {
          return res.status(403).json({
            error: 'Tenant not active',
            message: 'This tenant is currently inactive'
          });
        }
      } else {
        req.tenantId = tenantId;
      }
      // req.tenant = tenant; // Removido pois não está definido no tipo Request
    } catch (error) {
      // Tenant não encontrado - permitir para desenvolvimento ou rotas públicas
      if (process.env.NODE_ENV === 'development' ||
          req.path.includes('/auth/login') ||
          req.path === '/health' ||
          req.path.startsWith('/api/admin/')) {
        req.tenantId = tenantId;
        console.log(`[DEV] Allowing tenant ${tenantId} for path ${req.path}`);
      } else {
        return res.status(404).json({
          error: 'Tenant not found',
          message: 'The specified tenant does not exist'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Multi-tenant middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process tenant information'
    });
  }
};