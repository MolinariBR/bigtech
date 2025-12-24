// Baseado em: 8.Tests.md v1.0.0
// Estratégia: Testes property-based (conforme 8.Tests.md seção 2.3)
// Cobertura: TASK-BIGTECH-003 "Criar Especificação OpenAPI" (7.Tasks.md)

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('BigTech OpenAPI Specification Tests', () => {
  let openApiSpec: any;

  beforeAll(() => {
    const specPath = path.join(__dirname, '../src/plugins/consulta/bigtech/bigtech.yaml');
    const specContent = fs.readFileSync(specPath, 'utf8');
    openApiSpec = yaml.load(specContent);
  });

  describe('Propriedade 1: Todos os serviços .md mapeados para endpoints OpenAPI', () => {
    const expectedServices = [
      // Cadastral
      { code: '320', name: 'Contatos Por CEP', category: 'cadastral' },
      { code: '327', name: 'QUOD CADASTRAL PF', category: 'cadastral' },
      { code: '424', name: 'ValidaID - Localizacao', category: 'cadastral' },
      { code: '431', name: 'Dados de CNH', category: 'cadastral' },
      // Crédito
      { code: '36', name: 'Busca por Nome+UF', category: 'credito' },
      { code: '39', name: 'TeleConfirma', category: 'credito' },
      { code: '41', name: 'PROTESTO SINTÉTICO NACIONAL', category: 'credito' },
      { code: '304', name: 'POSITIVO DEFINE RISCO CNPJ', category: 'credito' },
      { code: 'POSITIVO ACERTA ESSENCIAL PF', name: 'Positivo Acerta Essencial PF', category: 'credito' },
      // Veículo
      { code: '411', name: 'Crlv-RO', category: 'veicular' },
      { code: '412', name: 'Crlv RR', category: 'veicular' },
      { code: '415', name: 'Crlv-SE', category: 'veicular' },
      { code: '416', name: 'Crlv-SP', category: 'veicular' }
    ];

    it('deve ter endpoints para todos os 13 serviços documentados', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const paths = Object.keys(openApiSpec.paths);
          const expectedPaths = [
            '/consultas/cadastral/contatos-cep',
            '/consultas/cadastral/quod-pf',
            '/consultas/cadastral/validacao-localizacao',
            '/consultas/cadastral/dados-cnh',
            '/consultas/credito/busca-nome-uf',
            '/consultas/credito/teleconfirma',
            '/consultas/credito/protesto-sintetico-nacional',
            '/consultas/credito/positivo-define-risco-cnpj',
            '/consultas/credito/positivo-acerta-essencial-pf',
            '/consultas/veicular/crlv-ro',
            '/consultas/veicular/crlv-rr',
            '/consultas/veicular/crlv-se',
            '/consultas/veicular/crlv-sp'
          ];

          expectedPaths.forEach(expectedPath => {
            expect(paths).toContain(expectedPath);
          });

          expect(paths.length).toBe(13); // Deve ter exatamente 13 endpoints

          return true;
        })
      );
    });

    it('deve ter tags corretas para cada categoria', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const paths = openApiSpec.paths;

          Object.keys(paths).forEach(pathKey => {
            const operation = paths[pathKey].post;
            if (operation && operation.tags) {
              if (pathKey.includes('/cadastral/')) {
                expect(operation.tags).toContain('Cadastral');
              } else if (pathKey.includes('/credito/')) {
                expect(operation.tags).toContain('Crédito');
              } else if (pathKey.includes('/veicular/')) {
                expect(operation.tags).toContain('Veículo');
              }
            }
          });

          return true;
        })
      );
    });
  });

  describe('Propriedade 2: Validações de campos corretas para cada serviço', () => {
    it('deve ter schemas de request válidos', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const paths = openApiSpec.paths;

          Object.keys(paths).forEach(pathKey => {
            const operation = paths[pathKey].post;
            if (operation && operation.requestBody) {
              const schema = operation.requestBody.content['application/json'].schema;
              expect(schema).toBeDefined();
              expect(schema.$ref).toBe('#/components/schemas/BigTechRequest');
            }
          });

          return true;
        })
      );
    });

    it('deve ter campos obrigatórios corretos no schema base', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const requestSchema = openApiSpec.components.schemas.BigTechRequest;
          expect(requestSchema.required).toContain('CodigoProduto');
          expect(requestSchema.required).toContain('Versao');
          expect(requestSchema.required).toContain('ChaveAcesso');

          expect(requestSchema.properties.CodigoProduto.type).toBe('string');
          expect(requestSchema.properties.Versao.type).toBe('string');
          expect(requestSchema.properties.ChaveAcesso.type).toBe('string');

          return true;
        })
      );
    });

    it('deve ter responses padronizadas', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const paths = openApiSpec.paths;

          Object.keys(paths).forEach(pathKey => {
            const operation = paths[pathKey].post;
            if (operation && operation.responses) {
              expect(operation.responses['200']).toBeDefined();
              expect(operation.responses['400']).toBeDefined();

              const successResponse = operation.responses['200'];
              const errorResponse = operation.responses['400'];

              expect(successResponse.content['application/json'].schema.$ref).toBe('#/components/schemas/BigTechResponse');
              expect(errorResponse.content['application/json'].schema.$ref).toBe('#/components/schemas/BigTechErrorResponse');
            }
          });

          return true;
        })
      );
    });

    it('deve ter exemplos válidos nos requests', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const paths = openApiSpec.paths;

          Object.keys(paths).forEach(pathKey => {
            const operation = paths[pathKey].post;
            if (operation && operation.requestBody) {
              const example = operation.requestBody.content['application/json'].example;
              expect(example).toBeDefined();
              expect(example.CodigoProduto).toBeDefined();
              expect(example.Versao).toBe('20180521');
              expect(example.ChaveAcesso).toBeDefined();
            }
          });

          return true;
        })
      );
    });
  });

  describe('Propriedade 3: Estrutura OpenAPI 3.1.0 válida', () => {
    it('deve ter estrutura básica correta', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          expect(openApiSpec.openapi).toBe('3.1.0');
          expect(openApiSpec.info).toBeDefined();
          expect(openApiSpec.info.title).toBe('BigTech API');
          expect(openApiSpec.info.version).toBe('1.0.0');
          expect(openApiSpec.servers).toBeDefined();
          expect(openApiSpec.paths).toBeDefined();
          expect(openApiSpec.components).toBeDefined();
          expect(openApiSpec.security).toBeDefined();

          return true;
        })
      );
    });

    it('deve ter security schemes configurados', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const securitySchemes = openApiSpec.components.securitySchemes;
          expect(securitySchemes.ApiKeyAuth).toBeDefined();
          expect(securitySchemes.ApiKeyAuth.type).toBe('apiKey');
          expect(securitySchemes.ApiKeyAuth.in).toBe('header');
          expect(securitySchemes.ApiKeyAuth.name).toBe('Authorization');

          return true;
        })
      );
    });
  });
});