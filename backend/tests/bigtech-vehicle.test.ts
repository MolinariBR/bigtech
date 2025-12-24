// Baseado em: 8.Tests.md v1.0, 7.Tasks.md v1.0
// Estratégia: Testes de propriedade com fast-check para validação de payloads e respostas
// Cobertura: TASK-BIGTECH-006 - Serviços Veiculares (411, 412, 415, 416)

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

describe('BigTech Plugin - Serviços Veiculares', () => {
  let plugin: BigTechPlugin;

  beforeEach(() => {
    plugin = new BigTechPlugin(testConfig);
  });

  describe('411-CRLV RO', () => {
    it('deve preparar payload corretamente com placa válida', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[A-Z]{3}[0-9]{4}$/),
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (placa, solicitante, webhookUrl) => {
            const input = {
              placa,
              solicitante,
              webhookUrl
            };

            const payload = (plugin as any).prepareCrlvRoPayload(input);

            expect(payload.CodigoProduto).toBe("1527");
            expect(payload.Versao).toBe("20180521");
            expect(payload.ChaveAcesso).toBe(testConfig.apiKey);
            expect(payload.Parametros.Placa).toBe(placa.toUpperCase().replace(/[^A-Z0-9]/gi, ''));
            expect(payload.Info.Solicitante).toBe(solicitante);
            expect(payload.WebHook.UrlCallBack).toBe(webhookUrl);
          }
        )
      );
    });

    it('deve rejeitar placa inválida', () => {
      const invalidPlacas = ['ABC123', 'AB12345', '123ABCD', 'ABCD123'];

      invalidPlacas.forEach(placa => {
        expect(() => {
          (plugin as any).prepareCrlvRoPayload({ placa });
        }).toThrow('Placa deve ter formato AAA9999');
      });
    });

    it('deve rejeitar quando placa não fornecida', () => {
      expect(() => {
        (plugin as any).prepareCrlvRoPayload({});
      }).toThrow('Placa é obrigatória para o serviço 411-CRLV RO');
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
            PLACA: "ABC1234"
          },
          DADOS_RETORNADOS: {
            CRLV: "1",
            PROPRIETARIO_ATUAL_VEICULO: "1",
            HISTORICO_PROPRIETARIOS: "1",
            GRAVAME: "1",
            ROUBO_FURTO: "1",
            PERDA_TOTAL: "1",
            ALERTAS: "1",
            RECALL: "1",
            DPVAT: "1",
            DEBITOS_IPVA: "1",
            RESTRICOES_FINANCEIRAS: "1"
          }
        },
        VEICULAR: {
          proprietario: "João Silva",
          modelo: "Gol 1.0",
          ano: "2020"
        }
      };

      const normalized = (plugin as any).normalizeCrlvRoResponse(mockResponse);

      expect(normalized.success).toBe(true);
      expect(normalized.service).toBe('411-crlv-ro');
      expect(normalized.chaveConsulta).toBe("12345");
      expect(normalized.parametros.placa).toBe("ABC1234");
      expect(normalized.dados.crlv).toBe(true);
      expect(normalized.dados.proprietarioAtual).toBe(true);
      expect(normalized.dados.veicular).toEqual(mockResponse.VEICULAR);
    });
  });

  describe('412-CRLV RR', () => {
    it('deve preparar payload corretamente com placa válida', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[A-Z]{3}[0-9]{4}$/),
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (placa, solicitante, webhookUrl) => {
            const input = {
              placa,
              solicitante,
              webhookUrl
            };

            const payload = (plugin as any).prepareCrlvRrPayload(input);

            expect(payload.CodigoProduto).toBe("1528");
            expect(payload.Versao).toBe("20180521");
            expect(payload.ChaveAcesso).toBe(testConfig.apiKey);
            expect(payload.Parametros.Placa).toBe(placa.toUpperCase().replace(/[^A-Z0-9]/gi, ''));
            expect(payload.Info.Solicitante).toBe(solicitante);
            expect(payload.WebHook.UrlCallBack).toBe(webhookUrl);
          }
        )
      );
    });

    it('deve rejeitar placa inválida', () => {
      const invalidPlacas = ['ABC123', 'AB12345', '123ABCD', 'ABCD123'];

      invalidPlacas.forEach(placa => {
        expect(() => {
          (plugin as any).prepareCrlvRrPayload({ placa });
        }).toThrow('Placa deve ter formato AAA9999');
      });
    });

    it('deve normalizar resposta corretamente', () => {
      const mockResponse = {
        HEADER: {
          INFORMACOES_RETORNO: {
            STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "CONSULTA CONCLUIDA COM SUCESSO" },
            CHAVE_CONSULTA: "12346",
            DATA_HORA_CONSULTA: "01/01/2024 10:00"
          },
          PARAMETROS: {
            PLACA: "DEF5678"
          },
          DADOS_RETORNADOS: {
            CRLV: "1",
            PROPRIETARIO_ATUAL_VEICULO: "1",
            HISTORICO_PROPRIETARIOS: "0",
            GRAVAME: "1",
            ROUBO_FURTO: "0",
            PERDA_TOTAL: "0",
            ALERTAS: "1",
            RECALL: "0",
            DPVAT: "1",
            DEBITOS_IPVA: "0",
            RESTRICOES_FINANCEIRAS: "1"
          }
        },
        VEICULAR: {
          proprietario: "Maria Santos",
          modelo: "Uno 1.0",
          ano: "2019"
        }
      };

      const normalized = (plugin as any).normalizeCrlvRrResponse(mockResponse);

      expect(normalized.success).toBe(true);
      expect(normalized.service).toBe('412-crlv-rr');
      expect(normalized.chaveConsulta).toBe("12346");
      expect(normalized.dados.crlv).toBe(true);
      expect(normalized.dados.historicoProprietarios).toBe(false);
      expect(normalized.dados.veicular).toEqual(mockResponse.VEICULAR);
    });
  });

  describe('415-CRLV SE', () => {
    it('deve preparar payload corretamente com placa válida', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[A-Z]{3}[0-9]{4}$/),
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (placa, solicitante, webhookUrl) => {
            const input = {
              placa,
              solicitante,
              webhookUrl
            };

            const payload = (plugin as any).prepareCrlvSePayload(input);

            expect(payload.CodigoProduto).toBe("1531");
            expect(payload.Versao).toBe("20180521");
            expect(payload.ChaveAcesso).toBe(testConfig.apiKey);
            expect(payload.Parametros.Placa).toBe(placa.toUpperCase().replace(/[^A-Z0-9]/gi, ''));
            expect(payload.Info.Solicitante).toBe(solicitante);
            expect(payload.WebHook.UrlCallBack).toBe(webhookUrl);
          }
        )
      );
    });

    it('deve rejeitar placa inválida', () => {
      const invalidPlacas = ['ABC123', 'AB12345', '123ABCD', 'ABCD123'];

      invalidPlacas.forEach(placa => {
        expect(() => {
          (plugin as any).prepareCrlvSePayload({ placa });
        }).toThrow('Placa deve ter formato AAA9999');
      });
    });

    it('deve normalizar resposta corretamente', () => {
      const mockResponse = {
        HEADER: {
          INFORMACOES_RETORNO: {
            STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "CONSULTA CONCLUIDA COM SUCESSO" },
            CHAVE_CONSULTA: "12347",
            DATA_HORA_CONSULTA: "01/01/2024 10:00"
          },
          PARAMETROS: {
            PLACA: "GHI9012"
          },
          DADOS_RETORNADOS: {
            CRLV: "1",
            PROPRIETARIO_ATUAL_VEICULO: "1",
            HISTORICO_PROPRIETARIOS: "1",
            GRAVAME: "0",
            ROUBO_FURTO: "1",
            PERDA_TOTAL: "0",
            ALERTAS: "0",
            RECALL: "1",
            DPVAT: "1",
            DEBITOS_IPVA: "1",
            RESTRICOES_FINANCEIRAS: "0"
          }
        },
        VEICULAR: {
          proprietario: "Pedro Oliveira",
          modelo: "Palio 1.0",
          ano: "2018"
        }
      };

      const normalized = (plugin as any).normalizeCrlvSeResponse(mockResponse);

      expect(normalized.success).toBe(true);
      expect(normalized.service).toBe('415-crlv-se');
      expect(normalized.chaveConsulta).toBe("12347");
      expect(normalized.dados.gravame).toBe(false);
      expect(normalized.dados.alertas).toBe(false);
      expect(normalized.dados.veicular).toEqual(mockResponse.VEICULAR);
    });
  });

  describe('416-CRLV SP', () => {
    it('deve preparar payload corretamente com placa válida', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[A-Z]{3}[0-9]{4}$/),
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (placa, solicitante, webhookUrl) => {
            const input = {
              placa,
              solicitante,
              webhookUrl
            };

            const payload = (plugin as any).prepareCrlvSpPayload(input);

            expect(payload.CodigoProduto).toBe("1532");
            expect(payload.Versao).toBe("20180521");
            expect(payload.ChaveAcesso).toBe(testConfig.apiKey);
            expect(payload.Parametros.Placa).toBe(placa.toUpperCase().replace(/[^A-Z0-9]/gi, ''));
            expect(payload.Info.Solicitante).toBe(solicitante);
            expect(payload.WebHook.UrlCallBack).toBe(webhookUrl);
          }
        )
      );
    });

    it('deve rejeitar placa inválida', () => {
      const invalidPlacas = ['ABC123', 'AB12345', '123ABCD', 'ABCD123'];

      invalidPlacas.forEach(placa => {
        expect(() => {
          (plugin as any).prepareCrlvSpPayload({ placa });
        }).toThrow('Placa deve ter formato AAA9999');
      });
    });

    it('deve normalizar resposta corretamente', () => {
      const mockResponse = {
        HEADER: {
          INFORMACOES_RETORNO: {
            STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "CONSULTA CONCLUIDA COM SUCESSO" },
            CHAVE_CONSULTA: "12348",
            DATA_HORA_CONSULTA: "01/01/2024 10:00"
          },
          PARAMETROS: {
            PLACA: "JKL3456"
          },
          DADOS_RETORNADOS: {
            CRLV: "1",
            PROPRIETARIO_ATUAL_VEICULO: "1",
            HISTORICO_PROPRIETARIOS: "1",
            GRAVAME: "1",
            ROUBO_FURTO: "0",
            PERDA_TOTAL: "1",
            ALERTAS: "1",
            RECALL: "1",
            DPVAT: "0",
            DEBITOS_IPVA: "1",
            RESTRICOES_FINANCEIRAS: "1"
          }
        },
        VEICULAR: {
          proprietario: "Ana Costa",
          modelo: "Civic 2.0",
          ano: "2021"
        }
      };

      const normalized = (plugin as any).normalizeCrlvSpResponse(mockResponse);

      expect(normalized.success).toBe(true);
      expect(normalized.service).toBe('416-crlv-sp');
      expect(normalized.chaveConsulta).toBe("12348");
      expect(normalized.dados.rouboFurto).toBe(false);
      expect(normalized.dados.dpvat).toBe(false);
      expect(normalized.dados.veicular).toEqual(mockResponse.VEICULAR);
    });
  });

  describe('Validação de Entrada Geral', () => {
    it('deve validar formato de placa para todos os serviços veiculares', () => {
      const services = ['411-crlv-ro', '412-crlv-rr', '415-crlv-se', '416-crlv-sp'];
      const validPlaca = 'ABC1234';
      const invalidPlaca = 'INVALID';

      services.forEach(service => {
        // Teste com placa válida
        expect(() => {
          (plugin as any).prepareRequestPayload(service, { placa: validPlaca });
        }).not.toThrow();

        // Teste com placa inválida
        expect(() => {
          (plugin as any).prepareRequestPayload(service, { placa: invalidPlaca });
        }).toThrow();
      });
    });
  });
});