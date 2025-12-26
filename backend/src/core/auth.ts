// Baseado em: 4.Entities.md v1.1, 6.UserStories.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities → 6.UserStories
// Decisão: Módulo de autenticação CORE com validação CPF/CNPJ e integração Appwrite JWT

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppwriteService } from '../lib/appwrite';
import axios from 'axios';
import { Query, ID } from 'node-appwrite';
import { auditLogger } from './audit';
import { pluginLoader } from './pluginLoader';

const router = Router();
const appwrite = AppwriteService.getInstance();

// Extensões da interface Request
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
      user?: any;
      isAdmin?: boolean;
    }
  }
}

// Interfaces
interface LoginRequest {
  identifier: string; // CPF ou CNPJ
  tenantId?: string;
}

interface AdminLoginRequest {
  email?: string;
  password?: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
  refreshToken?: string;
  tenantCreated?: boolean; // Flag para indicar se tenant foi criado automaticamente
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
  private static readonly JWT_SECRET: string = process.env.JWT_SECRET || 'bigtech-secret-key';
  private static readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly REFRESH_SECRET: string = process.env.REFRESH_SECRET || 'bigtech-refresh-secret';
  private static readonly REFRESH_EXPIRES_IN: string = process.env.REFRESH_EXPIRES_IN || '7d';
  private static readonly BCRYPT_ROUNDS: number = parseInt(process.env.BCRYPT_ROUNDS || '12');

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

      // Verificar se tenant existe, se não existir, criar automaticamente (auto-onboarding)
      const tenantExists = await this.ensureTenantExists(tenantId);

