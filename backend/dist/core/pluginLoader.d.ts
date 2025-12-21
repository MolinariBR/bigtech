interface Plugin {
    id: string;
    type: 'consulta' | 'pagamento' | 'mercado' | 'funcional';
    version: string;
    install(): Promise<void>;
    enable(tenantId: string): Promise<void>;
    disable(tenantId: string): Promise<void>;
    execute(context: PluginContext): Promise<PluginResult>;
}
interface PluginContext {
    tenantId: string;
    userId: string;
    input: any;
    config: any;
}
interface PluginResult {
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
    getActivePlugins(tenantId: string): Promise<Plugin[]>;
    executePlugin(pluginId: string, context: PluginContext): Promise<PluginResult>;
    getAvailablePlugins(): {
        id: string;
        type: string;
        version: string;
    }[];
}
export declare const pluginLoader: PluginLoader;
export {};
//# sourceMappingURL=pluginLoader.d.ts.map