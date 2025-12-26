import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
            userId?: string;
            user?: any;
        }
    }
}
export declare const multiTenantMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=multiTenant.d.ts.map