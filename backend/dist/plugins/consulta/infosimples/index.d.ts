import { Plugin, PluginContext, PluginResult } from '../../../core/pluginLoader';
import { InfosimplesConfig } from './types2';
export declare class InfosimplesPlugin implements Plugin {
    id: string;
    type: "consulta";
    name: string;
    version: string;
    config: InfosimplesConfig;
    private schemasCache;
    private requestTimestamps;
    private readonly maxRequestsPerMinute;
    private readonly minRequestInterval;
    constructor(config?: Partial<InfosimplesConfig>);
    install(): Promise<void>;
    enable(): Promise<void>;
    disable(): Promise<void>;
    private getSchemas;
    private getSchemaForService;
    private getEndpointForService;
    execute(context: PluginContext): Promise<PluginResult>;
    private getConsultaCode;
    private getLegacyCode;
    private callInfosimplesAPI;
    private sleep;
    private getServiceIdFromEndpoint;
    private buildQueryParamsFromSchema;
    private buildQueryParamsFallback;
    private applyRateLimiting;
    private normalizeResponse;
    private normalizeData;
    private calculateCost;
    /**
     * Calcula custo do serviço usando preços customizados se disponíveis
     */
    private calculateCostWithContext;
    private executeFallback;
    private executeBrasilApiFallback;
    private executeViaCepFallback;
    private validateCpf;
    private inferCategory;
    private getPriceForCategory;
    private getDescriptionFromSummary;
    private getHardcodedServices;
    private formatBirthdate;
    getAvailableServices(context?: PluginContext): Promise<any[]>;
}
export default InfosimplesPlugin;
//# sourceMappingURL=index.d.ts.map