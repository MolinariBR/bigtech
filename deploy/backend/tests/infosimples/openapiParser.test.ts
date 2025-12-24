import { OpenApiParser } from '../../src/utils/openapiParser';
import { ConsultaSchema } from '../../src/plugins/consulta/infosimples/types2';

describe('OpenApiParser', () => {
  let parser: OpenApiParser;

  beforeEach(() => {
    parser = new OpenApiParser();
  });

  describe('parse', () => {
    it('should parse valid OpenAPI YAML and return ConsultaSchema array', () => {
      const yamlContent = `
openapi: 3.0.0
paths:
  /consultas/receita_federal_cpf:
    post:
      summary: Consulta CPF na Receita Federal
      parameters:
        - name: cpf
          in: query
          required: true
          schema:
            type: string
            pattern: '^\\d{11}$'
          description: CPF do cidadão
        - name: token
          in: query
          required: true
          schema:
            type: string
          description: Token de autenticação
  /consultas/cenprot_sp_protestos:
    post:
      summary: Consulta Protestos SP
      parameters:
        - name: cnpj
          in: query
          required: true
          schema:
            type: string
          description: CNPJ da empresa
        - name: timeout
          in: query
          required: false
          schema:
            type: integer
          description: Timeout da consulta
`;

      const result = parser.parse(yamlContent);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'receita_federal_cpf',
        provider: 'infosimples',
        method: 'POST',
        endpoint: '/consultas/receita_federal_cpf',
        form: {
          title: 'Consulta CPF na Receita Federal',
          submit_label: 'Consultar',
          fields: [
            {
              name: 'cpf',
              type: 'document.cpf',
              required: true,
              label: 'CPF do cidadão',
              validation: {
                pattern: '^\\d{11}$'
              }
            }
          ]
        }
      });
    });

    it('should handle parameters with colon prefix (YAML quirk)', () => {
      const yamlContent = `
openapi: 3.0.0
paths:
  /consultas/test:
    post:
      :summary: Test Consulta
      :parameters:
        - :name: placa
          :in: query
          :required: true
          schema:
            type: string
          :description: Placa do veículo
`;

      const result = parser.parse(yamlContent);

      expect(result).toHaveLength(1);
      expect(result[0].form.fields[0]).toMatchObject({
        name: 'placa',
        type: 'vehicle.plate',
        required: true,
        label: 'Placa do veículo'
      });
    });

    it('should filter out token and timeout parameters', () => {
      const yamlContent = `
openapi: 3.0.0
paths:
  /consultas/test:
    post:
      summary: Test Consulta
      parameters:
        - name: cpf
          in: query
          required: true
          schema:
            type: string
        - name: token
          in: query
          required: true
          schema:
            type: string
        - name: timeout
          in: query
          required: false
          schema:
            type: integer
`;

      const result = parser.parse(yamlContent);

      expect(result[0].form.fields).toHaveLength(1);
      expect(result[0].form.fields[0].name).toBe('cpf');
    });

    it('should only process POST methods in /consultas/ paths', () => {
      const yamlContent = `
openapi: 3.0.0
paths:
  /consultas/valid:
    post:
      summary: Valid POST
      parameters: []
  /consultas/invalid:
    get:
      summary: Invalid GET
      parameters: []
  /other/path:
    post:
      summary: Invalid path
      parameters: []
`;

      const result = parser.parse(yamlContent);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('valid');
    });
  });

  describe('inferType', () => {
    it('should infer correct types for known field names', () => {
      const testCases = [
        { name: 'cpf', expected: 'document.cpf' },
        { name: 'cnpj', expected: 'document.cnpj' },
        { name: 'placa', expected: 'vehicle.plate' },
        { name: 'renavam', expected: 'vehicle.renavam' },
        { name: 'chassi', expected: 'vehicle.chassi' },
        { name: 'uf', expected: 'enum.uf' },
        { name: 'nome', expected: 'string.name' },
        { name: 'unknown', expected: 'string.generic' }
      ];

      testCases.forEach(({ name, expected }) => {
        const param = { name };
        const result = (parser as any).inferType(param);
        expect(result).toBe(expected);
      });
    });

    it('should infer date.iso for date format', () => {
      const param = {
        name: 'birthdate',
        schema: { format: 'date' }
      };
      const result = (parser as any).inferType(param);
      expect(result).toBe('date.iso');
    });
  });

  describe('getValidation', () => {
    it('should return validation rules for known types', () => {
      const testCases = [
        {
          param: { name: 'cpf' },
          expected: { pattern: '^\\d{11}$' }
        },
        {
          param: { name: 'cnpj' },
          expected: { pattern: '^\\d{14}$' }
        },
        {
          param: { name: 'placa' },
          expected: { pattern: '^[A-Z]{3}\\d{4}$' }
        },
        {
          param: {
            name: 'birthdate',
            schema: { format: 'date' }
          },
          expected: { pattern: '^\\d{4}-\\d{2}-\\d{2}$' }
        }
      ];

      testCases.forEach(({ param, expected }) => {
        const result = (parser as any).getValidation(param);
        expect(result).toEqual(expected);
      });
    });

    it('should include minLength and maxLength from schema', () => {
      const param = {
        name: 'cpf',
        schema: {
          minLength: 11,
          maxLength: 11
        }
      };
      const result = (parser as any).getValidation(param);
      expect(result).toEqual({
        pattern: '^\\d{11}$',
        minLength: 11,
        maxLength: 11
      });
    });
  });
});