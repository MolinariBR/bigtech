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
    execute(context: PluginContext): Promise<PluginResult>;
    private getConsultaCode;
    private callInfosimplesAPI;
    private normalizeResponse;
    private normalizeData;
    private calculateCost;
    private executeFallback;
}
export default InfosimplesPlugin;
//# sourceMappingURL=index.d.ts.map