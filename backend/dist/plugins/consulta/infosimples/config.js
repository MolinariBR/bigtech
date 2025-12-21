"use strict";
// Baseado em: 4.Entities.md v1.7
// Configurações para plugin Infosimples
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultaCodes = exports.defaultConfig = void 0;
exports.defaultConfig = {
    apiKey: process.env.INFOSIMPLES_API_KEY || '',
    baseUrl: 'https://api.infosimples.com/v1',
    timeout: 30000, // 30 segundos
    fallbackSources: ['brasilapi'], // Fontes de fallback se Infosimples falhar
};
// Mapeamento de tipos de consulta para códigos Infosimples
exports.consultaCodes = {
    credito: {
        cpf: '39-TeleConfirma', // POSITIVO ACERTA ESSENCIAL PF
        cnpj: 'POSITIVO DEFINE RISCO CNPJ',
    },
    cadastral: {
        cpf: 'QUOD CADASTRAL PF',
        cnpj: 'RELATÓRIO JURIDICO PJ',
    },
    veicular: {
        placa: '87-Bin Nacional Completa',
    },
};
//# sourceMappingURL=config.js.map