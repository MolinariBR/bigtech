export interface Plugin {
    id: string;
    type: 'consulta' | 'pagamento' | 'mercado' | 'funcional';
    version: string;
    install(): Promise<void>;
    enable(): Promise<void>;
    disable(): Promise<void>;
    execute(context: PluginContext): Promise<PluginResult>;
    getAvailableServices?(context?: PluginContext): Promise<any[]> | any[];
}
export interface PluginContext {
    userId: string;
    input: any;
    config: any;
}
export interface PluginResult {
    success: boolean;
    data?: any;
    error?: string;
    cost?: number;
}
export declare class PluginLoader {
    private static instance;
    private appwrite;
    private plugins;
    private activePlugins;
    private constructor();
    static getInstance(): PluginLoader;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    private loadPlugins;
    private validatePlugin;
    private loadActivePlugins;
    private loadGlobalPluginConfigs;
    private decryptIfNeeded;
    getActivePlugins(): Promise<Plugin[]>;
    executePlugin(pluginId: string, context: PluginContext): Promise<PluginResult>;
    getAvailablePlugins(): {
        id: string;
        type: string;
        version: string;
    }[];
    getActivePluginsForTenant(): Set<string>;
    getPlugin(pluginId: string): Plugin | undefined;
    private sanitizeAuditData;
    private extractConsultaId;
}
export declare const pluginLoader: PluginLoader;
//# sourceMappingURL=pluginLoader.d.ts.map