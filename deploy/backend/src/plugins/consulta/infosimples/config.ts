// Baseado em: 4.Entities.md v1.7, Docs/APIServicosSelecionados.md
// Configurações para plugin Infosimples

import { InfosimplesConfig } from './types2';

export const defaultConfig: InfosimplesConfig = {
  apiKey: process.env.INFOSIMPLES_API_KEY || '',
  baseUrl: 'https://api.infosimples.com/api/v2',
  timeout: 30000, // 30 segundos
  retries: 3, // Aumentar retries para lidar com rate limiting
  retryDelayMs: 5000, // Aumentar delay base entre retries
  fallbackSources: ['brasilapi'], // Fontes de fallback se Infosimples falhar
};

// Mapeamento de tipos de consulta para endpoints Infosimples
// Baseado na especificação OpenAPI v2.2.33
export const consultaCodes = {
  // Crédito e Protestos
  cenprot_protestos_sp: '/consultas/cenprot-sp/protestos',
  serasa_score: null, // Não identificado na API pública
  boavista_credito: null, // Não identificado na API pública
  scpc_negativacao: null, // Não identificado na API pública

  // Cadastral
  receita_federal_cpf: '/consultas/receita-federal/cpf',
  receita_federal_cnpj: '/consultas/receita-federal/cnpj',
  portal_transparencia_ceis: '/consultas/portal-transparencia/ceis',
  portal_transparencia_cepim: '/consultas/portal-transparencia/cepim',
  portal_transparencia_cnep: '/consultas/portal-transparencia/cnep',
  tse_situacao_eleitoral: '/consultas/tse/situacao-eleitoral',
  cnis_pre_inscricao: '/consultas/cnis/pre-inscricao',
  dataprev_qualificacao: '/consultas/dataprev/qualificacao',

  // Veicular
  serpro_radar_veiculo: '/consultas/serpro/radar-veiculo',
  detran_rj_veiculo: '/consultas/detran/rj/veiculo',
  detran_rs_veiculo: '/consultas/detran/rs/veiculo',
  detran_sp_veiculo: '/consultas/ecrvsp/veiculos/base-sp', // Via ECRVSP
  detran_mg_veic_nao_licenciado: '/consultas/detran/mg/veic-nao-licenciado',
  detran_mg_multas_extrato: '/consultas/detran/mg/multas-extrato',
  detran_mg_trlav: '/consultas/detran/mg/trlav',

  // Previdenciário
  dataprev_fap: '/consultas/dataprev/fap',

  // Endereço
  correios_cep: '/consultas/correios/cep',
};

// Mapeamento legado (para compatibilidade)
export const legacyCodes = {
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