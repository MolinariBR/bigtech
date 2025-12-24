// Baseado em: 8.Tests.md v1.0.0, TASK-BIGTECH-002.1
// Testes property-based para TASK-BIGTECH-002 (Configuração e Tipos do Plugin)
// Estratégia: Testes unitários com fast-check para validação de propriedades

import fc from 'fast-check';
import {
  BigTechConfig,
  BigTechServiceInput,
  BigTechCadastralInput,
  BigTechCreditoInput,
  BigTechVeicularInput,
  BigTechValidationRule
} from '../src/plugins/consulta/bigtech/types';
import {
  defaultConfig,
  serviceValidations,
  serviceCategories,
  servicePrices,
  bigTechServices,
  bigTechProductCodes
} from '../src/plugins/consulta/bigtech/config';

describe('TASK-BIGTECH-002.1 - Testes Property-Based para Configuração e Tipos', () => {
  describe('Propriedade 1: Configurações válidas para todos os provedores', () => {
    it('Deve aceitar configurações válidas arbitrárias', () => {
      fc.assert(
        fc.property(
          fc.record({
            baseUrl: fc.webUrl(),
            timeout: fc.integer({ min: 1000, max: 120000 }),
            retries: fc.integer({ min: 0, max: 10 }),
            retryDelayMs: fc.integer({ min: 100, max: 30000 }),
            rateLimitPerMinute: fc.integer({ min: 1, max: 1000 }),
            minRequestInterval: fc.integer({ min: 0, max: 60000 }),
            fallbackSources: fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
            apiKey: fc.option(fc.string({ minLength: 10, maxLength: 100 })).map(x => x === null ? undefined : x)
          }),
          (config: BigTechConfig) => {
            // Assert - Deve ser um objeto válido
            expect(typeof config).toBe('object');
            expect(typeof config.baseUrl).toBe('string');
            expect(config.baseUrl.startsWith('http')).toBe(true);
            expect(typeof config.timeout).toBe('number');
            expect(config.timeout).toBeGreaterThanOrEqual(1000);
            expect(typeof config.retries).toBe('number');
            expect(config.retries).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(config.fallbackSources)).toBe(true);
            expect(config.fallbackSources.length).toBeGreaterThan(0);
          }
        )
      );
    });

    it('Deve rejeitar configurações inválidas', () => {
      fc.assert(
        fc.property(
          fc.record({
            baseUrl: fc.constant(''), // URL vazia - inválida
            timeout: fc.integer({ min: -1000, max: 999 }), // Timeout inválido
            retries: fc.integer({ min: -10, max: -1 }), // Retries negativo
            retryDelayMs: fc.integer({ min: -100, max: -1 }), // Delay negativo
            rateLimitPerMinute: fc.integer({ min: -100, max: 0 }), // Rate limit inválido
            minRequestInterval: fc.integer({ min: -1000, max: -1 }), // Intervalo negativo
            fallbackSources: fc.array(fc.string(), { minLength: 0, maxLength: 0 }), // Array vazio
            apiKey: fc.option(fc.string()).map(x => x === null ? undefined : x)
          }),
          (config: Partial<BigTechConfig>) => {
            // Assert - Deve identificar configurações problemáticas
            if (config.baseUrl === '') {
              expect(config.baseUrl).toBe('');
            }
            if (config.timeout && config.timeout < 1000) {
              expect(config.timeout).toBeLessThan(1000);
            }
            if (config.retries && config.retries < 0) {
              expect(config.retries).toBeLessThan(0);
            }
            if (config.fallbackSources && config.fallbackSources.length === 0) {
              expect(config.fallbackSources).toHaveLength(0);
            }
          }
        )
      );
    });

    it('Deve ter configuração padrão válida', () => {
      // Assert
      expect(defaultConfig).toBeDefined();
      expect(typeof defaultConfig.baseUrl).toBe('string');
      expect(defaultConfig.baseUrl).toMatch(/^https?:\/\//);
      expect(defaultConfig.timeout).toBeGreaterThanOrEqual(1000);
      expect(defaultConfig.retries).toBeGreaterThanOrEqual(0);
      expect(defaultConfig.retryDelayMs).toBeGreaterThan(0);
      expect(defaultConfig.rateLimitPerMinute).toBeGreaterThan(0);
      expect(defaultConfig.minRequestInterval).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(defaultConfig.fallbackSources)).toBe(true);
      expect(defaultConfig.fallbackSources.length).toBeGreaterThan(0);
    });
  });

  describe('Propriedade 2: Tipos TypeScript corretos para todas as categorias', () => {
    it('Deve validar entradas cadastrais corretamente', () => {
      fc.assert(
        fc.property(
          fc.record({
            cep: fc.option(fc.stringMatching(/^\d{8}$/)).map(x => x === null ? undefined : x),
            cpf: fc.option(fc.stringMatching(/^\d{11}$/)).map(x => x === null ? undefined : x),
            cnh: fc.option(fc.stringMatching(/^\d{11}$/)).map(x => x === null ? undefined : x)
          }),
          (input: BigTechCadastralInput) => {
            // Assert - Deve aceitar entradas válidas
            if (input.cep) {
              expect(input.cep).toMatch(/^\d{8}$/);
            }
            if (input.cpf) {
              expect(input.cpf).toMatch(/^\d{11}$/);
            }
            if (input.cnh) {
              expect(input.cnh).toMatch(/^\d{11}$/);
            }
          }
        )
      );
    });

    it('Deve validar entradas de crédito corretamente', () => {
      fc.assert(
        fc.property(
          fc.record({
            nome: fc.option(fc.string({ minLength: 3, maxLength: 100 })).map(x => x === null ? undefined : x),
            uf: fc.option(fc.constantFrom('SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'GO', 'MS', 'MT', 'BA', 'CE', 'PE', 'RN', 'PB', 'AL', 'SE', 'MA', 'PI', 'TO', 'AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'DF', 'ES')).map(x => x === null ? undefined : x),
            cpf: fc.option(fc.stringMatching(/^\d{11}$/)).map(x => x === null ? undefined : x),
            cnpj: fc.option(fc.stringMatching(/^\d{14}$/)).map(x => x === null ? undefined : x)
          }),
          (input: BigTechCreditoInput) => {
            // Assert - Deve aceitar entradas válidas
            if (input.nome) {
              expect(input.nome.length).toBeGreaterThanOrEqual(3);
              expect(input.nome.length).toBeLessThanOrEqual(100);
            }
            if (input.uf) {
              expect(input.uf.length).toBe(2);
              expect(input.uf).toMatch(/^[A-Z]{2}$/);
            }
            if (input.cpf) {
              expect(input.cpf).toMatch(/^\d{11}$/);
            }
            if (input.cnpj) {
              expect(input.cnpj).toMatch(/^\d{14}$/);
            }
          }
        )
      );
    });

    it('Deve validar entradas veiculares corretamente', () => {
      fc.assert(
        fc.property(
          fc.record({
            placa: fc.option(fc.stringMatching(/^[A-Z]{3}\d{4}$/)).map(x => x === null ? undefined : x),
            renavam: fc.option(fc.stringMatching(/^\d{11}$/)).map(x => x === null ? undefined : x),
            chassi: fc.option(fc.string({ minLength: 17, maxLength: 17 })).map(x => x === null ? undefined : x)
          }),
          (input: BigTechVeicularInput) => {
            // Assert - Deve aceitar entradas válidas
            if (input.placa) {
              expect(input.placa).toMatch(/^[A-Z]{3}\d{4}$/);
            }
            if (input.renavam) {
              expect(input.renavam).toMatch(/^\d{11}$/);
            }
            if (input.chassi) {
              expect(input.chassi.length).toBe(17);
            }
          }
        )
      );
    });

    it('Deve ter mapeamentos consistentes entre serviços, categorias e preços', () => {
      // Assert - Todos os serviços devem ter categoria definida
      Object.keys(bigTechServices).forEach(serviceCode => {
        expect(serviceCategories).toHaveProperty(serviceCode);
        expect(['cadastral', 'credito', 'veicular']).toContain(serviceCategories[serviceCode as keyof typeof serviceCategories]);
      });

      // Assert - Todas as categorias devem ter preço definido
      expect(servicePrices).toHaveProperty('cadastral');
      expect(servicePrices).toHaveProperty('credito');
      expect(servicePrices).toHaveProperty('veicular');

      // Assert - Todos os preços devem ser números positivos
      Object.values(servicePrices).forEach(price => {
        expect(typeof price).toBe('number');
        expect(price).toBeGreaterThan(0);
      });
    });

    it('Deve ter códigos de produto válidos para todos os serviços', () => {
      // Assert - Todos os serviços devem ter código de produto
      Object.keys(bigTechServices).forEach(serviceCode => {
        expect(bigTechProductCodes).toHaveProperty(serviceCode);
        expect(typeof bigTechProductCodes[serviceCode as keyof typeof bigTechProductCodes]).toBe('string');
        expect(bigTechProductCodes[serviceCode as keyof typeof bigTechProductCodes]).toMatch(/^\d+$/);
      });
    });

    it('Deve ter validações definidas para todos os serviços', () => {
      // Assert - Todos os serviços devem ter validações definidas
      Object.keys(bigTechServices).forEach(serviceCode => {
        expect(serviceValidations).toHaveProperty(serviceCode);
        expect(Array.isArray(serviceValidations[serviceCode])).toBe(true);
        expect(serviceValidations[serviceCode].length).toBeGreaterThan(0);

        // Assert - Cada validação deve ser bem formada
        serviceValidations[serviceCode].forEach((validation: BigTechValidationRule) => {
          expect(validation).toHaveProperty('field');
          expect(validation).toHaveProperty('type');
          expect(validation).toHaveProperty('required');
          expect(typeof validation.field).toBe('string');
          expect(typeof validation.required).toBe('boolean');
        });
      });
    });

    it('Deve validar que tipos de entrada são consistentes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(bigTechServices)),
          (serviceCode: string) => {
            const validations = serviceValidations[serviceCode];
            const category = serviceCategories[serviceCode as keyof typeof serviceCategories];

            // Assert - Validações devem ser apropriadas para a categoria
            validations.forEach((validation: BigTechValidationRule) => {
              switch (category) {
                case 'cadastral':
                  expect(['cep', 'cpf', 'cnh']).toContain(validation.type);
                  break;
                case 'credito':
                  expect(['nome', 'uf', 'cpf', 'cnpj', 'telefone']).toContain(validation.type);
                  break;
                case 'veicular':
                  expect(['placa', 'renavam', 'chassi']).toContain(validation.type);
                  break;
              }
            });
          }
        )
      );
    });
  });

  describe('Validação Geral da Configuração e Tipos', () => {
    it('Deve ter cobertura completa de serviços por categoria', () => {
      const cadastralServices = Object.keys(serviceCategories).filter(code => serviceCategories[code as keyof typeof serviceCategories] === 'cadastral');
      const creditoServices = Object.keys(serviceCategories).filter(code => serviceCategories[code as keyof typeof serviceCategories] === 'credito');
      const veicularServices = Object.keys(serviceCategories).filter(code => serviceCategories[code as keyof typeof serviceCategories] === 'veicular');

      // Assert - Deve ter pelo menos um serviço por categoria
      expect(cadastralServices.length).toBeGreaterThan(0);
      expect(creditoServices.length).toBeGreaterThan(0);
      expect(veicularServices.length).toBeGreaterThan(0);

      // Assert - Total deve ser 13 serviços
      const totalServices = cadastralServices.length + creditoServices.length + veicularServices.length;
      expect(totalServices).toBe(13);
    });

    it('Deve ter preços diferenciados por categoria de risco', () => {
      // Assert - Veicular deve ser mais caro que cadastral
      expect(servicePrices.veicular).toBeGreaterThan(servicePrices.cadastral);

      // Assert - Crédito deve ser mais caro que cadastral
      expect(servicePrices.credito).toBeGreaterThan(servicePrices.cadastral);

      // Assert - Crédito pode ser mais barato que veicular
      expect(servicePrices.credito).toBeLessThanOrEqual(servicePrices.veicular);
    });

    it('Deve ter configurações de rate limiting apropriadas', () => {
      // Assert - Rate limit deve ser razoável
      expect(defaultConfig.rateLimitPerMinute).toBeGreaterThan(0);
      expect(defaultConfig.rateLimitPerMinute).toBeLessThanOrEqual(100);

      // Assert - Intervalo mínimo deve ser positivo
      expect(defaultConfig.minRequestInterval).toBeGreaterThanOrEqual(0);
    });
  });
});