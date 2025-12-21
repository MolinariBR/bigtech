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
    type: 'credito' | 'cadastral' | 'veicular' | 'previdenciario' | 'endereco' | 'eleitoral' | 'compliance';
    input: ConsultaInputType;
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
    birthdate?: string;
    name?: string;
    titulo_eleitoral?: string;
    nis?: string;
    placa?: string;
    renavam?: string;
    chassi?: string;
    ano?: string;
    cnpj_estabelecimento?: string;
    ano_vigencia?: string;
    cep?: string;
    a3?: string;
    a3_pin?: string;
    login_cpf?: string;
    login_senha?: string;
};
//# sourceMappingURL=types2.d.ts.map