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
        const codes = config_1.consultaCodes[type];
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
    async callInfosimplesAPI(code, data) {
        const url = `${this.config.baseUrl}/consultas/${code}`;
        const body = { code, data };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify(body),
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