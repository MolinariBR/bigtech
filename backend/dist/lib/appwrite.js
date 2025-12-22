"use strict";
// Baseado em: 2.Architecture.md v1.0.1
// Precedência: 1.Project → 2.Architecture
// Decisão: Serviço singleton para integração com Appwrite BaaS
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppwriteService = void 0;
const node_appwrite_1 = require("node-appwrite");
class AppwriteService {
    static instance;
    client;
    databases;
    account;
    users;
    constructor() {
        this.client = new node_appwrite_1.Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
            .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
            .setKey(process.env.APPWRITE_API_KEY || '');
        this.databases = new node_appwrite_1.Databases(this.client);
        this.account = new node_appwrite_1.Account(this.client);
        this.users = new node_appwrite_1.Users(this.client);
    }
    static getInstance() {
        if (!AppwriteService.instance) {
            AppwriteService.instance = new AppwriteService();
        }
        return AppwriteService.instance;
    }
    // Método para criar cliente com JWT do usuário
    createUserClient(jwt) {
        return new node_appwrite_1.Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
            .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
            .setJWT(jwt);
    }
    // Método para verificar saúde do Appwrite
    async healthCheck() {
        try {
            await this.databases.listCollections(process.env.APPWRITE_DATABASE_ID || 'bigtechdb');
            return true;
        }
        catch (error) {
            console.error('Appwrite health check failed:', error);
            return false;
        }
    }
}
exports.AppwriteService = AppwriteService;
//# sourceMappingURL=appwrite.js.map