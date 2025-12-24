// Baseado em: 2.Architecture.md v1.0.1
// Precedência: 1.Project → 2.Architecture
// Decisão: Serviço singleton para integração com Appwrite BaaS

import { Client, Databases, Account, Users } from 'node-appwrite';

export class AppwriteService {
  private static instance: AppwriteService;
  private client: Client;
  public databases: Databases;
  public account: Account;
  public users: Users;

  private constructor() {
    this.client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
      .setKey(process.env.APPWRITE_API_KEY || '');

    this.databases = new Databases(this.client);
    this.account = new Account(this.client);
    this.users = new Users(this.client);
  }

  public static getInstance(): AppwriteService {
    if (!AppwriteService.instance) {
      AppwriteService.instance = new AppwriteService();
    }
    return AppwriteService.instance;
  }

  // Método para criar cliente com JWT do usuário
  public createUserClient(jwt: string): Client {
    return new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT || 'http://localhost/v1')
      .setProject(process.env.APPWRITE_PROJECT_ID || 'bigtech')
      .setJWT(jwt);
  }

  // Método para verificar saúde do Appwrite
  public async healthCheck(): Promise<boolean> {
    try {
      await this.databases.listCollections(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb'
      );
      return true;
    } catch (error) {
      console.error('Appwrite health check failed:', error);
      return false;
    }
  }
}