      // Buscar usuário no Appwrite
      const users = await appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        [
          Query.equal('tenantId', tenantId),
          Query.equal('identifier', identifier),
          Query.equal('status', 'active')
        ]
      );

      if (users.documents.length === 0) {
        // Usuário não existe - criar automaticamente para MVP
        const newUser = await this.createUser(identifier, tenantId);

        // Gerar token JWT
        const token = this.generateToken(newUser);
        // Gerar refresh token e salvar no usuário
        const refreshToken = await this.generateRefreshToken(newUser);

        // Log de auditoria
        await auditLogger.log({
          tenantId,
          userId: newUser.$id,
          action: tenantExists ? 'user_login_first_time' : 'user_login_tenant_created',
          resource: `user:${newUser.$id}`,
          details: {
            identifier: AuthValidators.formatIdentifier(identifier),
            tenantCreated: !tenantExists
          },
          ipAddress: 'system' // Será preenchido pelo middleware
        });

        return {
          success: true,
          token,
          refreshToken,
          user: {
            id: newUser.$id,
            identifier: AuthValidators.formatIdentifier(identifier),
            type: newUser.type,
            role: newUser.role,
            credits: newUser.credits
          },
          tenantCreated: !tenantExists // Flag para indicar se tenant foi criado
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

      // Gerar refresh token e salvar no usuário
      const refreshToken = await this.generateRefreshToken(user);

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
        refreshToken,
        user: {
          id: user.$id,
          identifier: AuthValidators.formatIdentifier(user.identifier),
          type: user.type,
          role: user.role,
          credits: user.credits
        },
        tenantCreated: false
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

  // Garantir que tenant existe, criar se necessário (auto-onboarding)
  static async ensureTenantExists(tenantId: string): Promise<boolean> {
    try {
      // Tentar buscar tenant
      await appwrite.databases.getDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'tenants',
        tenantId
      );
      return true; // Tenant já existe
    } catch (error: any) {
      // Se erro for "document not found", criar tenant
      if (error.code === 404 || error.message?.includes('not found')) {
        try {
          const tenantData = {
            name: tenantId, // Usar tenantId como nome base
            status: 'active', // Status ativo para permitir uso imediato
            plugins: '[]' // Plugins padrão como string JSON
          };

          await appwrite.databases.createDocument(
            process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
            'tenants',
            tenantId, // Usar tenantId como ID do documento
            tenantData
          );

          // Log de auditoria para criação de tenant
          await auditLogger.log({
            tenantId,
            action: 'tenant_auto_created',
            resource: `tenant:${tenantId}`,
            details: { name: tenantId, status: 'active', source: 'auto_onboarding' },
            ipAddress: 'system'
          });

          return false; // Tenant foi criado
        } catch (createError) {
          console.error('Erro ao criar tenant automaticamente:', createError);
          throw createError;
        }
      }
      // Outro erro, relançar
      throw error;
    }
  }

  // Gerar token JWT
  static generateToken(user: any): string {
    const payload = {
      userId: user.$id,
      tenantId: user.tenantId,
      identifier: user.identifier,
      type: user.type,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };

    const secret = this.JWT_SECRET as string;
    const options: jwt.SignOptions = {
      expiresIn: this.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
    };

    return jwt.sign(payload, secret, options);
  }

  // Gerar refresh token e armazenar no documento do usuário
  static async generateRefreshToken(user: any): Promise<string> {
    const payload = {
      userId: user.$id,
      tenantId: user.tenantId,
      iat: Math.floor(Date.now() / 1000)
    };

    const options: jwt.SignOptions = {
      expiresIn: this.REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn']
    };

    const refreshToken = jwt.sign(payload, this.REFRESH_SECRET, options);

    try {
      // Armazenar refresh token no documento do usuário (substitui token anterior)
      await appwrite.databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        user.$id,
        { refreshToken }
      );
    } catch (error) {
      console.error('Erro ao salvar refresh token:', error);
    }

    return refreshToken;
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

  // Verificar refresh token: valida assinatura e checa se bate com o armazenado
  static async verifyRefreshToken(token: string): Promise<any | null> {
    try {
      const decoded = jwt.verify(token, this.REFRESH_SECRET) as any;

      // Buscar usuário e comparar token salvo
      const user = await appwrite.databases.getDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        decoded.userId
      );

      if (process.env.NODE_ENV !== 'production') {
        try {
          console.log('[auth.verifyRefreshToken] decoded:', { userId: decoded.userId, iat: decoded.iat, exp: decoded.exp })
          console.log('[auth.verifyRefreshToken] fetched user id:', user.$id)
          console.log('[auth.verifyRefreshToken] user.refreshToken present:', !!user.refreshToken)
          console.log('[auth.verifyRefreshToken] token equality:', user.refreshToken === token)
        } catch (e) {
          // ignora erros de logging
        }
      }

      if (!user || user.refreshToken !== token) return null;

      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Logout (apenas log de auditoria)
  static async logout(userId: string, tenantId: string): Promise<void> {
    // Limpar refresh token armazenado
    try {
      await appwrite.databases.updateDocument(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        userId,
        { refreshToken: null }
      );
    } catch (err) {
      console.error('Erro ao limpar refresh token no logout:', err);
    }

    await auditLogger.log({
      tenantId,
      userId,
      action: 'user_logout',
      resource: `user:${userId}`,
      details: {},
      ipAddress: 'system'
    });
  }

  // Login de administrador - valida role admin
  static async adminLogin(identifier: string): Promise<AuthResponse> {
    try {
      // Validar formato do identificador
      if (!AuthValidators.isValidIdentifier(identifier)) {
        return {
          success: false,
          message: 'CPF/CNPJ inválido'
        };
      }

      // Para administradores, buscar em todos os tenants (isolamento global)
      const users = await appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'users',
        [
          Query.equal('identifier', identifier),
          Query.equal('status', 'active'), // Garantir que está ativo
          Query.equal('role', 'admin')
        ]
      );

      if (users.documents.length === 0) {
        return {
          success: false,
          message: 'Administrador não encontrado ou permissões insuficientes'
        };
      }

      const admin = users.documents[0];

      // Verificar se é realmente admin
      if (admin.role !== 'admin') {
        return {
          success: false,
          message: 'Acesso negado: permissões insuficientes'
        };
      }

      // Gerar token JWT para admin (tenantId especial para isolamento global)
      const token = this.generateAdminToken(admin);

      // Log de auditoria
      await auditLogger.log({
        tenantId: 'admin', // Tenant especial para admins
        userId: admin.$id,
        action: 'admin_login',
        resource: `user:${admin.$id}`,
        details: { identifier: AuthValidators.formatIdentifier(identifier) },
        ipAddress: 'system'
      });

      return {
        success: true,
        token,
        user: {
          id: admin.$id,
          identifier: AuthValidators.formatIdentifier(admin.identifier),
          type: admin.type,
          role: admin.role,
          credits: admin.credits
        }
      };

    } catch (error) {
      console.error('Admin auth login error:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  // Gerar token e resposta a partir de um documento de admin (usado após validação pela Appwrite Accounts)
  static async adminLoginWithAdminDoc(admin: any): Promise<AuthResponse> {
    try {
      // Verificar status
      if (admin.status && admin.status !== 'active') {
        return { success: false, message: 'Administrador inativo' };
      }

      const token = this.generateAdminToken(admin);

      // Log de auditoria
      await auditLogger.log({
        tenantId: 'admin',
        userId: admin.$id,
        action: 'admin_login',
        resource: `admin:${admin.$id}`,
        details: { email: admin.email },
        ipAddress: 'system'
      });

      return {
        success: true,
        token,
        user: {
          id: admin.$id,
          identifier: admin.identifier ? AuthValidators.formatIdentifier(admin.identifier) : undefined,
          type: admin.type || 'admin',
          role: admin.role || 'admin'
        }
      };
    } catch (error) {
      console.error('adminLoginWithAdminDoc error:', error);
      return { success: false, message: 'Erro interno do servidor' };
    }
  }

  // Gerar token e resposta a partir de um documento de usuário (usado após validação pela Appwrite Accounts)
  static async userLoginWithUserDoc(user: any): Promise<AuthResponse> {
    try {
      // Verificar status
      if (user.status && user.status !== 'active') {
        return { success: false, message: 'Usuário inativo' };
      }

      const token = this.generateToken(user);

      // Log de auditoria
      await auditLogger.log({
        tenantId: user.tenantId || 'default',
        userId: user.$id,
        action: 'user_login',
        resource: `user:${user.$id}`,
        details: { email: user.email },
        ipAddress: 'system'
      });

      return {
        success: true,
        token,
        user: {
          id: user.$id,
          identifier: user.identifier ? AuthValidators.formatIdentifier(user.identifier) : user.email,
          type: user.type || 'user',
          role: user.role || 'viewer',
          credits: user.credits || 0
        }
      };
    } catch (error) {
      console.error('userLoginWithUserDoc error:', error);
      return { success: false, message: 'Erro interno do servidor' };
    }
  }

  // Gerar token JWT para administrador (isolamento global)
  private static generateAdminToken(admin: any): string {
    const payload = {
      userId: admin.$id,
      tenantId: 'admin', // Tenant especial para admins
      identifier: admin.identifier,
      type: admin.type,
      role: admin.role,
      isAdmin: true, // Flag especial para admins
      iat: Math.floor(Date.now() / 1000)
    };

    const secret = this.JWT_SECRET as string;
    const options: jwt.SignOptions = {
      expiresIn: this.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
    };

    return jwt.sign(payload, secret, options);
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
      console.log('[auth.middleware] Token verification failed for endpoint:', req.path);
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

// Middleware de autenticação para administradores
export const authenticateAdminMiddleware = async (
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

    // Verificar se é administrador
    if (!decoded.isAdmin || decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: permissões de administrador necessárias'
      });
    }

    req.userId = decoded.userId;
    req.user = decoded;
    req.isAdmin = true; // Flag para indicar que é admin
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Rota de login para administradores
// Admin login: now uses Appwrite Accounts (email + password)
router.post('/admin/login', async (req: Request, res: Response) => {
  const { email, password }: AdminLoginRequest = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
  }

    try {
      // MODO TESTE: Pular validação do Appwrite Accounts se SKIP_APPWRITE_AUTH estiver definido
      if (process.env.SKIP_APPWRITE_AUTH === 'true') {
        console.log('[auth.admin.login] MODO TESTE: Pulando validação do Appwrite Accounts');
      } else {
        // Tentar criar sessão na Appwrite via REST (evita incompatibilidades do SDK)
        const rawEndpoint = process.env.APPWRITE_ENDPOINT || 'http://localhost/v1';
        const trimmed = rawEndpoint.replace(/\/$/, '');
        // Garantir que temos o path /v1 apenas uma vez
        const apiBase = trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
        const project = process.env.APPWRITE_PROJECT_ID || 'bigtech';
        let resp: any;
        try {
          resp = await axios.post(
            `${apiBase}/account/sessions`,
            { email, password },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Appwrite-Project': project
              },
              timeout: 5000
            }
          );
          if (process.env.NODE_ENV !== 'production') {
            console.log('[auth.admin.login] Appwrite /account/sessions response status:', resp.status);
            try {
              console.log('[auth.admin.login] Appwrite response data keys:', Object.keys(resp.data || {}));
            } catch (e) {
              // ignore
            }
          }
        } catch (axiosErr: any) {
          // Captura detalhes da resposta do Appwrite (401, 400, 500 etc.)
          if (axiosErr && axiosErr.response) {
            console.error('[auth.admin.login] Appwrite response error status:', axiosErr.response.status);
            try {
              console.error('[auth.admin.login] Appwrite response error data:', JSON.stringify(axiosErr.response.data));
            } catch (e) {
              console.error('[auth.admin.login] Appwrite response error data (non-serializable)');
            }
            // Repassar erro equivalente para tratamento abaixo
            const status = axiosErr.response.status;
            if (status === 401) {
              return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
            }
          }
          console.error('[auth.admin.login] Erro ao chamar Appwrite /account/sessions:', axiosErr);
          return res.status(500).json({ success: false, message: 'Erro ao validar credenciais com Appwrite' });
        }
      }

      // Encontrar admin na coleção `admins` por email
      let admins: any;
      try {
        admins = await appwrite.databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
          'admins',
          [Query.equal('email', email), Query.equal('status', 'active')]
        );
      } catch (adminErr) {
        console.error('[auth.admin.login] Erro ao buscar coleção `admins` no Appwrite:', adminErr);
        return res.status(500).json({ success: false, message: 'Erro ao verificar permissões do administrador' });
      }

      if (!admins || admins.documents.length === 0) {
        console.warn('[auth.admin.login] Admin não encontrado na coleção `admins` para o email:', email);
        return res.status(403).json({ success: false, message: 'Administrador não encontrado ou sem acesso' });
      }

      const admin = admins.documents[0];
      if (process.env.NODE_ENV !== 'production') {
        console.log('[auth.admin.login] Admin document found id:', admin.$id, 'email:', admin.email || '<no-email>');
      }

      // Gerar token JWT para admin
      const result = await AuthService.adminLoginWithAdminDoc(admin);
      res.json(result);
    } catch (err: any) {
      // Erro geral
      if (err && err.response && err.response.status === 401) {
        return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
      }
      console.error('Erro no admin login:', err && err.stack ? err.stack : err);
      return res.status(500).json({ success: false, message: 'Erro interno no login de administrador' });
    }
});

