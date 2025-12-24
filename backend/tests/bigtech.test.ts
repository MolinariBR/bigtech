// Baseado em: 8.Tests.md v1.0.0, TASK-BIGTECH-001.1
// Testes property-based para TASK-BIGTECH-001 (Estrutura Base do Plugin BigTech)
// Estratégia: Testes unitários com fast-check para validação de propriedades

import fc from 'fast-check';
import { BigTechPlugin, createBigTechPlugin } from '../src/plugins/consulta/bigtech/index';
import { BigTechConfig } from '../src/plugins/consulta/bigtech/types';

describe('TASK-BIGTECH-001.1 - Testes Property-Based para Estrutura Base', () => {
  describe('Propriedade 1: Plugin carrega sem erros na inicialização', () => {
    it('Deve carregar o plugin com configurações válidas sem lançar erros', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            baseUrl: fc.webUrl(),
            timeout: fc.integer({ min: 1000, max: 60000 }),
            retries: fc.integer({ min: 0, max: 10 }),
            retryDelayMs: fc.integer({ min: 100, max: 10000 }),
            rateLimitPerMinute: fc.integer({ min: 1, max: 100 }),
            minRequestInterval: fc.integer({ min: 0, max: 10000 }),
            fallbackSources: fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
            apiKey: fc.option(fc.string()).map(x => x === null ? undefined : x)
          }),
          async (config: Partial<BigTechConfig>) => {
            // Arrange & Act
            const plugin = createBigTechPlugin(config);

            // Assert - Não deve lançar erro na criação
            expect(plugin).toBeInstanceOf(BigTechPlugin);
            expect(typeof plugin.id).toBe('string');
            expect(typeof plugin.version).toBe('string');
            expect(plugin.type).toBe('consulta');
          }
        )
      );
    });

    it('Deve falhar com configurações inválidas', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            baseUrl: fc.constant(''), // URL vazia - inválida
            timeout: fc.integer({ min: -1000, max: 999 }), // Timeout inválido
            retries: fc.integer({ min: -10, max: -1 }), // Retries negativo
          }),
          fc.oneof(fc.constant(undefined), fc.string()),
          async (config: Partial<BigTechConfig>, apiKey?: string) => {
            // Arrange
            const fullConfig = { ...config, apiKey };

            // Act & Assert
            await expect(createBigTechPlugin(fullConfig).install()).rejects.toThrow();
          }
        )
      );
    });

    it('Deve inicializar com configuração padrão quando nenhuma é fornecida', () => {
      // Arrange & Act
      const plugin = createBigTechPlugin();

      // Assert
      expect(plugin).toBeInstanceOf(BigTechPlugin);
      expect(plugin.id).toBe('bigtech');
      expect(plugin.type).toBe('consulta');
      expect(plugin.version).toBe('1.0.0');

      const config = plugin.getConfig();
      expect(config.baseUrl).toBeDefined();
      expect(config.timeout).toBeGreaterThan(0);
      expect(config.retries).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Propriedade 2: Metadados do plugin corretos (id, type, version)', () => {
    it('Deve ter metadados imutáveis e corretos', () => {
      fc.assert(
        fc.property(
          fc.record({
            baseUrl: fc.webUrl(),
            timeout: fc.integer({ min: 1000, max: 60000 }),
            retries: fc.integer({ min: 0, max: 10 }),
            retryDelayMs: fc.integer({ min: 100, max: 10000 }),
            rateLimitPerMinute: fc.integer({ min: 1, max: 100 }),
            minRequestInterval: fc.integer({ min: 0, max: 10000 }),
            fallbackSources: fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
            apiKey: fc.option(fc.string()).map(x => x === null ? undefined : x)
          }),
          (config: Partial<BigTechConfig>) => {
            // Arrange
            const plugin = createBigTechPlugin(config);

            // Assert - Metadados devem ser sempre os mesmos
            expect(plugin.id).toBe('bigtech');
            expect(plugin.type).toBe('consulta');
            expect(plugin.version).toBe('1.0.0');
          }
        )
      );
    });

    it('Deve listar serviços disponíveis corretamente', () => {
      // Arrange
      const plugin = createBigTechPlugin();

      // Act
      const services = plugin.getAvailableServices();

      // Assert
      expect(Array.isArray(services)).toBe(true);
      expect(services.length).toBeGreaterThan(0);
      expect(services).toContain('320-contatos-por-cep');
      expect(services).toContain('36-busca-nome-uf');
      expect(services).toContain('411-crlv-ro');

      // Verificar que todos os códigos são strings válidas
      services.forEach(service => {
        expect(typeof service).toBe('string');
        expect(service.length).toBeGreaterThan(0);
      });
    });

    it('Deve validar que metadados são constantes independente da configuração', () => {
      fc.assert(
        fc.property(
          fc.record({
            baseUrl: fc.webUrl(),
            timeout: fc.integer({ min: 1000, max: 60000 }),
            retries: fc.integer({ min: 0, max: 10 }),
            retryDelayMs: fc.integer({ min: 100, max: 10000 }),
            rateLimitPerMinute: fc.integer({ min: 1, max: 100 }),
            minRequestInterval: fc.integer({ min: 0, max: 10000 }),
            fallbackSources: fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
            apiKey: fc.option(fc.string()).map(x => x === null ? undefined : x)
          }),
          (config: Partial<BigTechConfig>) => {
            // Arrange
            const plugin1 = createBigTechPlugin();
            const plugin2 = createBigTechPlugin(config);

            // Assert - Metadados devem ser idênticos
            expect(plugin1.id).toBe(plugin2.id);
            expect(plugin1.type).toBe(plugin2.type);
            expect(plugin1.version).toBe(plugin2.version);
          }
        )
      );
    });
  });

  describe('Validação Geral da Estrutura Base', () => {
    it('Deve implementar interface Plugin corretamente', () => {
      // Arrange
      const plugin = createBigTechPlugin();

      // Assert - Deve ter todos os métodos da interface Plugin
      expect(typeof plugin.install).toBe('function');
      expect(typeof plugin.enable).toBe('function');
      expect(typeof plugin.disable).toBe('function');
      expect(typeof plugin.execute).toBe('function');
      expect(typeof plugin.getAvailableServices).toBe('function');
      expect(typeof plugin.getConfig).toBe('function');
    });

    it('Deve ser serializável (para armazenamento)', () => {
      // Arrange
      const plugin = createBigTechPlugin();

      // Act
      const serialized = JSON.stringify({
        id: plugin.id,
        type: plugin.type,
        version: plugin.version,
        config: plugin.getConfig()
      });

      // Assert
      expect(() => JSON.parse(serialized)).not.toThrow();
      const parsed = JSON.parse(serialized);
      expect(parsed.id).toBe('bigtech');
      expect(parsed.type).toBe('consulta');
      expect(parsed.version).toBe('1.0.0');
    });
  });
});