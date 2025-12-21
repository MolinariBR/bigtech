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
declare const plugin: Plugin;
export declare function handleAsaasWebhook(webhookData: any): Promise<void>;
export default plugin;
//# sourceMappingURL=index.d.ts.map