// Rota de login para usuários
// User login: uses Appwrite Accounts (email + password)
router.post('/login', async (req: Request, res: Response) => {
  const { email, password, tenantId }: { email: string; password: string; tenantId?: string } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
  }

  try {
    // MODO TESTE: Pular validação do Appwrite Accounts se SKIP_APPWRITE_AUTH estiver definido
    if (process.env.SKIP_APPWRITE_AUTH === 'true') {
      console.log('[auth.login] MODO TESTE: Pulando validação do Appwrite Accounts');

      // Em modo teste, aceitar qualquer email/password e criar usuário automaticamente se não existir
      let user;

      try {
        // Tentar buscar usuário por email
        const users = await appwrite.databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
          'users',
          [Query.equal('email', email), Query.equal('status', 'active')]
        );

        if (users.documents.length > 0) {
          user = users.documents[0];
        } else {
          // Criar usuário automaticamente
          console.log('[auth.login] Criando usuário automaticamente para:', email);

          // Usar tenantId fornecido ou derivar do email
          let finalTenantId = tenantId || 'default';
          if (!tenantId) {
            const domain = email.split('@')[1]?.split('.')[0]?.toLowerCase() || 'default';
            finalTenantId = domain === 'gmail' || domain === 'hotmail' ? 'default' : domain;
          }

          // Garantir que tenant existe
          await AuthService.ensureTenantExists(finalTenantId);

          // Criar usuário
          const userData = {
            tenantId: finalTenantId,
            identifier: email, // Usar email como identifier
            email,
            type: 'user',
            role: 'user',
            status: 'active',
            credits: 0,
            allowedPlugins: JSON.stringify(['bigtech']), // Plugins padrão
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          user = await appwrite.databases.createDocument(
            process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
            'users',
            ID.unique(),
            userData
          );

          console.log('[auth.login] Usuário criado automaticamente:', user.$id);
        }
      } catch (dbError) {
        console.error('[auth.login] Erro ao acessar banco de dados:', dbError);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
      }

      // Gerar token JWT para usuário
      const result = await AuthService.userLoginWithUserDoc(user);
      res.json(result);
    } else {
      // Modo produção: validar com Appwrite Accounts
      // Primeiro, verificar se usuário existe no banco de dados
      let users: any;
      try {
        users = await appwrite.databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
          'users',
          [Query.equal('email', email), Query.equal('status', 'active')]
        );
      } catch (userErr) {
        console.error('[auth.login] Erro ao buscar coleção `users`:', userErr);
        return res.status(500).json({ success: false, message: 'Erro ao verificar usuário' });
      }

      if (!users || users.documents.length === 0) {
        return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
      }

      const user = users.documents[0];

      // Tentar criar sessão na Appwrite via REST
      const rawEndpoint = process.env.APPWRITE_ENDPOINT || 'http://localhost/v1';
      const trimmed = rawEndpoint.replace(/\/$/, '');
      const apiBase = trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
      const project = process.env.APPWRITE_PROJECT_ID || 'bigtech';

      let resp: any;
      try {
        resp = await axios.post(
          `${apiBase}/account/sessions`,
          { email, password },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Appwrite-Project': project
            },
            timeout: 5000
          }
        );
      } catch (axiosErr: any) {
        // Se erro 401, pode ser que a conta não exista no Appwrite Accounts
        // Vamos tentar criar a conta
        if (axiosErr && axiosErr.response && axiosErr.response.status === 401) {
          try {
            console.log('[auth.login] Conta não encontrada, criando conta no Appwrite Accounts...');

            // Criar conta usando o SDK do Appwrite
            await appwrite.users.create(
              ID.unique(), // userId
              email, // email
              undefined, // phone (não usado)
              password, // password
              email // name
            );

            // Agora tentar login novamente
            resp = await axios.post(
              `${apiBase}/account/sessions`,
              { email, password },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'X-Appwrite-Project': project
                },
                timeout: 5000
              }
            );
          } catch (createErr: any) {
            console.error('[auth.login] Erro ao criar/tentar login na conta:', createErr);
            return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
          }
        } else {
          console.error('[auth.login] Erro ao chamar Appwrite /account/sessions:', axiosErr);
          return res.status(500).json({ success: false, message: 'Erro ao validar credenciais' });
        }
      }

      // Gerar token JWT para usuário
      const result = await AuthService.userLoginWithUserDoc(user);
      res.json(result);
    }
  } catch (err: any) {
    console.error('Erro no user login:', err);
    return res.status(500).json({ success: false, message: 'Erro interno no login' });
  }
});

