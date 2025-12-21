export interface InfosimplesConfig {
    apiKey: string;
    baseUrl: string;
    timeout: number;
    fallbackSources: string[];
}
export interface InfosimplesRequest {
    code: string;
    data: Record<string, any>;
}
export interface InfosimplesResponse {
    success: boolean;
    data?: any;
    error?: string;
}
export interface NormalizedConsulta {
    type: 'credito' | 'cadastral' | 'veicular';
    input: {
        cpf?: string;
        cnpj?: string;
        placa?: string;
    };
    output: {
        status: 'success' | 'failed';
        data?: any;
        normalized: boolean;
        source: 'infosimples';
        error?: string;
    };
}
export type ConsultaInputType = {
    cpf?: string;
    cnpj?: string;
    placa?: string;
};
//# sourceMappingURL=types2.d.ts.map