"use strict";
// Baseado em: 2.Architecture.md v1.0.3, 4.Entities.md v1.7
// Plugin Consulta Infosimples
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfosimplesPlugin = void 0;
const config_1 = require("./config");
class InfosimplesPlugin {
    id = 'consulta-infosimples';
    type = 'consulta';
    name = 'Infosimples';
    version = '1.0.0';
    config;
    constructor(config) {
        this.config = { ...config_1.defaultConfig, ...config };
    }
    async install() {
        // Validações de instalação
        if (!this.config.apiKey) {
            throw new Error('API key não configurada');
        }
        // Poderia validar conectividade, etc.
    }
    async enable(tenantId) {
        // Ativar para tenant específico
        console.log(`Plugin Infosimples habilitado para tenant ${tenantId}`);
    }
    async disable(tenantId) {
        // Desativar para tenant
        console.log(`Plugin Infosimples desabilitado para tenant ${tenantId}`);
    }
    async execute(context) {
        const { tenantId, userId, input: contextInput } = context;
        const { type, input } = contextInput;
        try {
            // Mapear tipo para código Infosimples
            const code = this.getConsultaCode(type, input);
            if (!code) {
                throw new Error(`Tipo de consulta não suportado: ${type}`);
            }
            // Chamar API Infosimples
            const response = await this.callInfosimplesAPI(code, input);
            // Normalizar resposta
            const normalized = this.normalizeResponse(type, input, response);
            return {
                success: true,
                data: normalized,
                cost: this.calculateCost(type),
            };
        }
        catch (error) {
            // Tentar fallback se configurado
            if (this.config.fallbackSources.length > 0) {
                return this.executeFallback(context, error);
            }
            const err = error instanceof Error ? error : new Error(String(error));
            return {
                success: false,
                error: err.message,
                cost: 0,
            };
        }
    }
    getConsultaCode(type, input) {
        // Mapeamento direto para endpoints da API Infosimples
        const endpointMap = {
            // Crédito
            'cenprot_protestos_sp': config_1.consultaCodes.cenprot_protestos_sp,
            'serasa_score': config_1.consultaCodes.serasa_score,
            'boavista_credito': config_1.consultaCodes.boavista_credito,
            'scpc_negativacao': config_1.consultaCodes.scpc_negativacao,
            // Cadastral
            'receita_federal_cpf': config_1.consultaCodes.receita_federal_cpf,
            'receita_federal_cnpj': config_1.consultaCodes.receita_federal_cnpj,
            'portal_transparencia_ceis': config_1.consultaCodes.portal_transparencia_ceis,
            'portal_transparencia_cepim': config_1.consultaCodes.portal_transparencia_cepim,
            'portal_transparencia_cnep': config_1.consultaCodes.portal_transparencia_cnep,
            'tse_situacao_eleitoral': config_1.consultaCodes.tse_situacao_eleitoral,
            'cnis_pre_inscricao': config_1.consultaCodes.cnis_pre_inscricao,
            'dataprev_qualificacao': config_1.consultaCodes.dataprev_qualificacao,
            // Veicular
            'serpro_radar_veiculo': config_1.consultaCodes.serpro_radar_veiculo,
            'detran_rj_veiculo': config_1.consultaCodes.detran_rj_veiculo,
            'detran_rs_veiculo': config_1.consultaCodes.detran_rs_veiculo,
            'detran_sp_veiculo': config_1.consultaCodes.detran_sp_veiculo,
            'detran_mg_veiculo': config_1.consultaCodes.detran_mg_veiculo,
            // Previdenciário
            'dataprev_fap': config_1.consultaCodes.dataprev_fap,
            // Endereço
            'correios_cep': config_1.consultaCodes.correios_cep,
        };
        const endpoint = endpointMap[type];
        if (!endpoint) {
            // Fallback para códigos legados se não encontrado
            return this.getLegacyCode(type, input);
        }
        return endpoint;
    }
    getLegacyCode(type, input) {
        const codes = config_1.legacyCodes[type];
        if (!codes)
            return null;
        // Verificar qual propriedade usar baseado no tipo
        switch (type) {
            case 'credito':
            case 'cadastral':
                if (input.cpf)
                    return codes.cpf;
                if (input.cnpj)
                    return codes.cnpj;
                break;
            case 'veicular':
                if (input.placa)
                    return codes.placa;
                break;
        }
        return null;
    }
    async callInfosimplesAPI(endpoint, data) {
        const url = `${this.config.baseUrl}${endpoint}`;
        // Preparar parâmetros de query baseados no endpoint
        const queryParams = new URLSearchParams();
        // Mapeamento de campos baseado no endpoint
        if (endpoint.includes('cenprot-sp/protestos')) {
            if (data.cpf)
                queryParams.append('cpf', data.cpf);
            if (data.cnpj)
                queryParams.append('cnpj', data.cnpj);
        }
        else if (endpoint.includes('receita-federal/cpf')) {
            queryParams.append('cpf', data.cpf);
            queryParams.append('birthdate', data.birthdate);
        }
        else if (endpoint.includes('receita-federal/cnpj')) {
            queryParams.append('cnpj', data.cnpj);
        }
        else if (endpoint.includes('portal-transparencia')) {
            if (data.cpf)
                queryParams.append('cpf', data.cpf);
            if (data.cnpj)
                queryParams.append('cnpj', data.cnpj);
        }
        else if (endpoint.includes('tse/situacao-eleitoral')) {
            queryParams.append('name', data.name);
            queryParams.append('cpf', data.cpf);
            queryParams.append('titulo_eleitoral', data.titulo_eleitoral);
            queryParams.append('birthdate', data.birthdate);
        }
        else if (endpoint.includes('serpro/radar-veiculo')) {
            queryParams.append('placa', data.placa);
        }
        else if (endpoint.includes('correios/cep')) {
            queryParams.append('cep', data.cep);
        }
        else if (endpoint.includes('cnis/pre-inscricao')) {
            queryParams.append('cpf', data.cpf);
            queryParams.append('nis', data.nis);
            queryParams.append('name', data.name);
            queryParams.append('birthdate', data.birthdate);
        }
        else if (endpoint.includes('dataprev/fap')) {
            queryParams.append('cnpj_estabelecimento', data.cnpj_estabelecimento);
            if (data.ano_vigencia)
                queryParams.append('ano_vigencia', data.ano_vigencia);
        }
        else if (endpoint.includes('dataprev/qualificacao')) {
            queryParams.append('nis', data.nis);
            queryParams.append('name', data.name);
            queryParams.append('birthdate', data.birthdate);
            queryParams.append('cpf', data.cpf);
        }
        else if (endpoint.includes('detran/rj/veiculo')) {
            queryParams.append('placa', data.placa);
        }
        else if (endpoint.includes('detran/rs/veiculo')) {
            queryParams.append('placa', data.placa);
            queryParams.append('renavam', data.renavam);
        }
        const finalUrl = `${url}?${queryParams.toString()}`;
        const response = await fetch(finalUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
            },
            signal: AbortSignal.timeout(this.config.timeout),
        });
        if (!response.ok) {
            throw new Error(`Erro na API Infosimples: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
    normalizeResponse(type, input, response) {
        if (!response.success) {
            return {
                type: type,
                input,
                output: {
                    status: 'failed',
                    normalized: false,
                    source: 'infosimples',
                    error: response.error,
                },
            };
        }
        // Normalizar dados baseado no tipo
        const normalizedData = this.normalizeData(type, response.data);
        return {
            type: type,
            input,
            output: {
                status: 'success',
                data: normalizedData,
                normalized: true,
                source: 'infosimples',
            },
        };
    }
    normalizeData(type, data) {
        // Lógica de normalização para schema consistente
        if (!data)
            return {};
        switch (type) {
            case 'credito':
                return {
                    score: data.score || null,
                    restricoes: data.restricoes || [],
                    protestos: data.protestos || [],
                    processos: data.processos || [],
                };
            case 'cadastral':
                return {
                    nome: data.nome || null,
                    endereco: data.endereco || null,
                    telefones: data.telefones || [],
                    situacao: data.situacao || null,
                };
            case 'veicular':
                return {
                    proprietario: data.proprietario || null,
                    modelo: data.modelo || null,
                    ano: data.ano || null,
                    restricoes: data.restricoes || [],
                    multas: data.multas || [],
                };
            default:
                return data; // Retornar como está se não reconhecido
        }
    }
    calculateCost(type) {
        // Custos baseados em 9.paginas.md
        const costs = {
            credito: 1.80,
            cadastral: 1.00,
            veicular: 3.00,
        };
        return costs[type] || 0;
    }
    async executeFallback(context, originalError) {
        // Implementar fallback para outras fontes
        // Por simplicidade, retornar erro por enquanto
        const error = originalError instanceof Error ? originalError : new Error(String(originalError));
        return {
            success: false,
            error: `Erro na fonte principal: ${error.message}. Fallback não implementado.`,
            cost: 0,
        };
    }
}
exports.InfosimplesPlugin = InfosimplesPlugin;
exports.default = InfosimplesPlugin;
//# sourceMappingURL=index.js.map