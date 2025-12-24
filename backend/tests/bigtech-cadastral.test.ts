// Baseado em: 8.Tests.md v1.0.0
// Cobertura: TASK-BIGTECH-004 "Implementar Lógica de Consultas Cadastrais" (7.Tasks.md)
// Estratégia: Testes de integração com property-based testing (8.Tests.md seção 2.3)

import { BigTechPlugin } from '../src/plugins/consulta/bigtech/index';
import { BigTechConfig } from '../src/plugins/consulta/bigtech/types';
import fc from 'fast-check';

describe('BigTech Plugin - Serviços Cadastrais', () => {
  let plugin: BigTechPlugin;
  const mockConfig: BigTechConfig = {
    baseUrl: 'https://api.consultasbigtech.com.br',
    apiKey: 'test-key',
    timeout: 5000,
    retries: 2,
    retryDelayMs: 1000,
    minRequestInterval: 100,
    rateLimitPerMinute: 60,
    fallbackSources: []
  };

  beforeEach(() => {
    plugin = new BigTechPlugin(mockConfig);
  });

  describe('Propriedade 1: Payloads válidos para todos os serviços cadastrais', () => {
    it('deve preparar payload correto para 320-Contatos Por CEP', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{8}$/), // CEP válido com 8 dígitos
          fc.string({ minLength: 0, maxLength: 50 }), // Solicitante opcional
          (cep, solicitante) => {
            const input = { cep, solicitante };

            // Mock do método privado prepareContatosPorCepPayload
            const payload = (plugin as any).prepareContatosPorCepPayload(input);

            expect(payload).toEqual({
              CodigoProduto: "1465",
              Versao: "20180521",
              ChaveAcesso: mockConfig.apiKey,
              Info: {
                Solicitante: solicitante
              },
              Parametros: {
                Cep: cep
              },
              WebHook: {
                UrlCallBack: ''
              }
            });
          }
        )
      );
    });

    it('deve preparar payload correto para 327-QUOD CADASTRAL PF', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.tuple(fc.stringMatching(/^\d{11}$/), fc.constant('F')), // CPF + pessoa física
            fc.tuple(fc.stringMatching(/^\d{14}$/), fc.constant('J'))  // CNPJ + pessoa jurídica
          ),
          fc.string({ minLength: 0, maxLength: 50 }), // Solicitante opcional
          ([documento, tipoPessoa], solicitante) => {
            const input = { cpfCnpj: documento, tipoPessoa, solicitante };

            const payload = (plugin as any).prepareQuodCadastralPfPayload(input);

            expect(payload).toEqual({
              CodigoProduto: "1468",
              Versao: "20180521",
              ChaveAcesso: mockConfig.apiKey,
              Info: {
                Solicitante: solicitante
              },
              Parametros: {
                TipoPessoa: tipoPessoa,
                CPFCNPJ: documento
              },
              WebHook: {
                UrlCallBack: ''
              }
            });
          }
        )
      );
    });

    it('deve preparar payload correto para 424-ValidaID - Localizacao', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{11}$/), // CPF válido
          fc.string({ minLength: 0, maxLength: 50 }), // Solicitante opcional
          (cpf, solicitante) => {
            const input = { cpf, solicitante };

            const payload = (plugin as any).prepareValidacaoLocalizacaoPayload(input);

            expect(payload).toEqual({
              CodigoProduto: "1475",
              Versao: "20180521",
              ChaveAcesso: mockConfig.apiKey,
              Info: {
                Solicitante: solicitante
              },
              Parametros: {
                TipoPessoa: "F",
                CPFCNPJ: cpf
              },
              WebHook: {
                UrlCallBack: ''
              }
            });
          }
        )
      );
    });

    it('deve preparar payload correto para 431-Dados de CNH', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{11}$/), // CPF válido
          fc.string({ minLength: 0, maxLength: 50 }), // Solicitante opcional
          (cpf, solicitante) => {
            const input = { cpf, solicitante };

            const payload = (plugin as any).prepareDadosCnhPayload(input);

            expect(payload).toEqual({
              CodigoProduto: "1476",
              Versao: "20180521",
              ChaveAcesso: mockConfig.apiKey,
              Info: {
                Solicitante: solicitante
              },
              Parametros: {
                TipoPessoa: "F",
                CPFCNPJ: cpf
              },
              WebHook: {
                UrlCallBack: ''
              }
            });
          }
        )
      );
    });
  });

  describe('Propriedade 2: Validações de entrada funcionam corretamente', () => {
    it('deve rejeitar CEP inválido para 320-Contatos Por CEP', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.length > 0 && !/^\d{8}$/.test(s)), // CEP inválido (não vazio e não 8 dígitos)
          (cep) => {
            const input = { cep };

            expect(() => {
              (plugin as any).prepareContatosPorCepPayload(input);
            }).toThrow('CEP deve ter exatamente 8 dígitos');
          }
        )
      );
    });

    it('deve rejeitar CPF/CNPJ inválido para 327-QUOD CADASTRAL PF', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.tuple(fc.string().filter(s => s.length > 0 && !/^\d{11}$/.test(s)), fc.constant('F')), // CPF inválido + pessoa física
            fc.tuple(fc.string().filter(s => s.length > 0 && !/^\d{14}$/.test(s)), fc.constant('J'))  // CNPJ inválido + pessoa jurídica
          ),
          ([documento, tipoPessoa]) => {
            const input = { cpfCnpj: documento, tipoPessoa };

            expect(() => {
              (plugin as any).prepareQuodCadastralPfPayload(input);
            }).toThrow(/CPF\/CNPJ deve ter/);
          }
        )
      );
    });

    it('deve rejeitar tipo pessoa inválido para 327-QUOD CADASTRAL PF', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^\d{11}$/),
          fc.string().filter(s => s !== 'F' && s !== 'J'), // Tipo pessoa inválido
          (cpf, tipoPessoa) => {
            const input = { cpfCnpj: cpf, tipoPessoa };

            expect(() => {
              (plugin as any).prepareQuodCadastralPfPayload(input);
            }).toThrow('TipoPessoa deve ser "F" (física) ou "J" (jurídica)');
          }
        )
      );
    });
  });

  describe('Propriedade 3: Normalização de respostas funciona corretamente', () => {
    const mockResponseBase = {
      HEADER: {
        INFORMACOES_RETORNO: {
          VERSAO: "20180521",
          STATUS_RETORNO: {
            CODIGO: "1",
            DESCRICAO: "CONSULTA CONCLUIDA COM SUCESSO"
          },
          CHAVE_CONSULTA: "1022687",
          PRODUTO: "1465-320-Contatos Por CEP",
          CLIENTE: "01.523.638/0001-72-REVENDA PRINCIPALS",
          DATA_HORA_CONSULTA: "07/02/2019 18:20",
          TERMINAL: "",
          SOLICITANTE: "",
          PDF: "",
          PDF_ALERTA: "",
          ENTIDADE: "",
          REQUISICAO: "",
          WEBHOOK_CALLBACK: "",
          TEMPO_RESPOSTA: {
            INICIO: "",
            FINAL: "",
            INTERVALO: ""
          }
        },
        PARAMETROS: {},
        DADOS_RETORNADOS: {},
        CONTROLE: {
          QUANTIDADE_OCORRENCIAS: "1",
          OCORRENCIAS: [
            {
              CONTEUDO: "1",
              FONTE: "1",
              STATUS: "1"
            }
          ]
        }
      },
      CREDCADASTRAL: {},
      VEICULAR: {}
    };

    it('deve normalizar resposta de 320-Contatos Por CEP corretamente', () => {
      const response = {
        ...mockResponseBase,
        HEADER: {
          ...mockResponseBase.HEADER,
          PARAMETROS: { CEP: "01025478" },
          DADOS_RETORNADOS: {
            ...mockResponseBase.HEADER.DADOS_RETORNADOS,
            ENDERECO_DO_CEP: "1",
            CONTATOS: "1",
            TELEFONE_FIXO: "1",
            TELEFONE_CELULAR: "0",
            TELEFONE_COMERCIAL: "1",
            EMAILS: "1",
            RESIDENTES: "1",
            VIZINHOS: "0"
          }
        }
      };

      const normalized = (plugin as any).normalizeContatosPorCepResponse(response);

      expect(normalized).toEqual({
        success: true,
        service: '320-contatos-por-cep',
        chaveConsulta: "1022687",
        dataHora: "07/02/2019 18:20",
        parametros: {
          cep: "01025478"
        },
        dados: {
          enderecoCep: true,
          contatos: true,
          telefones: {
            fixo: true,
            celular: false,
            comercial: true
          },
          emails: true,
          residentes: true,
          vizinhos: false
        },
        rawResponse: response
      });
    });

    it('deve normalizar resposta de 327-QUOD CADASTRAL PF corretamente', () => {
      const response = {
        ...mockResponseBase,
        HEADER: {
          ...mockResponseBase.HEADER,
          PARAMETROS: { CPFCNPJ: "77973317000139", TIPO_PESSOA: "14" },
          DADOS_RETORNADOS: {
            ...mockResponseBase.HEADER.DADOS_RETORNADOS,
            DADOS_RECEITA_FEDERAL: "1",
            ENDERECOS: "1",
            TELEFONE_FIXO: "1",
            TELEFONE_CELULAR: "1",
            TELEFONE_COMERCIAL: "0",
            EMAILS: "1",
            DADOS_GERAIS: "1",
            OCUPACAO_PESSOA_FISICA: "1",
            PARENTES: "1",
            LOCAIS_TRABALHO: "1",
            BENEFICIO: "1",
            INFOBUSCA: "1",
            CNH: "1",
            VEICULOS_POR_DOCUMENTO: "1"
          }
        }
      };

      const normalized = (plugin as any).normalizeQuodCadastralPfResponse(response);

      expect(normalized.success).toBe(true);
      expect(normalized.service).toBe('327-quod-cadastral-pf');
      expect(normalized.dados.receitaFederal).toBe(true);
      expect(normalized.dados.enderecos).toBe(true);
      expect(normalized.dados.telefones.fixo).toBe(true);
      expect(normalized.dados.telefones.celular).toBe(true);
      expect(normalized.dados.telefones.comercial).toBe(false);
      expect(normalized.dados.cnh).toBe(true);
      expect(normalized.dados.veiculos).toBe(true);
    });
  });

  describe('Propriedade 4: Tratamento de erros funciona corretamente', () => {
    it('deve rejeitar resposta com status de erro', () => {
      const errorResponse = {
        HEADER: {
          INFORMACOES_RETORNO: {
            STATUS_RETORNO: {
              CODIGO: "0",
              DESCRICAO: "HOUVE UM ERRO NA CONSULTA"
            }
          }
        }
      };

      expect(() => {
        (plugin as any).normalizeResponse('320-contatos-por-cep', errorResponse);
      }).toThrow('Consulta falhou: HOUVE UM ERRO NA CONSULTA');
    });

    it('deve rejeitar resposta sem estrutura HEADER válida', () => {
      const invalidResponse = { invalid: 'structure' };

      expect(() => {
        (plugin as any).normalizeResponse('320-contatos-por-cep', invalidResponse);
      }).toThrow('Resposta inválida da API BigTech');
    });
  });
});