// Rota de registro para usuários
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, company }: { name: string; email: string; password: string; company?: string } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Nome, email e senha são obrigatórios' });
  }

  try {
    // Derivar tenantId com lógica melhorada
    let tenantId = 'default';

    if (company && company.trim()) {
      // Se empresa fornecida, usar ela (sanitize)
      tenantId = company.toLowerCase().replace(/[^a-z0-9]/g, '');
    } else {
      // Se não há empresa, verificar se domínio é corporativo
      const domain = email.split('@')[1]?.split('.')[0]?.toLowerCase();

      // Lista de domínios pessoais comuns que não devem criar tenants separados
      const personalDomains = ['gmail', 'hotmail', 'outlook', 'yahoo', 'icloud', 'live', 'protonmail', 'aol', 'yandex'];

      if (domain && !personalDomains.includes(domain)) {
        // Domínio parece corporativo, usar como tenantId
        tenantId = domain;
      } else {
        // Domínio pessoal - usar tenant padrão compartilhado
        tenantId = 'default';
      }
    }

    // Verificar se usuário já existe
    const existingUsers = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      [Query.equal('email', email)]
    );

    if (existingUsers.documents.length > 0) {
      return res.status(409).json({ success: false, message: 'Email já cadastrado' });
    }

    // Garantir que tenant existe (auto-onboarding com status ativo)
    const tenantExists = await AuthService.ensureTenantExists(tenantId);

    // Criar documento na coleção users
    const userId = ID.unique();
    console.log('[auth.register] Generated userId:', userId, 'type:', typeof userId);
    const userData = {
      email,
      identifier: email.substring(0, 20), // Truncar para 20 chars conforme schema
      tenantId,
      type: 'user',
      role: 'viewer',
      status: 'active',
      credits: '0' // Como string conforme schema
    };

    console.log('[auth.register] Creating document with userId:', userId, 'userData:', userData);

    const newUser = await appwrite.databases.createDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      userId,
      userData
    );

    console.log('[auth.register] Novo usuário registrado:', newUser?.$id, 'tenant:', tenantId);

    // Log de auditoria
    await auditLogger.log({
      tenantId,
      userId: newUser.$id,
      action: tenantExists ? 'user_register' : 'user_register_tenant_created',
      resource: `user:${newUser.$id}`,
      details: {
        email,
        name,
        company: company || null,
        tenantCreated: !tenantExists,
        tenantId
      },
      ipAddress: 'system'
    });

    res.json({
      success: true,
      message: 'Conta criada com sucesso',
      tenantCreated: !tenantExists,
      tenantId
    });
  } catch (err: any) {
    console.error('Erro no registro:', err);
    return res.status(500).json({ success: false, message: 'Erro interno no registro' });
  }
});

