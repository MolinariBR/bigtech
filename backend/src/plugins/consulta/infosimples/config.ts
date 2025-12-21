// Baseado em: 4.Entities.md v1.7
// Configurações para plugin Infosimples

import { InfosimplesConfig } from './types2';

export const defaultConfig: InfosimplesConfig = {
  apiKey: process.env.INFOSIMPLES_API_KEY || '',
  baseUrl: 'https://api.infosimples.com/v1',
  timeout: 30000, // 30 segundos
  fallbackSources: ['brasilapi'], // Fontes de fallback se Infosimples falhar
};

// Mapeamento de tipos de consulta para códigos Infosimples
export const consultaCodes = {
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