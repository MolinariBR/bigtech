// Baseado em: 8.Tests.md (criado), 4.Entities.md v1.7
// Testes property-based para plugin Infosimples

import fc from 'fast-check';
import { InfosimplesPlugin } from '../src/plugins/consulta/infosimples/index';
import { NormalizedConsulta } from '../src/plugins/consulta/infosimples/types2';

describe('Plugin Infosimples - Property-Based Tests', () => {
  let plugin: InfosimplesPlugin;

  beforeEach(() => {
    plugin = new InfosimplesPlugin({
      apiKey: 'test-key',
      baseUrl: 'https://api.test.com',
      timeout: 5000,
      fallbackSources: [],
    });
  });

  describe('Propriedade 1: Dados de fontes externas são normalizados consistentemente para schema padrão, independente de variações na API', () => {
    it('deve normalizar dados de crédito consistentemente', () => {
      fc.assert(
        fc.property(
          // Gerar dados arbitrários para resposta da API
          fc.record({
            score: fc.option(fc.integer({ min: 0, max: 1000 })),
            restricoes: fc.array(fc.string()),
            protestos: fc.array(fc.record({
              valor: fc.float({ min: 0 }),
              data: fc.date(),
            })),
            processos: fc.array(fc.string()),
          }),
          (apiData) => {
            // Simular resposta da API
            const response = { success: true, data: apiData };
            const normalized = plugin['normalizeResponse']('credito', { cpf: '12345678900' }, response);

            // Verificar schema normalizado
            expect(normalized).toHaveProperty('type', 'credito');
            expect(normalized).toHaveProperty('input.cpf', '12345678900');
            expect(normalized.output).toHaveProperty('status', 'success');
            expect(normalized.output).toHaveProperty('normalized', true);
            expect(normalized.output).toHaveProperty('source', 'infosimples');

            // Verificar estrutura dos dados normalizados
            const data = normalized.output.data;
            expect(data).toHaveProperty('score');
            expect(data).toHaveProperty('restricoes');
            expect(Array.isArray(data.restricoes)).toBe(true);
            expect(data).toHaveProperty('protestos');
            expect(Array.isArray(data.protestos)).toBe(true);
            expect(data).toHaveProperty('processos');
            expect(Array.isArray(data.processos)).toBe(true);
          }
        )
      );
    });

    it('deve normalizar dados cadastrais consistentemente', () => {
      fc.assert(
        fc.property(
          fc.record({
            nome: fc.option(fc.string()),
            endereco: fc.option(fc.string()),
            telefones: fc.array(fc.string()),
            situacao: fc.option(fc.string()),
          }),
          (apiData) => {
            const response = { success: true, data: apiData };
            const normalized = plugin['normalizeResponse']('cadastral', { cpf: '12345678900' }, response);

            expect(normalized.type).toBe('cadastral');
            expect(normalized.output.data).toHaveProperty('nome');
            expect(normalized.output.data).toHaveProperty('endereco');
            expect(Array.isArray(normalized.output.data.telefones)).toBe(true);
            expect(normalized.output.data).toHaveProperty('situacao');
          }
        )
      );
    });

    it('deve normalizar dados veiculares consistentemente', () => {
      fc.assert(
        fc.property(
          fc.record({
            proprietario: fc.option(fc.string()),
            modelo: fc.option(fc.string()),
            ano: fc.option(fc.integer({ min: 1900, max: 2030 })),
            restricoes: fc.array(fc.string()),
            multas: fc.array(fc.record({
              valor: fc.float({ min: 0 }),
              descricao: fc.string(),
            })),
          }),
          (apiData) => {
            const response = { success: true, data: apiData };
            const normalized = plugin['normalizeResponse']('veicular', { placa: 'ABC1234' }, response);

            expect(normalized.type).toBe('veicular');
            expect(normalized.output.data).toHaveProperty('proprietario');
            expect(normalized.output.data).toHaveProperty('modelo');
            expect(normalized.output.data).toHaveProperty('ano');
            expect(Array.isArray(normalized.output.data.restricoes)).toBe(true);
            expect(Array.isArray(normalized.output.data.multas)).toBe(true);
          }
        )
      );
    });
  });

  describe('Propriedade 2: Normalização é idempotente - aplicar múltiplas vezes produz mesmo resultado', () => {
    it('deve produzir mesmo resultado ao normalizar múltiplas vezes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('credito', 'cadastral', 'veicular'),
          fc.record({
            cpf: fc.option(fc.string()),
            cnpj: fc.option(fc.string()),
            placa: fc.option(fc.string()),
          }),
          fc.anything(),
          (type, input, apiData) => {
            const response = { success: true, data: apiData };
            const normalized1 = plugin['normalizeResponse'](type, input as any, response);
            const normalized2 = plugin['normalizeResponse'](type, input as any, response);

            // Normalização deve ser determinística
            expect(normalized1).toEqual(normalized2);
          }
        )
      );
    });
  });

  describe('Propriedade 3: Falhas na API são tratadas consistentemente', () => {
    it('deve normalizar falhas da API de forma consistente', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('credito', 'cadastral', 'veicular'),
          fc.record({
            cpf: fc.option(fc.string()),
            cnpj: fc.option(fc.string()),
            placa: fc.option(fc.string()),
          }),
          fc.string(),
          (type, input, errorMsg) => {
            const response = { success: false, error: errorMsg };
            const normalized = plugin['normalizeResponse'](type, input as any, response);

            expect(normalized.output.status).toBe('failed');
            expect(normalized.output.normalized).toBe(false);
            expect(normalized.output.error).toBe(errorMsg);
            expect(normalized.output.source).toBe('infosimples');
          }
        )
      );
    });
  });
});