// Rota para renovar access token usando refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  // O refresh token pode ser enviado no body (testes) ou como cookie HttpOnly (navegador).
  let { refreshToken } = req.body as { refreshToken?: string };
  // Log de debug para verificar se o cookie está chegando ao backend (apenas em dev)
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[auth.refresh] incoming cookies:', req.headers.cookie || '<no-cookie-header>')
      console.log('[auth.refresh] refreshToken from body:', refreshToken || '<no-token>')
    }
  } catch (e) {
    // não falhar por causa do log
  }
  // Se não veio no body, tentar extrair do header `cookie` (sem depender de cookie-parser)
  if (!refreshToken && req.headers && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').map(c => c.trim());
    for (const c of cookies) {
      const [k, v] = c.split('=');
      if (k === 'refreshToken') {
        refreshToken = decodeURIComponent(v || '');
        break;
      }
    }
  }

  if (!refreshToken) {
    console.log('[auth.refresh] No refresh token found, returning 400');
    return res.status(400).json({ success: false, message: 'refreshToken é obrigatório' });
  }

  console.log('[auth.refresh] Verifying refresh token...');
  const decoded = await AuthService.verifyRefreshToken(refreshToken);

  if (!decoded) {
    console.log('[auth.refresh] Invalid refresh token');
    return res.status(401).json({ success: false, message: 'Refresh token inválido ou expirado' });
  }

  console.log('[auth.refresh] Refresh token valid, userId:', decoded.userId);

  try {
    // Buscar usuário e gerar novos tokens
    const user = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      decoded.userId
    );

    if (!user || user.status !== 'active') {
      console.log('[auth.refresh] User not found or inactive:', decoded.userId);
      return res.status(401).json({ success: false, message: 'Usuário inválido' });
    }

    console.log('[auth.refresh] Generating new tokens for user:', user.$id);
    const token = AuthService.generateToken(user);
    const newRefresh = await AuthService.generateRefreshToken(user);

    const refreshMaxAge = parseInt(process.env.REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000));
    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshMaxAge
    });

    console.log('[auth.refresh] Tokens generated successfully');
    return res.json({ success: true, token });
  } catch (error) {
    console.error('Erro no refresh token:', error);
    return res.status(500).json({ success: false, message: 'Erro interno' });
  }
});

