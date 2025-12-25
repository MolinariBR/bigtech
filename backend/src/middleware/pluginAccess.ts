// Middleware para validar acesso a plugins de consulta
import { Request, Response, NextFunction } from 'express';
import { AppwriteService } from '../lib/appwrite';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

export function validatePluginAccess(pluginId: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Se for admin, permitir acesso total
      if (user.role === 'admin') {
        return next();
      }

      const appwrite = AppwriteService.getInstance();

      // Verificar se o plugin está ativo no tenant
      const tenantDoc = await appwrite.databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        'tenants',
        user.tenantId
      );

      const tenantPlugins = tenantDoc.plugins || [];
      const pluginConfig = tenantPlugins.find((p: any) => p.pluginId === pluginId);

      if (!pluginConfig || pluginConfig.status !== 'active') {
        return res.status(403).json({
          error: 'Plugin não disponível para este tenant'
        });
      }

      // Verificar se o usuário tem permissão individual
      const userDoc = await appwrite.databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        'users',
        user.id
      );

      const userAllowedPlugins = userDoc.allowedPlugins || [];
      const userHasAccess = userAllowedPlugins.some((p: any) =>
        p.pluginId === pluginId && p.allowed === true
      );

      if (!userHasAccess) {
        return res.status(403).json({
          error: 'Acesso negado a este plugin'
        });
      }

      // Tudo ok, continuar
      next();
    } catch (error) {
      console.error('Erro ao validar acesso ao plugin:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}