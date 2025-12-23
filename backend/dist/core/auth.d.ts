import { Request, Response } from 'express';
declare const router: import("express-serve-static-core").Router;
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
interface AuthResponse {
    success: boolean;
    token?: string;
    user?: any;
    message?: string;
    refreshToken?: string;
    tenantCreated?: boolean;
}
export declare class AuthValidators {
    static isValidCPF(cpf: string): boolean;
    static isValidCNPJ(cnpj: string): boolean;
    static isValidIdentifier(identifier: string): boolean;
    static formatIdentifier(identifier: string): string;
}
export declare class AuthService {
    private static readonly JWT_SECRET;
    private static readonly JWT_EXPIRES_IN;
    private static readonly REFRESH_SECRET;
    private static readonly REFRESH_EXPIRES_IN;
    private static readonly BCRYPT_ROUNDS;
    static login(identifier: string, tenantId: string): Promise<AuthResponse>;
    private static createUser;
    private static ensureTenantExists;
    static generateToken(user: any): string;
    static generateRefreshToken(user: any): Promise<string>;
    static verifyToken(token: string): Promise<any | null>;
    static verifyRefreshToken(token: string): Promise<any | null>;
    static logout(userId: string, tenantId: string): Promise<void>;
    static adminLogin(identifier: string): Promise<AuthResponse>;
    static adminLoginWithAdminDoc(admin: any): Promise<AuthResponse>;
    private static generateAdminToken;
}
export declare const authenticateMiddleware: (req: Request, res: Response, next: any) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const authenticateAdminMiddleware: (req: Request, res: Response, next: any) => Promise<Response<any, Record<string, any>> | undefined>;
export { router as authRouter };
export default AuthService;
//# sourceMappingURL=auth.d.ts.map