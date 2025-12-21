// Baseado em: 4.Entities.md v1.1, 6.UserStories.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities → 6.UserStories
// Decisão: Módulo de autenticação CORE com validação CPF/CNPJ e integração Appwrite JWT

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppwriteService } from '../lib/appwrite';
import { auditLogger } from './audit';

const router = Router();
const appwrite = AppwriteService.getInstance();

// Interfaces
interface LoginRequest {
  identifier: string; // CPF ou CNPJ
  tenantId?: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
}

// Utilitários de validação
export class AuthValidators {
  // Validar CPF
  static isValidCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '');

    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false; // CPF com todos dígitos iguais

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;

    return remainder === parseInt(cpf.charAt(10));
  }

  // Validar CNPJ
  static isValidCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/[^\d]/g, '');

    if (cnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false; // CNPJ com todos dígitos iguais

    // Validar primeiro dígito verificador
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    // Validar segundo dígito verificador
    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
  }

  // Validar CPF ou CNPJ
  static isValidIdentifier(identifier: string): boolean {
    const clean = identifier.replace(/[^\d]/g, '');
    return clean.length === 11 ? this.isValidCPF(clean) : this.isValidCNPJ(clean);
  }

  // Formatar CPF/CNPJ para exibição
  static formatIdentifier(identifier: string): string {
    const clean = identifier.replace(/[^\d]/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return identifier;
  }
}

// Classe principal de autenticação
export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'bigtech-secret-key';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

  // Login de usuário
  static async login(identifier: string, tenantId: string): Promise<AuthResponse> {
    try {
      // Validar formato do identificador
      if (!AuthValidators.isValidIdentifier(identifier)) {
        return {
          success: false,
          message: 'CPF/CNPJ inválido'
        };
      }

      // Buscar usuário no Appwrite
      const users = await appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        [
          `tenantId=${tenantId}`,
          `identifier=${identifier}`,
          'status=active'
        ]
      );

      if (users.documents.length === 0) {
        // Usuário não existe - criar automaticamente para MVP
        const newUser = await this.createUser(identifier, tenantId);

        // Gerar token JWT
        const token = this.generateToken(newUser);

        // Log de auditoria
        await auditLogger.log({
          tenantId,
          userId: newUser.$id,
          action: 'user_login_first_time',
          resource: `user:${newUser.$id}`,
          details: { identifier: AuthValidators.formatIdentifier(identifier) },
          ipAddress: 'system' // Será preenchido pelo middleware
        });

        return {
          success: true,
          token,
          user: {
            id: newUser.$id,
            identifier: AuthValidators.formatIdentifier(identifier),
            type: newUser.type,
            role: newUser.role,
            credits: newUser.credits
          }
        };
      }

      const user = users.documents[0];

      // Verificar se usuário está ativo
      if (user.status !== 'active') {
        return {
          success: false,
          message: 'Usuário inativo'
        };
      }

      // Gerar token JWT
      const token = this.generateToken(user);

      // Log de auditoria
      await auditLogger.log({
        tenantId,
        userId: user.$id,
        action: 'user_login',
        resource: `user:${user.$id}`,
        details: { identifier: AuthValidators.formatIdentifier(identifier) },
        ipAddress: 'system'
      });

      return {
        success: true,
        token,
        user: {
          id: user.$id,
          identifier: AuthValidators.formatIdentifier(user.identifier),
          type: user.type,
          role: user.role,
          credits: user.credits
        }
      };

    } catch (error) {
      console.error('Auth login error:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  // Criar novo usuário
  private static async createUser(identifier: string, tenantId: string) {
    const userData = {
      tenantId,
      identifier,
      type: 'user',
      email: null,
      role: 'viewer',
      status: 'active',
      credits: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await appwrite.databases.createDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      'unique()', // Auto-generate ID
      userData
    );
  }

  // Gerar token JWT
  private static generateToken(user: any): string {
    const payload = {
      userId: user.$id,
      tenantId: user.tenantId,
      identifier: user.identifier,
      type: user.type,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });
  }

  // Verificar token JWT
  static async verifyToken(token: string): Promise<any | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;

      // Verificar se usuário ainda existe e está ativo
      const user = await appwrite.databases.getDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        decoded.userId
      );

      if (user.status !== 'active' || user.tenantId !== decoded.tenantId) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Logout (apenas log de auditoria)
  static async logout(userId: string, tenantId: string): Promise<void> {
    await auditLogger.log({
      tenantId,
      userId,
      action: 'user_logout',
      resource: `user:${userId}`,
      details: {},
      ipAddress: 'system'
    });
  }
}

// Middleware de autenticação
export const authenticateMiddleware = async (
  req: Request,
  res: Response,
  next: any
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }

    const token = authHeader.substring(7);
    const decoded = await AuthService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Rotas de autenticação
router.post('/login', async (req: Request, res: Response) => {
  const { identifier }: LoginRequest = req.body;
  const tenantId = req.tenantId || req.headers['x-tenant-id'] as string || 'default';

  if (!identifier) {
    return res.status(400).json({
      success: false,
      message: 'CPF/CNPJ é obrigatório'
    });
  }

  const result = await AuthService.login(identifier, tenantId);
  res.json(result);
});

router.post('/logout', authenticateMiddleware, async (req: Request, res: Response) => {
  await AuthService.logout(req.userId!, req.tenantId!);
  res.json({ success: true, message: 'Logout realizado com sucesso' });
});

router.get('/me', authenticateMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      req.userId!
    );

    res.json({
      success: true,
      user: {
        id: user.$id,
        identifier: AuthValidators.formatIdentifier(user.identifier),
        type: user.type,
        role: user.role,
        credits: user.credits,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do usuário'
    });
  }
});

export { router as authRouter };
export default AuthService;