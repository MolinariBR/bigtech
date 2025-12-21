"use strict";
// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities
// Decisão: Middleware para isolamento multi-tenant via tenantId
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiTenantMiddleware = void 0;
const appwrite_1 = require("../lib/appwrite");
const multiTenantMiddleware = async (req, res, next) => {
    try {
        // Extrair tenantId do header, query param ou subdomain
        let tenantId = req.headers['x-tenant-id'] ||
            req.query.tenantId;
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
        // Validar se tenant existe (opcional - pode ser feito em cada rota)
        const appwrite = appwrite_1.AppwriteService.getInstance();
        try {
            const tenant = await appwrite.databases.getDocument(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'tenants', tenantId);
            if (tenant.status !== 'active') {
                return res.status(403).json({
                    error: 'Tenant not active',
                    message: 'This tenant is currently inactive'
                });
            }
            req.tenantId = tenantId;
            req.tenant = tenant;
        }
        catch (error) {
            // Tenant não encontrado - permitir para rotas públicas ou criar automaticamente
            if (req.path.includes('/auth/login') || req.path === '/health') {
                req.tenantId = tenantId;
            }
            else {
                return res.status(404).json({
                    error: 'Tenant not found',
                    message: 'The specified tenant does not exist'
                });
            }
        }
        next();
    }
    catch (error) {
        console.error('Multi-tenant middleware error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to process tenant information'
        });
    }
};
exports.multiTenantMiddleware = multiTenantMiddleware;
//# sourceMappingURL=multiTenant.js.map