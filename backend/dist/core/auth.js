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
const axios_1 = __importDefault(require("axios"));
const node_appwrite_1 = require("node-appwrite");
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
    static JWT_SECRET = process.env.JWT_SECRET || 'bigtech-secret-key';
    static JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
    static REFRESH_SECRET = process.env.REFRESH_SECRET || 'bigtech-refresh-secret';
    static REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';
    static BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
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
            // Verificar se tenant existe, se não existir, criar automaticamente (auto-onboarding)
            const tenantExists = await this.ensureTenantExists(tenantId);
            // Buscar usuário no Appwrite
            const users = await appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', [
                node_appwrite_1.Query.equal('tenantId', tenantId),
                node_appwrite_1.Query.equal('identifier', identifier),
                node_appwrite_1.Query.equal('status', 'active')
            ]);
            if (users.documents.length === 0) {
                // Usuário não existe - criar automaticamente para MVP
                const newUser = await this.createUser(identifier, tenantId);
                // Gerar token JWT
                const token = this.generateToken(newUser);
                // Gerar refresh token e salvar no usuário
                const refreshToken = await this.generateRefreshToken(newUser);
                // Log de auditoria
                await audit_1.auditLogger.log({
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
    // Garantir que tenant existe, criar se necessário (auto-onboarding)
    static async ensureTenantExists(tenantId) {
        try {
            // Tentar buscar tenant
            await appwrite.databases.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'tenants', tenantId);
            return true; // Tenant já existe
        }
        catch (error) {
            // Se erro for "document not found", criar tenant
            if (error.code === 404 || error.message?.includes('not found')) {
                try {
                    const tenantData = {
                        name: tenantId, // Usar tenantId como nome base
                        status: 'pending', // Status pending para aprovação admin
                        plugins: '[]' // Plugins padrão como string JSON
                    };
                    await appwrite.databases.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'tenants', tenantId, // Usar tenantId como ID do documento
                    tenantData);
                    // Log de auditoria para criação de tenant
                    await audit_1.auditLogger.log({
                        tenantId,
                        action: 'tenant_auto_created',
                        resource: `tenant:${tenantId}`,
                        details: { name: tenantId, status: 'pending' },
                        ipAddress: 'system'
                    });
                    return false; // Tenant foi criado
                }
                catch (createError) {
                    console.error('Erro ao criar tenant automaticamente:', createError);
                    throw createError;
                }
            }
            // Outro erro, relançar
            throw error;
        }
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
    // Gerar refresh token e armazenar no documento do usuário
    static async generateRefreshToken(user) {
        const payload = {
            userId: user.$id,
            tenantId: user.tenantId,
            iat: Math.floor(Date.now() / 1000)
        };
        const options = {
            expiresIn: this.REFRESH_EXPIRES_IN
        };
        const refreshToken = jsonwebtoken_1.default.sign(payload, this.REFRESH_SECRET, options);
        try {
            // Armazenar refresh token no documento do usuário (substitui token anterior)
            await appwrite.databases.updateDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', user.$id, { refreshToken });
        }
        catch (error) {
            console.error('Erro ao salvar refresh token:', error);
        }
        return refreshToken;
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
    // Verificar refresh token: valida assinatura e checa se bate com o armazenado
    static async verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.REFRESH_SECRET);
            // Buscar usuário e comparar token salvo
            const user = await appwrite.databases.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', decoded.userId);
            if (process.env.NODE_ENV !== 'production') {
                try {
                    console.log('[auth.verifyRefreshToken] decoded:', { userId: decoded.userId, iat: decoded.iat, exp: decoded.exp });
                    console.log('[auth.verifyRefreshToken] fetched user id:', user.$id);
                    console.log('[auth.verifyRefreshToken] user.refreshToken present:', !!user.refreshToken);
                    console.log('[auth.verifyRefreshToken] token equality:', user.refreshToken === token);
                }
                catch (e) {
                    // ignora erros de logging
                }
            }
            if (!user || user.refreshToken !== token)
                return null;
            return decoded;
        }
        catch (error) {
            return null;
        }
    }
    // Logout (apenas log de auditoria)
    static async logout(userId, tenantId) {
        // Limpar refresh token armazenado
        try {
            await appwrite.databases.updateDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', userId, { refreshToken: null });
        }
        catch (err) {
            console.error('Erro ao limpar refresh token no logout:', err);
        }
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
                node_appwrite_1.Query.equal('identifier', identifier),
                node_appwrite_1.Query.equal('status', 'active'), // Garantir que está ativo
                node_appwrite_1.Query.equal('role', 'admin')
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
    // Gerar token e resposta a partir de um documento de admin (usado após validação pela Appwrite Accounts)
    static async adminLoginWithAdminDoc(admin) {
        try {
            // Verificar status
            if (admin.status && admin.status !== 'active') {
                return { success: false, message: 'Administrador inativo' };
            }
            const token = this.generateAdminToken(admin);
            // Log de auditoria
            await audit_1.auditLogger.log({
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
        }
        catch (error) {
            console.error('adminLoginWithAdminDoc error:', error);
            return { success: false, message: 'Erro interno do servidor' };
        }
    }
    // Gerar token e resposta a partir de um documento de usuário (usado após validação pela Appwrite Accounts)
    static async userLoginWithUserDoc(user) {
        try {
            // Verificar status
            if (user.status && user.status !== 'active') {
                return { success: false, message: 'Usuário inativo' };
            }
            const token = this.generateToken(user);
            // Log de auditoria
            await audit_1.auditLogger.log({
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
        }
        catch (error) {
            console.error('userLoginWithUserDoc error:', error);
            return { success: false, message: 'Erro interno do servidor' };
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
// Rota de login para administradores
// Admin login: now uses Appwrite Accounts (email + password)
router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
    }
    try {
        // Tentar criar sessão na Appwrite via REST (evita incompatibilidades do SDK)
        const rawEndpoint = process.env.APPWRITE_ENDPOINT || 'http://localhost/v1';
        const trimmed = rawEndpoint.replace(/\/$/, '');
        // Garantir que temos o path /v1 apenas uma vez
        const apiBase = trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
        const project = process.env.APPWRITE_PROJECT_ID || 'bigtech';
        let resp;
        try {
            resp = await axios_1.default.post(`${apiBase}/account/sessions`, { email, password }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': project
                },
                timeout: 5000
            });
            if (process.env.NODE_ENV !== 'production') {
                console.log('[auth.admin.login] Appwrite /account/sessions response status:', resp.status);
                try {
                    console.log('[auth.admin.login] Appwrite response data keys:', Object.keys(resp.data || {}));
                }
                catch (e) {
                    // ignore
                }
            }
        }
        catch (axiosErr) {
            // Captura detalhes da resposta do Appwrite (401, 400, 500 etc.)
            if (axiosErr && axiosErr.response) {
                console.error('[auth.admin.login] Appwrite response error status:', axiosErr.response.status);
                try {
                    console.error('[auth.admin.login] Appwrite response error data:', JSON.stringify(axiosErr.response.data));
                }
                catch (e) {
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
        // Encontrar admin na coleção `admins` por email
        let admins;
        try {
            admins = await appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'admins', [node_appwrite_1.Query.equal('email', email), node_appwrite_1.Query.equal('status', 'active')]);
        }
        catch (adminErr) {
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
    }
    catch (err) {
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
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
    }
    try {
        // Primeiro, verificar se usuário existe no banco de dados
        let users;
        try {
            users = await appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', [node_appwrite_1.Query.equal('email', email), node_appwrite_1.Query.equal('status', 'active')]);
        }
        catch (userErr) {
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
        let resp;
        try {
            resp = await axios_1.default.post(`${apiBase}/account/sessions`, { email, password }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': project
                },
                timeout: 5000
            });
        }
        catch (axiosErr) {
            // Se erro 401, pode ser que a conta não exista no Appwrite Accounts
            // Vamos tentar criar a conta
            if (axiosErr && axiosErr.response && axiosErr.response.status === 401) {
                try {
                    console.log('[auth.login] Conta não encontrada, criando conta no Appwrite Accounts...');
                    // Criar conta usando o SDK do Appwrite
                    await appwrite.users.create(node_appwrite_1.ID.unique(), // userId
                    email, // email
                    undefined, // phone (não usado)
                    password, // password
                    email // name
                    );
                    // Agora tentar login novamente
                    resp = await axios_1.default.post(`${apiBase}/account/sessions`, { email, password }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Appwrite-Project': project
                        },
                        timeout: 5000
                    });
                }
                catch (createErr) {
                    console.error('[auth.login] Erro ao criar/tentar login na conta:', createErr);
                    return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
                }
            }
            else {
                console.error('[auth.login] Erro ao chamar Appwrite /account/sessions:', axiosErr);
                return res.status(500).json({ success: false, message: 'Erro ao validar credenciais' });
            }
        }
        // Gerar token JWT para usuário
        const result = await AuthService.userLoginWithUserDoc(user);
        res.json(result);
    }
    catch (err) {
        console.error('Erro no user login:', err);
        return res.status(500).json({ success: false, message: 'Erro interno no login' });
    }
});
// Rota de registro para usuários
router.post('/register', async (req, res) => {
    const { name, email, password, company } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Nome, email e senha são obrigatórios' });
    }
    try {
        // Derivar tenantId do domínio do email ou da empresa
        let tenantId = 'default';
        if (company) {
            tenantId = company.toLowerCase().replace(/[^a-z0-9]/g, '');
        }
        else {
            const domain = email.split('@')[1];
            if (domain) {
                tenantId = domain.split('.')[0].toLowerCase();
            }
        }
        // Verificar se usuário já existe
        const existingUsers = await appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', [node_appwrite_1.Query.equal('email', email)]);
        if (existingUsers.documents.length > 0) {
            return res.status(409).json({ success: false, message: 'Email já cadastrado' });
        }
        // Garantir que tenant existe (auto-onboarding)
        const tenantExists = await AuthService.ensureTenantExists(tenantId);
        // Criar documento na coleção users
        const userId = node_appwrite_1.ID.unique();
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
        const newUser = await appwrite.databases.createDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', userId, userData);
        console.log('[auth.register] Novo usuário registrado:', newUser?.$id, 'tenant:', tenantId);
        // Log de auditoria
        await audit_1.auditLogger.log({
            tenantId,
            userId: newUser.$id,
            action: tenantExists ? 'user_register' : 'user_register_tenant_created',
            resource: `user:${newUser.$id}`,
            details: {
                email,
                name,
                tenantCreated: !tenantExists
            },
            ipAddress: 'system'
        });
        res.json({
            success: true,
            message: 'Conta criada com sucesso',
            tenantCreated: !tenantExists
        });
    }
    catch (err) {
        console.error('Erro no registro:', err);
        return res.status(500).json({ success: false, message: 'Erro interno no registro' });
    }
});
// Rota para renovar access token usando refresh token
router.post('/refresh', async (req, res) => {
    // O refresh token pode ser enviado no body (testes) ou como cookie HttpOnly (navegador).
    let { refreshToken } = req.body;
    // Log de debug para verificar se o cookie está chegando ao backend (apenas em dev)
    try {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[auth.refresh] incoming cookies:', req.headers.cookie || '<no-cookie-header>');
        }
    }
    catch (e) {
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
        return res.status(400).json({ success: false, message: 'refreshToken é obrigatório' });
    }
    const decoded = await AuthService.verifyRefreshToken(refreshToken);
    if (!decoded) {
        return res.status(401).json({ success: false, message: 'Refresh token inválido ou expirado' });
    }
    try {
        // Buscar usuário e gerar novos tokens
        const user = await appwrite.databases.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'users', decoded.userId);
        if (!user || user.status !== 'active') {
            return res.status(401).json({ success: false, message: 'Usuário inválido' });
        }
        const token = AuthService.generateToken(user);
        const newRefresh = await AuthService.generateRefreshToken(user);
        const refreshMaxAge = parseInt(process.env.REFRESH_EXPIRES_MS || String(7 * 24 * 60 * 60 * 1000));
        res.cookie('refreshToken', newRefresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: refreshMaxAge
        });
        return res.json({ success: true, token });
    }
    catch (error) {
        console.error('Erro no refresh token:', error);
        return res.status(500).json({ success: false, message: 'Erro interno' });
    }
});
router.post('/logout', exports.authenticateMiddleware, async (req, res) => {
    await AuthService.logout(req.userId, req.tenantId);
    // Limpar cookie de refresh token no cliente
    res.clearCookie('refreshToken');
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