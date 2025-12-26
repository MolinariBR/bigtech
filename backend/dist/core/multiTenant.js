"use strict";
// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities
// Decisão: Middleware para isolamento multi-tenant via tenantId
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiTenantMiddleware = void 0;
const multiTenantMiddleware = async (req, res, next) => {
    try {
        // Sistema agora é single-tenant - sempre usar tenant padrão
        req.tenantId = 'default';
        // Para rotas admin, marcar como admin
        if (req.path.includes('/admin/')) {
            req.tenantId = 'admin';
        }
        next();
    }
    catch (error) {
        console.error('Middleware error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to process request'
        });
    }
};
exports.multiTenantMiddleware = multiTenantMiddleware;
//# sourceMappingURL=multiTenant.js.map