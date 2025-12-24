import { InfosimplesPlugin } from '../../src/plugins/consulta/infosimples/index';
import { ConsultaSchema } from '../../src/plugins/consulta/infosimples/types2';

describe('InfosimplesPlugin', () => {
  let plugin: InfosimplesPlugin;

  beforeEach(() => {
    plugin = new InfosimplesPlugin({
      apiKey: 'test-api-key',
      baseUrl: 'https://api.infosimples.com',
      timeout: 5000,
      retries: 2,
      retryDelayMs: 100,
      fallbackSources: []
    });
  });

  describe('getAvailableServices', () => {
    it('should return services from schemas when available', async () => {
      // Mock do método getSchemas
      const mockSchemas: ConsultaSchema[] = [
        {
          id: 'receita_federal_cpf',
          provider: 'infosimples',
          method: 'POST',
          endpoint: '/consultas/receita-federal/cpf',
          form: {
            title: 'Receita Federal / CPF',
            submit_label: 'Consultar',
            fields: [
              {
                name: 'cpf',
                type: 'document.cpf',
                required: true,
                label: 'CPF',
                validation: { pattern: '^\\d{11}$' }
              }
            ]
          }
        }
      ];

      jest.spyOn(plugin as any, 'getSchemas').mockReturnValue(mockSchemas);

      const services = await plugin.getAvailableServices();

      expect(services).toHaveLength(1);
      expect(services[0]).toMatchObject({
        id: 'receita_federal_cpf',
        name: 'Receita Federal / CPF',
        description: 'Consulta de dados cadastrais de pessoa física na Receita Federal',
        price: 1.00,
        category: 'cadastral',
        active: true,
        endpoint: '/consultas/receita-federal/cpf'
      });
    });

    it('should return hardcoded services when schemas are empty', async () => {
      jest.spyOn(plugin as any, 'getSchemas').mockReturnValue([]);

      const services = await plugin.getAvailableServices();

      expect(services.length).toBeGreaterThan(0);
      expect(services.some(s => s.category === 'credito')).toBe(true);
      expect(services.some(s => s.category === 'cadastral')).toBe(true);
      expect(services.some(s => s.category === 'veicular')).toBe(true);
    });
  });

  describe('inferCategory', () => {
    it('should correctly infer categories from endpoints', () => {
      const testCases = [
        { endpoint: '/consultas/receita-federal/cpf', expected: 'cadastral' },
        { endpoint: '/consultas/cenprot-sp/protestos', expected: 'credito' },
        { endpoint: '/consultas/detran-rj/veiculo', expected: 'veicular' },
        { endpoint: '/consultas/correios/cep', expected: 'endereco' },
        { endpoint: '/consultas/unknown/service', expected: 'outros' }
      ];

      testCases.forEach(({ endpoint, expected }) => {
        const result = (plugin as any).inferCategory(endpoint);
        expect(result).toBe(expected);
      });
    });
  });

  describe('getPriceForCategory', () => {
    it('should return correct prices for categories', () => {
      const testCases = [
        { category: 'cadastral', expected: 1.00 },
        { category: 'credito', expected: 1.80 },
        { category: 'veicular', expected: 3.00 },
        { category: 'endereco', expected: 0.50 },
        { category: 'outros', expected: 1.00 },
        { category: 'unknown', expected: 1.00 }
      ];

      testCases.forEach(({ category, expected }) => {
        const result = (plugin as any).getPriceForCategory(category);
        expect(result).toBe(expected);
      });
    });
  });

  describe('getConsultaCode', () => {
    it('should return endpoint from schema when available', () => {
      const mockSchema: ConsultaSchema = {
        id: 'test_service',
        provider: 'infosimples',
        method: 'POST',
        endpoint: '/consultas/test/endpoint',
        form: {
          title: 'Test Service',
          submit_label: 'Consultar',
          fields: []
        }
      };

      jest.spyOn(plugin as any, 'getSchemaForService').mockReturnValue(mockSchema);

      const result = (plugin as any).getConsultaCode('test_service', {});

      expect(result).toBe('/consultas/test/endpoint');
    });

    it('should fallback to legacy codes when schema not found', () => {
      jest.spyOn(plugin as any, 'getSchemaForService').mockReturnValue(null);

      const result = (plugin as any).getConsultaCode('credito', { cpf: '12345678901' });

      expect(result).toBeDefined();
    });
  });

  describe('buildQueryParamsFromSchema', () => {
    it('should build query params correctly from schema', () => {
      const mockSchema: ConsultaSchema = {
        id: 'test_service',
        provider: 'infosimples',
        method: 'POST',
        endpoint: '/consultas/test',
        form: {
          title: 'Test Service',
          submit_label: 'Consultar',
          fields: [
            {
              name: 'cpf',
              type: 'document.cpf',
              required: true,
              label: 'CPF'
            },
            {
              name: 'birthdate',
              type: 'date.iso',
              required: true,
              label: 'Data de Nascimento'
            }
          ]
        }
      };

      const queryParams = new URLSearchParams();
      const data = { cpf: '123.456.789-01', birthdate: '1990-01-01' };
      const config = { apiKey: 'test-key' };

      (plugin as any).buildQueryParamsFromSchema(queryParams, mockSchema, data, config);

      expect(queryParams.get('cpf')).toBe('12345678901'); // Máscara removida
      expect(queryParams.get('birthdate')).toBe('1990-01-01');
      expect(queryParams.get('token')).toBe('test-key');
      expect(queryParams.get('timeout')).toBe('300');
    });

    it('should handle different field types correctly', () => {
      const mockSchema: ConsultaSchema = {
        id: 'test_service',
        provider: 'infosimples',
        method: 'POST',
        endpoint: '/consultas/test',
        form: {
          title: 'Test Service',
          submit_label: 'Consultar',
          fields: [
            {
              name: 'cnpj',
              type: 'document.cnpj',
              required: true,
              label: 'CNPJ'
            },
            {
              name: 'placa',
              type: 'vehicle.plate',
              required: true,
              label: 'Placa'
            }
          ]
        }
      };

      const queryParams = new URLSearchParams();
      const data = { cnpj: '12.345.678/0001-90', placa: 'abc-1234' };
      const config = { apiKey: 'test-key' };

      (plugin as any).buildQueryParamsFromSchema(queryParams, mockSchema, data, config);

      expect(queryParams.get('cnpj')).toBe('12345678000190'); // Máscara removida
      expect(queryParams.get('placa')).toBe('ABC1234'); // Maiúsculo e sem hífen
    });
  });

  describe('normalizeData', () => {
    it('should normalize data correctly for different types', () => {
      const testCases = [
        {
          type: 'credito',
          data: { score: 850, restricoes: ['divida'] },
          expected: { score: 850, restricoes: ['divida'], protestos: [], processos: [] }
        },
        {
          type: 'cadastral',
          data: { nome: 'João Silva', endereco: 'Rua A' },
          expected: { nome: 'João Silva', endereco: 'Rua A', telefones: [], situacao: null }
        },
        {
          type: 'veicular',
          data: { proprietario: 'João', modelo: 'Gol' },
          expected: { proprietario: 'João', modelo: 'Gol', ano: null, restricoes: [], multas: [] }
        }
      ];

      testCases.forEach(({ type, data, expected }) => {
        const result = (plugin as any).normalizeData(type, data);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('calculateCost', () => {
    it('should return correct costs for different types', () => {
      const testCases = [
        { type: 'credito', expected: 1.80 },
        { type: 'cadastral', expected: 1.00 },
        { type: 'veicular', expected: 3.00 },
        { type: 'unknown', expected: 0 }
      ];

      testCases.forEach(({ type, expected }) => {
        const result = (plugin as any).calculateCost(type);
        expect(result).toBe(expected);
      });
    });
  });
});