router.post('/logout', authenticateMiddleware, async (req: Request, res: Response) => {
  await AuthService.logout(req.userId!, req.tenantId!);
  // Limpar cookie de refresh token no cliente
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logout realizado com sucesso' });
});

router.get('/me/plugins', authenticateMiddleware, async (req: Request, res: Response) => {
  try {
    console.log('[auth.me.plugins] User authenticated:', req.userId);

    const user = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      req.userId!
    );

    console.log('[auth.me.plugins] User data:', { id: user.$id, tenantId: user.tenantId, allowedPlugins: user.allowedPlugins });

    // Buscar tenant para obter plugins ativos
    const tenant = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'tenants',
      user.tenantId
    );

    console.log('[auth.me.plugins] Tenant data:', { id: tenant.$id, plugins: tenant.plugins });

    // Usar plugins ativos do pluginLoader para desenvolvimento
    const activeTenantPluginIds = Array.from(pluginLoader.getActivePluginsForTenant(user.tenantId));
    console.log('[auth.me.plugins] activeTenantPluginIds from pluginLoader:', activeTenantPluginIds);

    let userAllowedPlugins = [];
    try {
      userAllowedPlugins = user.allowedPlugins ? JSON.parse(user.allowedPlugins) : [];
    } catch (e) {
      userAllowedPlugins = [];
    }

    console.log('[auth.me.plugins] userAllowedPlugins:', userAllowedPlugins);

    // Para desenvolvimento: se não há allowedPlugins configurado, permitir bigtech e bloquear infosimples
    if (userAllowedPlugins.length === 0) {
      userAllowedPlugins = ['bigtech']; // Apenas bigtech permitido
      console.log('[auth.me.plugins] Using default allowed plugins for development:', userAllowedPlugins);
    }

    const allowedPlugins = activeTenantPluginIds.filter(pluginId =>
      userAllowedPlugins.includes(pluginId)
    );

    console.log('[auth.me.plugins] allowedPlugins:', allowedPlugins);

    // Buscar detalhes dos plugins permitidos
    const pluginsDetails = [];
    for (const pluginId of allowedPlugins) {
      try {
        console.log(`[auth.me.plugins] Searching for plugin ${pluginId} in database`);
        const pluginDoc = await appwrite.databases.listDocuments(
          process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
          'plugins',
          [Query.equal('$id', pluginId)]
        );

        console.log(`[auth.me.plugins] Found ${pluginDoc.documents.length} documents for plugin ${pluginId}`);
        if (pluginDoc.documents.length > 0) {
          const plugin = pluginDoc.documents[0];
          console.log(`[auth.me.plugins] Plugin details:`, { id: plugin.$id, name: plugin.name });
          pluginsDetails.push({
            id: plugin.$id,
            name: plugin.name,
            type: plugin.type,
            config: plugin.config
          });
        } else {
          console.log(`[auth.me.plugins] No documents found for plugin ${pluginId}, returning mock data`);
          // Para desenvolvimento, retornar dados mock se não encontrar no banco
          pluginsDetails.push({
            id: pluginId,
            name: pluginId === 'bigtech' ? 'BigTech Consultas' : pluginId,
            type: 'consulta',
            config: {}
          });
        }
      } catch (error) {
        console.warn(`Could not load details for plugin ${pluginId}:`, error);
        // Mesmo em erro, retornar dados mock para desenvolvimento
        pluginsDetails.push({
          id: pluginId,
          name: pluginId === 'bigtech' ? 'BigTech Consultas' : pluginId,
          type: 'consulta',
          config: {}
        });
      }
    }

    console.log('[auth.me.plugins] pluginsDetails:', pluginsDetails);

    res.json({
      success: true,
      plugins: pluginsDetails
    });
  } catch (error) {
    console.error('Error getting user plugins:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar plugins do usuário'
    });
  }
});

