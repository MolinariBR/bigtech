import { Client, Databases, Account, Users } from 'node-appwrite';
export declare class AppwriteService {
    private static instance;
    private client;
    databases: Databases;
    account: Account;
    users: Users;
    databaseId: string;
    private constructor();
    static getInstance(): AppwriteService;
    createUserClient(jwt: string): Client;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=appwrite.d.ts.map