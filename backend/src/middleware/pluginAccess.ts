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

      // Verificar se o usuário tem permissão individual
      const userIdToFetch = (user as any).userId || req.userId || (user as any).id;
      const userDoc = await appwrite.databases.getDocument(
        process.env.APPWRITE_DATABASE_ID!,
        'users',
        userIdToFetch
      );

      // user.allowedPlugins pode ser: string JSON (ex: '["bigtech"]'), array de strings,
      // ou array de objetos { pluginId, allowed }.
      let userAllowedPlugins: any = userDoc.allowedPlugins || [];
      try {
        if (typeof userAllowedPlugins === 'string') {
          userAllowedPlugins = JSON.parse(userAllowedPlugins);
        }
        if (Array.isArray(userAllowedPlugins) && userAllowedPlugins.length > 0 && typeof userAllowedPlugins[0] === 'string') {
          // Converter ['bigtech'] -> [{ pluginId: 'bigtech', allowed: true }]
          userAllowedPlugins = userAllowedPlugins.map((id: string) => ({ pluginId: id, allowed: true }));
        }
      } catch (e) {
        userAllowedPlugins = [];
      }

      const userHasAccess = (userAllowedPlugins || []).some((p: any) => p && p.pluginId === pluginId && p.allowed === true);

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