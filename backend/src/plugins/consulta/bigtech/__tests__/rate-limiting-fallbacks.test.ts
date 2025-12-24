// Baseado em: 8.Tests.md v1.0.0
// Testes para TASK-BIGTECH-007: Rate Limiting e Fallbacks
// Estratégia: Testes de integração com mocks para validar rate limiting e fallbacks

import { BigTechPlugin } from '../index';
import { BigTechConfig } from '../types';

describe('BigTech Plugin - TASK-BIGTECH-007: Rate Limiting e Fallbacks', () => {
  let plugin: BigTechPlugin;
  let mockConfig: Partial<BigTechConfig>;

  beforeEach(() => {
    mockConfig = {
      baseUrl: 'https://api.test.com',
      timeout: 5000,
      retries: 2,
      retryDelayMs: 100,
      rateLimitPerMinute: 5,
      rateLimitWindowMs: 60000,
      minRequestInterval: 100,
      fallbackSources: ['internal']
    };
    plugin = new BigTechPlugin(mockConfig);

    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate Limiting Avançado', () => {
    it('deve permitir requests dentro do limite', async () => {
      // Mock resposta de sucesso
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          HEADER: {
            INFORMACOES_RETORNO: {
              STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "Sucesso" },
              CHAVE_CONSULTA: "test-key",
              DATA_HORA_CONSULTA: new Date().toISOString()
            },
            PARAMETROS: { CEP: "12345678" },
            DADOS_RETORNADOS: { ENDERECO_DO_CEP: "1" }
          }
        })
      });

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '320-contatos-por-cep', cep: '12345678' },
        config: {}
      };

      // Executar múltiplas requests dentro do limite
      for (let i = 0; i < 5; i++) {
        const result = await plugin.execute(context);
        expect(result.success).toBe(true);
      }

      // Verificar estatísticas de rate limiting
      const stats = plugin.getRateLimitStats();
      const key = 'tenant-1:320-contatos-por-cep';
      expect(stats[key]).toBeDefined();
      expect(stats[key].requests).toBe(5);
    });

    it('deve bloquear requests acima do limite', async () => {
      // Mock resposta de sucesso
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          HEADER: {
            INFORMACOES_RETORNO: {
              STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "Sucesso" },
              CHAVE_CONSULTA: "test-key",
              DATA_HORA_CONSULTA: new Date().toISOString()
            },
            PARAMETROS: { PLACA: "ABC1234" },
            DADOS_RETORNADOS: { CRLV: "1" }
          }
        })
      });

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '411-crlv-ro', placa: 'ABC1234' },
        config: {}
      };

      // Executar requests até o limite (8 para categoria veicular)
      for (let i = 0; i < 8; i++) {
        const result = await plugin.execute(context);
        expect(result.success).toBe(true);
      }

      // Próxima request deve falhar por rate limiting
      const result = await plugin.execute(context);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit excedido');
    });

    it('deve resetar contador após janela de tempo', async () => {
      // Mock resposta de sucesso
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          HEADER: {
            INFORMACOES_RETORNO: {
              STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "Sucesso" },
              CHAVE_CONSULTA: "test-key",
              DATA_HORA_CONSULTA: new Date().toISOString()
            },
            PARAMETROS: { PLACA: "ABC1234" },
            DADOS_RETORNADOS: { CRLV: "1" }
          }
        })
      });

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '411-crlv-ro', placa: 'ABC1234' },
        config: {}
      };

      // Executar até o limite
      for (let i = 0; i < 8; i++) {
        await plugin.execute(context);
      }

      // Simular passagem de tempo (modificar janela do rate limiter)
      const stats = plugin.getRateLimitStats();
      const key = 'tenant-1:411-crlv-ro';
      if (stats[key]) {
        stats[key].windowStart = Date.now() - 70000; // 70 segundos atrás
      }

      // Próxima request deve ser permitida (janela resetada)
      const result = await plugin.execute(context);
      expect(result.success).toBe(true);
    });

    it('deve aplicar limites diferentes por categoria', () => {
      const limits = {
        cadastral: 10,
        credito: 5,
        veicular: 8
      };

      // Testar limites por categoria através do método privado
      expect((plugin as any).getRateLimitForCategory('cadastral')).toBe(10);
      expect((plugin as any).getRateLimitForCategory('credito')).toBe(5);
      expect((plugin as any).getRateLimitForCategory('veicular')).toBe(8);
      expect((plugin as any).getRateLimitForCategory('unknown')).toBe(5); // default
    });
  });

  describe('Sistema de Fallbacks', () => {
    it('deve executar serviço primário com sucesso', async () => {
      // Mock resposta de sucesso
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          HEADER: {
            INFORMACOES_RETORNO: {
              STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "Sucesso" },
              CHAVE_CONSULTA: "test-key",
              DATA_HORA_CONSULTA: new Date().toISOString()
            },
            PARAMETROS: { PLACA: "ABC1234" },
            DADOS_RETORNADOS: { CRLV: "1" }
          }
        })
      });

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '411-crlv-ro', placa: 'ABC1234' },
        config: {}
      };

      const result = await plugin.execute(context);
      expect(result.success).toBe(true);
      expect(result.data.service).toBe('411-crlv-ro');
    });

    it('deve fazer fallback quando serviço primário falha', async () => {
      // Mock primeira chamada falha, segunda sucesso
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Serviço 411 indisponível'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            HEADER: {
              INFORMACOES_RETORNO: {
                STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "Sucesso" },
                CHAVE_CONSULTA: "test-key",
                DATA_HORA_CONSULTA: new Date().toISOString()
              },
              PARAMETROS: { PLACA: "ABC1234" },
              DADOS_RETORNADOS: { CRLV: "1" }
            }
          })
        });

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '411-crlv-ro', placa: 'ABC1234' },
        config: {}
      };

      const result = await plugin.execute(context);
      expect(result.success).toBe(true);
      expect(result.data.service).toBe('412-crlv-rr'); // Fallback usado
    });

    it('deve tentar múltiplos fallbacks em sequência', async () => {
      // Mock todas as chamadas falham exceto a última
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Serviço 411 falhou'))
        .mockRejectedValueOnce(new Error('Serviço 412 falhou'))
        .mockRejectedValueOnce(new Error('Serviço 415 falhou'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            HEADER: {
              INFORMACOES_RETORNO: {
                STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "Sucesso" },
                CHAVE_CONSULTA: "test-key",
                DATA_HORA_CONSULTA: new Date().toISOString()
              },
              PARAMETROS: { PLACA: "ABC1234" },
              DADOS_RETORNADOS: { CRLV: "1" }
            }
          })
        });

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '411-crlv-ro', placa: 'ABC1234' },
        config: {}
      };

      const result = await plugin.execute(context);
      expect(result.success).toBe(true);
      expect(result.data.service).toBe('416-crlv-sp'); // Último fallback
    });

    it('deve falhar quando todos os serviços falham', async () => {
      // Mock todas as chamadas falham
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Serviço indisponível'));

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '411-crlv-ro', placa: 'ABC1234' },
        config: {}
      };

      const result = await plugin.execute(context);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Todos os serviços falharam');
    });
  });

  describe('Circuit Breaker', () => {
    it('deve abrir circuit breaker após múltiplas falhas', async () => {
      // Mock sempre falha
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Serviço indisponível'));

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '411-crlv-ro', placa: 'ABC1234' },
        config: {}
      };

      // Executar 5 vezes para abrir circuit breaker
      for (let i = 0; i < 5; i++) {
        await plugin.execute(context);
      }

      // Verificar estado do circuit breaker
      const stats = plugin.getCircuitBreakerStats();
      expect(stats['411-crlv-ro'].state).toBe('open');
      expect(stats['411-crlv-ro'].failures).toBe(5);
    });

    it('deve fechar circuit breaker após sucesso', async () => {
      // Mock falha primeiro, depois sucesso
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Falha'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            HEADER: {
              INFORMACOES_RETORNO: {
                STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "Sucesso" },
                CHAVE_CONSULTA: "test-key",
                DATA_HORA_CONSULTA: new Date().toISOString()
              },
              PARAMETROS: { PLACA: "ABC1234" },
              DADOS_RETORNADOS: { CRLV: "1" }
            }
          })
        });

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '411-crlv-ro', placa: 'ABC1234' },
        config: {}
      };

      // Uma falha
      await plugin.execute(context);

      // Uma sucesso - deve resetar circuit breaker
      const result = await plugin.execute(context);
      expect(result.success).toBe(true);

      const stats = plugin.getCircuitBreakerStats();
      expect(stats['411-crlv-ro'].failures).toBe(0);
      expect(stats['411-crlv-ro'].state).toBe('closed');
    });

    it('deve pular serviço quando circuit breaker está aberto', async () => {
      // Mock sempre falha
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Serviço indisponível'));

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '411-crlv-ro', placa: 'ABC1234' },
        config: {}
      };

      // Abrir circuit breaker
      for (let i = 0; i < 5; i++) {
        await plugin.execute(context);
      }

      // Próxima chamada deve pular o serviço primário e tentar fallbacks
      // Como não há mocks para fallbacks, deve falhar rapidamente
      const result = await plugin.execute(context);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Todos os serviços falharam');
    });
  });

  describe('Timeouts por Categoria', () => {
    it('deve aplicar timeout correto por categoria', async () => {
      const timeoutSpy = jest.spyOn(AbortSignal, 'timeout');

      // Mock resposta de sucesso
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          HEADER: {
            INFORMACOES_RETORNO: {
              STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "Sucesso" },
              CHAVE_CONSULTA: "test-key",
              DATA_HORA_CONSULTA: new Date().toISOString()
            },
            PARAMETROS: { CEP: "12345678" },
            DADOS_RETORNADOS: { ENDERECO_DO_CEP: "1" }
          }
        })
      });

      // Testar serviço cadastral (15 segundos)
      const contextCadastral = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '320-contatos-por-cep', cep: '12345678' },
        config: {}
      };

      await plugin.execute(contextCadastral);
      expect(timeoutSpy).toHaveBeenCalledWith(15000);

      // Testar serviço de crédito (20 segundos)
      const contextCredito = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '36-busca-nome-uf', uf: 'SP', nomeCompleto: 'João Silva' },
        config: {}
      };

      await plugin.execute(contextCredito);
      expect(timeoutSpy).toHaveBeenCalledWith(20000);

      // Testar serviço veicular (10 segundos)
      const contextVeicular = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '411-crlv-ro', placa: 'ABC1234' },
        config: {}
      };

      await plugin.execute(contextVeicular);
      expect(timeoutSpy).toHaveBeenCalledWith(10000);

      timeoutSpy.mockRestore();
    });
  });

  describe('Retry Logic com Exponential Backoff', () => {
    it('deve fazer retry com backoff exponencial', async () => {
      const delaySpy = jest.spyOn(global, 'setTimeout');

      // Mock falha nas primeiras tentativas, sucesso na última
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Tentativa 1 falhou'))
        .mockRejectedValueOnce(new Error('Tentativa 2 falhou'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            HEADER: {
              INFORMACOES_RETORNO: {
                STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "Sucesso" },
                CHAVE_CONSULTA: "test-key",
                DATA_HORA_CONSULTA: new Date().toISOString()
              },
              PARAMETROS: { CEP: "12345678" },
              DADOS_RETORNADOS: { ENDERECO_DO_CEP: "1" }
            }
          })
        });

      const context = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        input: { serviceCode: '320-contatos-por-cep', cep: '12345678' },
        config: {}
      };

      const result = await plugin.execute(context);
      expect(result.success).toBe(true);

      // Verificar delays: 100ms (base), 200ms (2x base)
      expect(delaySpy).toHaveBeenCalledWith(expect.any(Function), 100);
      expect(delaySpy).toHaveBeenCalledWith(expect.any(Function), 200);

      delaySpy.mockRestore();
    });
  });
});