// Rota para dados do admin (acesso global)
router.get('/admin/me', authenticateAdminMiddleware, async (req: Request, res: Response) => {
  try {
    const admin = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      req.userId!
    );

    res.json({
      success: true,
      user: {
        id: admin.$id,
        identifier: AuthValidators.formatIdentifier(admin.identifier),
        type: admin.type,
        role: admin.role,
        credits: admin.credits,
        status: admin.status,
        isAdmin: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do administrador'
    });
  }
});

// Rota para dados do usuário logado
router.get('/me', authenticateMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await appwrite.databases.getDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      req.userId!
    );

    // Calcular total de consultas
    const consultas = await appwrite.databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'consultas',
      [Query.equal('userId', req.userId!), Query.equal('tenantId', user.tenantId)]
    );
    const totalQueries = consultas.documents.length;

    // Calcular serviço favorito (tipo mais frequente)
    const typeCount: { [key: string]: number } = {};
    consultas.documents.forEach((consulta: any) => {
      const type = consulta.type || 'desconhecido';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    const favoriteService = Object.keys(typeCount).reduce((a, b) => typeCount[a] > typeCount[b] ? a : b, 'Nenhum');

    // Preferences: assumir armazenado em campo 'preferences' como JSON string, ou vazio
    let preferences = {};
    try {
      preferences = user.preferences ? JSON.parse(user.preferences) : {};
    } catch (e) {
      preferences = {};
    }

    res.json({
      success: true,
      user: {
        id: user.$id,
        name: user.name || user.email || AuthValidators.formatIdentifier(user.identifier),
        email: user.email,
        phone: user.phone || '', // Campo opcional, adicionar se necessário
        credits: user.credits || 0,
        preferences,
        joinDate: user.createdAt,
        totalQueries,
        favoriteService,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do usuário'
    });
  }
});

