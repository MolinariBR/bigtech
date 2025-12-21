"use strict";
// Baseado em: 4.Entities.md v1.1, 6.UserStories.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities → 6.UserStories
// Decisão: Módulo de autenticação CORE com validação CPF/CNPJ e integração Appwrite JWT
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = exports.authenticateAdminMiddleware = exports.authenticateMiddleware = exports.AuthService = exports.AuthValidators = void 0;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const appwrite_1 = require("../lib/appwrite");
const audit_1 = require("./audit");
const router = (0, express_1.Router)();
exports.authRouter = router;
const appwrite = appwrite_1.AppwriteService.getInstance();
// Utilitários de validação
class AuthValidators {
    // Validar CPF
    static isValidCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        if (cpf.length !== 11)
            return false;
        if (/^(\d)\1+$/.test(cpf))
            return false; // CPF com todos dígitos iguais
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11)
            remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9)))
            return false;
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11)
            remainder = 0;
        return remainder === parseInt(cpf.charAt(10));
    }
    // Validar CNPJ
    static isValidCNPJ(cnpj) {
        cnpj = cnpj.replace(/[^\d]/g, '');
        if (cnpj.length !== 14)
            return false;
        if (/^(\d)\1+$/.test(cnpj))
            return false; // CNPJ com todos dígitos iguais
        // Validar primeiro dígito verificador
        let size = cnpj.length - 2;
        let numbers = cnpj.substring(0, size);
        const digits = cnpj.substring(size);
        let sum = 0;
        let pos = size - 7;
        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i)) * pos--;
            if (pos < 2)
                pos = 9;
        }
        let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (result !== parseInt(digits.charAt(0)))
            return false;
        // Validar segundo dígito verificador
        size = size + 1;
        numbers = cnpj.substring(0, size);
        sum = 0;
        pos = size - 7;
        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i)) * pos--;
            if (pos < 2)
                pos = 9;
        }
        result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        return result === parseInt(digits.charAt(1));
    }
    // Validar CPF ou CNPJ
    static isValidIdentifier(identifier) {
        const clean = identifier.replace(/[^\d]/g, '');
        return clean.length === 11 ? this.isValidCPF(clean) : this.isValidCNPJ(clean);
    }
    // Formatar CPF/CNPJ para exibição
    static formatIdentifier(identifier) {
        const clean = identifier.replace(/[^\d]/g, '');
        if (clean.length === 11) {
            return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        else if (clean.length === 14) {
            return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return identifier;
    }
}
exports.AuthValidators = AuthValidators;
// Classe principal de autenticação
class AuthService {
    // Login de usuário
    static async login(identifier, tenantId) {
        try {
            // Validar formato do identificador
            if (!AuthValidators.isValidIdentifier(identifier)) {
                return {
                    success: false,
                    message: 'CPF/CNPJ inválido'
                };
            }
            // Buscar usuário no Appwrite
            const users = await appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', [
                `tenantId=${tenantId}`,
                `identifier=${identifier}`,
                'status=active'
            ]);
            if (users.documents.length === 0) {
                // Usuário não existe - criar automaticamente para MVP
                const newUser = await this.createUser(identifier, tenantId);
                // Gerar token JWT
                const token = this.generateToken(newUser);
                // Log de auditoria
                await audit_1.auditLogger.log({
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
            await audit_1.auditLogger.log({
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
        }
        catch (error) {
            console.error('Auth login error:', error);
            return {
                success: false,
                message: 'Erro interno do servidor'
            };
        }
    }
    // Criar novo usuário
    static async createUser(identifier, tenantId) {
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
        return await appwrite.databases.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', 'unique()', // Auto-generate ID
        userData);
    }
    // Gerar token JWT
    static generateToken(user) {
        const payload = {
            userId: user.$id,
            tenantId: user.tenantId,
            identifier: user.identifier,
            type: user.type,
            role: user.role,
            iat: Math.floor(Date.now() / 1000)
        };
        const secret = this.JWT_SECRET;
        const options = {
            expiresIn: this.JWT_EXPIRES_IN
        };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    // Verificar token JWT
    static async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            // Verificar se usuário ainda existe e está ativo
            const user = await appwrite.databases.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', decoded.userId);
            if (user.status !== 'active' || user.tenantId !== decoded.tenantId) {
                return null;
            }
            return decoded;
        }
        catch (error) {
            return null;
        }
    }
    // Logout (apenas log de auditoria)
    static async logout(userId, tenantId) {
        await audit_1.auditLogger.log({
            tenantId,
            userId,
            action: 'user_logout',
            resource: `user:${userId}`,
            details: {},
            ipAddress: 'system'
        });
    }
    // Login de administrador - valida role admin
    static async adminLogin(identifier) {
        try {
            // Validar formato do identificador
            if (!AuthValidators.isValidIdentifier(identifier)) {
                return {
                    success: false,
                    message: 'CPF/CNPJ inválido'
                };
            }
            // Para administradores, buscar em todos os tenants (isolamento global)
            const users = await appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', [
                `identifier=${identifier}`,
                'status=active', // Garantir que está ativo
                'role=admin'
            ]);
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
            await audit_1.auditLogger.log({
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
        }
        catch (error) {
            console.error('Admin auth login error:', error);
            return {
                success: false,
                message: 'Erro interno do servidor'
            };
        }
    }
    // Gerar token JWT para administrador (isolamento global)
    static generateAdminToken(admin) {
        const payload = {
            userId: admin.$id,
            tenantId: 'admin', // Tenant especial para admins
            identifier: admin.identifier,
            type: admin.type,
            role: admin.role,
            isAdmin: true, // Flag especial para admins
            iat: Math.floor(Date.now() / 1000)
        };
        const secret = this.JWT_SECRET;
        const options = {
            expiresIn: this.JWT_EXPIRES_IN
        };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
}
exports.AuthService = AuthService;
AuthService.JWT_SECRET = process.env.JWT_SECRET || 'bigtech-secret-key';
AuthService.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
AuthService.BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
// Middleware de autenticação
const authenticateMiddleware = async (req, res, next) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.authenticateMiddleware = authenticateMiddleware;
// Middleware de autenticação para administradores
const authenticateAdminMiddleware = async (req, res, next) => {
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};
exports.authenticateAdminMiddleware = authenticateAdminMiddleware;
// Rotas de autenticação
router.post('/login', async (req, res) => {
    const { identifier } = req.body;
    const tenantId = req.tenantId || req.headers['x-tenant-id'] || 'default';
    if (!identifier) {
        return res.status(400).json({
            success: false,
            message: 'CPF/CNPJ é obrigatório'
        });
    }
    const result = await AuthService.login(identifier, tenantId);
    res.json(result);
});
// Rota de login para administradores
router.post('/admin/login', async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
        return res.status(400).json({
            success: false,
            message: 'CPF/CNPJ é obrigatório'
        });
    }
    const result = await AuthService.adminLogin(identifier);
    res.json(result);
});
router.post('/logout', exports.authenticateMiddleware, async (req, res) => {
    await AuthService.logout(req.userId, req.tenantId);
    res.json({ success: true, message: 'Logout realizado com sucesso' });
});
router.get('/me', exports.authenticateMiddleware, async (req, res) => {
    try {
        const user = await appwrite.databases.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', req.userId);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados do usuário'
        });
    }
});
// Rota para dados do admin (acesso global)
router.get('/admin/me', exports.authenticateAdminMiddleware, async (req, res) => {
    try {
        const admin = await appwrite.databases.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', req.userId);
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dados do administrador'
        });
    }
});
exports.default = AuthService;
//# sourceMappingURL=auth.js.map