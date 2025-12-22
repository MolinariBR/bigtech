import { Plugin, PluginContext, PluginResult } from '../../../core/pluginLoader';
import { InfosimplesConfig } from './types2';
export declare class InfosimplesPlugin implements Plugin {
    id: string;
    type: "consulta";
    name: string;
    version: string;
    config: InfosimplesConfig;
    constructor(config?: Partial<InfosimplesConfig>);
    install(): Promise<void>;
    enable(tenantId: string): Promise<void>;
    disable(tenantId: string): Promise<void>;
    getAvailableServices(): any[];
    execute(context: PluginContext): Promise<PluginResult>;
    private getConsultaCode;
    private getLegacyCode;
    private callInfosimplesAPI;
    private sleep;
    private normalizeResponse;
    private normalizeData;
    private calculateCost;
    private executeFallback;
    private executeBrasilApiFallback;
    private executeViaCepFallback;
    private validateCpf;
}
export default InfosimplesPlugin;
//# sourceMappingURL=index.d.ts.map