// Rota para atualizar dados do usuário logado
router.put('/me', authenticateMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, email, phone, preferences } = req.body;

    // Validações básicas
    if (name && (typeof name !== 'string' || name.length < 2)) {
      return res.status(400).json({ success: false, message: 'Nome deve ter pelo menos 2 caracteres' });
    }

    if (email && (typeof email !== 'string' || !email.includes('@'))) {
      return res.status(400).json({ success: false, message: 'Email inválido' });
    }

    if (phone && (typeof phone !== 'string' || phone.length < 10)) {
      return res.status(400).json({ success: false, message: 'Telefone deve ter pelo menos 10 dígitos' });
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (preferences !== undefined) updateData.preferences = JSON.stringify(preferences);

    // Adicionar timestamp de atualização
    updateData.updatedAt = new Date().toISOString();

    // Atualizar documento
    const updatedUser = await appwrite.databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
      'users',
      req.userId!,
      updateData
    );

    // Log de auditoria
    await auditLogger.log({
      tenantId: req.tenantId!,
      userId: req.userId!,
      action: 'user_profile_update',
      resource: `user:${req.userId}`,
      details: { updatedFields: Object.keys(updateData) },
      ipAddress: req.ip || 'unknown'
    });

    // Preparar resposta com preferences parseado
    let responsePreferences = {};
    try {
      responsePreferences = updatedUser.preferences ? JSON.parse(updatedUser.preferences) : {};
    } catch (e) {
      responsePreferences = {};
    }

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: {
        id: updatedUser.$id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        preferences: responsePreferences
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfil'
    });
  }
});

export { router as authRouter };
export default AuthService;