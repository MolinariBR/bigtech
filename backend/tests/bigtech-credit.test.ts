// Baseado em: 8.Tests.md v1.0, 7.Tasks.md v1.0
// Estratégia: Testes de propriedade com fast-check para validação de payloads e respostas
// Cobertura: TASK-BIGTECH-005 - Serviços de Crédito (36, 39, 41, 304, 370)

import { BigTechPlugin } from '../src/plugins/consulta/bigtech/index';
import { BigTechConfig } from '../src/plugins/consulta/bigtech/types';
import fc from 'fast-check';

// Configuração de teste
const testConfig: BigTechConfig = {
  baseUrl: 'https://api.consultasbigtech.com.br/json/service.aspx',
  apiKey: 'test-key',
  timeout: 5000,
  retries: 2,
  retryDelayMs: 1000,
  minRequestInterval: 100,
  rateLimitPerMinute: 60,
  fallbackSources: []
};

describe('BigTech Plugin - Serviços de Crédito', () => {
  let plugin: BigTechPlugin;

  beforeEach(() => {
    plugin = new BigTechPlugin(testConfig);
  });

  describe('36-Busca por Nome+UF', () => {
    it('deve preparar payload corretamente com parâmetros válidos', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'GO', 'MS', 'MT', 'BA', 'CE', 'PE', 'RN', 'PB', 'AL', 'SE', 'PI', 'MA', 'TO', 'AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'DF'),
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (nomeCompleto, uf, solicitante, webhookUrl) => {
            const input = {
              nomeCompleto,
              uf,
              solicitante,
              webhookUrl
            };

            const payload = (plugin as any).prepareBuscaNomeUfPayload(input);

            expect(payload.CodigoProduto).toBe("1449");
            expect(payload.Versao).toBe("20180521");
            expect(payload.ChaveAcesso).toBe(testConfig.apiKey);
            expect(payload.Parametros.UF).toBe(uf.toUpperCase());
            expect(payload.Parametros.NomeCompleto).toBe(nomeCompleto);
            expect(payload.Info.Solicitante).toBe(solicitante);
            expect(payload.WebHook.UrlCallBack).toBe(webhookUrl);
          }
        )
      );
    });

    it('deve rejeitar UF inválida', () => {
      const input = {
        nomeCompleto: 'João Silva',
        uf: 'INVALID'
      };

      expect(() => (plugin as any).prepareBuscaNomeUfPayload(input))
        .toThrow('UF deve ter exatamente 2 letras maiúsculas');
    });

    it('deve rejeitar nome vazio', () => {
      const input = {
        nomeCompleto: '',
        uf: 'SP'
      };

      expect(() => (plugin as any).prepareBuscaNomeUfPayload(input))
        .toThrow('NomeCompleto é obrigatório');
    });

    it('deve normalizar resposta corretamente', () => {
      const mockResponse = {
        HEADER: {
          INFORMACOES_RETORNO: {
            STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "CONSULTA CONCLUIDA COM SUCESSO" },
            CHAVE_CONSULTA: "12345",
            DATA_HORA_CONSULTA: "01/01/2024 10:00"
          },
          PARAMETROS: {
            UF: "SP",
            NomeCompleto: "João Silva"
          }
        },
        CREDCADASTRAL: {
          // Dados específicos do serviço
        }
      };

      const normalized = (plugin as any).normalizeBuscaNomeUfResponse(mockResponse);

      expect(normalized.success).toBe(true);
      expect(normalized.service).toBe('36-busca-nome-uf');
      expect(normalized.parametros.uf).toBe("SP");
      expect(normalized.parametros.nomeCompleto).toBe("João Silva");
      expect(normalized.dados.credCadastral).toEqual({});
    });
  });

  describe('39-TeleConfirma', () => {
    it('deve preparar payload corretamente com parâmetros válidos', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 99 }), // DDD válido
          fc.integer({ min: 10000000, max: 999999999 }), // Telefone 8-9 dígitos
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (ddd, telefone, solicitante, webhookUrl) => {
            const input = {
              ddd: ddd.toString(),
              telefone: telefone.toString(),
              solicitante,
              webhookUrl
            };

            const payload = (plugin as any).prepareTeleConfirmaPayload(input);

            expect(payload.CodigoProduto).toBe("1450");
            expect(payload.Versao).toBe("20180521");
            expect(payload.ChaveAcesso).toBe(testConfig.apiKey);
            expect(payload.Parametros.DDD).toBe(ddd.toString());
            expect(payload.Parametros.Telefone).toBe(telefone.toString());
            expect(payload.Info.Solicitante).toBe(solicitante);
            expect(payload.WebHook.UrlCallBack).toBe(webhookUrl);
          }
        )
      );
    });

    it('deve rejeitar DDD inválido', () => {
      const input = {
        ddd: '123', // 3 dígitos
        telefone: '999999999'
      };

      expect(() => (plugin as any).prepareTeleConfirmaPayload(input))
        .toThrow('DDD deve ter exatamente 2 dígitos');
    });

    it('deve rejeitar telefone inválido', () => {
      const input = {
        ddd: '11',
        telefone: '1234567' // 7 dígitos
      };

      expect(() => (plugin as any).prepareTeleConfirmaPayload(input))
        .toThrow('Telefone deve ter 8 ou 9 dígitos');
    });

    it('deve normalizar resposta corretamente', () => {
      const mockResponse = {
        HEADER: {
          INFORMACOES_RETORNO: {
            STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "CONSULTA CONCLUIDA COM SUCESSO" },
            CHAVE_CONSULTA: "12345",
            DATA_HORA_CONSULTA: "01/01/2024 10:00"
          },
          PARAMETROS: {
            DDD: "11",
            TELEFONE: "999999999"
          },
          DADOS_RETORNADOS: {
            TITULAR_DO_TELEFONE: "1"
          }
        },
        CREDCADASTRAL: {
          TITULAR_DO_TELEFONE: {
            TELEFONES: [
              {
                NOME: "João Silva",
                DOCUMENTO: "12345678901",
                ENDERECO: "Rua A, 123"
              }
            ]
          }
        }
      };

      const normalized = (plugin as any).normalizeTeleConfirmaResponse(mockResponse);

      expect(normalized.success).toBe(true);
      expect(normalized.service).toBe('39-teleconfirma');
      expect(normalized.parametros.ddd).toBe("11");
      expect(normalized.parametros.telefone).toBe("999999999");
      expect(normalized.dados.titularTelefone).toBe(true);
      expect(normalized.dados.telefones).toHaveLength(1);
    });
  });

  describe('41-PROTESTO SINTÉTICO NACIONAL', () => {
    it('deve preparar payload corretamente para pessoa física', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{11}$/), // CPF válido (11 dígitos)
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (cpf, solicitante, webhookUrl) => {
            const input = {
              cpfCnpj: cpf,
              tipoPessoa: 'F',
              solicitante,
              webhookUrl
            };

            const payload = (plugin as any).prepareProtestoSinteticoPayload(input);

            expect(payload.CodigoProduto).toBe("1451");
            expect(payload.Versao).toBe("20180521");
            expect(payload.ChaveAcesso).toBe(testConfig.apiKey);
            expect(payload.Parametros.TipoPessoa).toBe('F');
            expect(payload.Parametros.CPFCNPJ).toBe(cpf);
            expect(payload.Info.Solicitante).toBe(solicitante);
            expect(payload.WebHook.UrlCallBack).toBe(webhookUrl);
          }
        )
      );
    });

    it('deve preparar payload corretamente para pessoa jurídica', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{14}$/), // CNPJ válido (14 dígitos)
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (cnpj, solicitante, webhookUrl) => {
            const input = {
              cpfCnpj: cnpj,
              tipoPessoa: 'J',
              solicitante,
              webhookUrl
            };

            const payload = (plugin as any).prepareProtestoSinteticoPayload(input);

            expect(payload.CodigoProduto).toBe("1451");
            expect(payload.Versao).toBe("20180521");
            expect(payload.ChaveAcesso).toBe(testConfig.apiKey);
            expect(payload.Parametros.TipoPessoa).toBe('J');
            expect(payload.Parametros.CPFCNPJ).toBe(cnpj);
            expect(payload.Info.Solicitante).toBe(solicitante);
            expect(payload.WebHook.UrlCallBack).toBe(webhookUrl);
          }
        )
      );
    });

    it('deve rejeitar tipo pessoa inválido', () => {
      const input = {
        cpfCnpj: '12345678901234',
        tipoPessoa: 'X'
      };

      expect(() => (plugin as any).prepareProtestoSinteticoPayload(input))
        .toThrow('TipoPessoa deve ser "F" (física) ou "J" (jurídica)');
    });

    it('deve rejeitar CPF com tamanho incorreto', () => {
      const input = {
        cpfCnpj: '1234567890', // 10 dígitos
        tipoPessoa: 'F'
      };

      expect(() => (plugin as any).prepareProtestoSinteticoPayload(input))
        .toThrow('CPF/CNPJ deve ter 11 dígitos para pessoa física');
    });

    it('deve normalizar resposta corretamente', () => {
      const mockResponse = {
        HEADER: {
          INFORMACOES_RETORNO: {
            STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "CONSULTA CONCLUIDA COM SUCESSO" },
            CHAVE_CONSULTA: "12345",
            DATA_HORA_CONSULTA: "01/01/2024 10:00"
          },
          PARAMETROS: {
            TIPO_PESSOA: "14",
            CPFCNPJ: "12345678901234"
          },
          DADOS_RETORNADOS: {
            PROTESTO_SINTETICO: "1"
          }
        },
        CREDCADASTRAL: {
          PROTESTO_SINTETICO: {
            VALOR_TOTAL: "1500,00",
            ULTIMO_PROTESTO: "15/10/2021",
            QUANTIDADE_OCORRENCIA: "2",
            OCORRENCIAS: [
              {
                UF: "SP",
                VALOR: "1000,00",
                CREDOR: "Banco X"
              }
            ]
          }
        }
      };

      const normalized = (plugin as any).normalizeProtestoSinteticoResponse(mockResponse);

      expect(normalized.success).toBe(true);
      expect(normalized.service).toBe('41-protesto-sintetico-nacional');
      expect(normalized.parametros.tipoPessoa).toBe("14");
      expect(normalized.parametros.cpfCnpj).toBe("12345678901234");
      expect(normalized.dados.protestoSintetico).toBe(true);
      expect(normalized.dados.protesto).toHaveProperty('VALOR_TOTAL');
    });
  });

  describe('304-POSITIVO DEFINE RISCO CNPJ', () => {
    it('deve preparar payload corretamente com CNPJ válido', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{14}$/), // CNPJ válido (14 dígitos)
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (cnpj, solicitante, webhookUrl) => {
            const input = {
              cpfCnpj: cnpj,
              solicitante,
              webhookUrl
            };

            const payload = (plugin as any).preparePositivoDefineRiscoCnpjPayload(input);

            expect(payload.CodigoProduto).toBe("1464");
            expect(payload.Versao).toBe("20180521");
            expect(payload.ChaveAcesso).toBe(testConfig.apiKey);
            expect(payload.Parametros.TipoPessoa).toBe('J');
            expect(payload.Parametros.CPFCNPJ).toBe(cnpj);
            expect(payload.Info.Solicitante).toBe(solicitante);
            expect(payload.WebHook.UrlCallBack).toBe(webhookUrl);
          }
        )
      );
    });

    it('deve rejeitar CNPJ com tamanho incorreto', () => {
      const input = {
        cpfCnpj: '1234567890123' // 13 dígitos
      };

      expect(() => (plugin as any).preparePositivoDefineRiscoCnpjPayload(input))
        .toThrow('CNPJ deve ter exatamente 14 dígitos');
    });

    it('deve normalizar resposta corretamente', () => {
      const mockResponse = {
        HEADER: {
          INFORMACOES_RETORNO: {
            STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "CONSULTA CONCLUIDA COM SUCESSO" },
            CHAVE_CONSULTA: "12345",
            DATA_HORA_CONSULTA: "01/01/2024 10:00"
          },
          PARAMETROS: {
            TIPO_PESSOA: "14",
            CPFCNPJ: "12345678901234"
          }
        }
      };

      const normalized = (plugin as any).normalizePositivoDefineRiscoCnpjResponse(mockResponse);

      expect(normalized.success).toBe(true);
      expect(normalized.service).toBe('304-positivo-define-risco-cnpj');
      expect(normalized.parametros.tipoPessoa).toBe("14");
      expect(normalized.parametros.cpfCnpj).toBe("12345678901234");
      expect(normalized.dados.analiseRisco).toBe(true);
    });
  });

  describe('370-POSITIVO ACERTA ESSENCIAL PF', () => {
    it('deve preparar payload corretamente com CPF válido', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{11}$/), // CPF válido (11 dígitos)
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (cpf, solicitante, webhookUrl) => {
            const input = {
              cpfCnpj: cpf,
              solicitante,
              webhookUrl
            };

            const payload = (plugin as any).preparePositivoAcertaEssencialPfPayload(input);

            expect(payload.CodigoProduto).toBe("1471");
            expect(payload.Versao).toBe("20180521");
            expect(payload.ChaveAcesso).toBe(testConfig.apiKey);
            expect(payload.Parametros.TipoPessoa).toBe('F');
            expect(payload.Parametros.CPFCNPJ).toBe(cpf);
            expect(payload.Info.Solicitante).toBe(solicitante);
            expect(payload.WebHook.UrlCallBack).toBe(webhookUrl);
          }
        )
      );
    });

    it('deve rejeitar CPF com tamanho incorreto', () => {
      const input = {
        cpfCnpj: '1234567890' // 10 dígitos
      };

      expect(() => (plugin as any).preparePositivoAcertaEssencialPfPayload(input))
        .toThrow('CPF deve ter exatamente 11 dígitos');
    });

    it('deve normalizar resposta corretamente', () => {
      const mockResponse = {
        HEADER: {
          INFORMACOES_RETORNO: {
            STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "CONSULTA CONCLUIDA COM SUCESSO" },
            CHAVE_CONSULTA: "12345",
            DATA_HORA_CONSULTA: "01/01/2024 10:00"
          },
          PARAMETROS: {
            TIPO_PESSOA: "11",
            CPFCNPJ: "12345678901"
          }
        }
      };

      const normalized = (plugin as any).normalizePositivoAcertaEssencialPfResponse(mockResponse);

      expect(normalized.success).toBe(true);
      expect(normalized.service).toBe('370-positivo-acerta-essencial-pf');
      expect(normalized.parametros.tipoPessoa).toBe("11");
      expect(normalized.parametros.cpfCnpj).toBe("12345678901");
      expect(normalized.dados.analiseRisco).toBe(true);
    });
  });
});