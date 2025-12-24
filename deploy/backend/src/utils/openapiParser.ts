import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { ConsultaSchema, Field } from '../plugins/consulta/infosimples/types2';

interface OpenApiSpec {
  paths: Record<string, {
    post?: {
      summary?: string;
      parameters?: any[];
    };
  }>;
}

export class OpenApiParser {
  parse(yamlContent: string): ConsultaSchema[] {
    const spec = yaml.load(yamlContent) as any;

    const schemas: ConsultaSchema[] = [];

    for (const [path, methods] of Object.entries(spec.paths)) {
      // Normalizar nomes dos métodos (remover dois pontos se houver)
      const normalizedMethods = Object.fromEntries(
        Object.entries(methods as any).map(([method, spec]: [string, any]) => [
          method.startsWith(':') ? method.slice(1) : method,
          spec
        ])
      );

      if (normalizedMethods.post && path.startsWith('/consultas/')) {
        const schema = this.buildSchema(path, normalizedMethods.post);
        schemas.push(schema);
      }
    }

    return schemas;
  }

  private buildSchema(path: string, postSpec: any): ConsultaSchema {
    const id = path.replace('/consultas/', '').replace(/\//g, '_');
    const title = postSpec.summary || postSpec[':summary'] || id;

    // Handle both 'parameters' and ':parameters' keys
    const parameters = postSpec.parameters || postSpec[':parameters'] || [];
    const fields = this.extractFields(parameters);

    return {
      id,
      provider: 'infosimples',
      method: 'POST',
      endpoint: path,
      form: {
        title,
        submit_label: 'Consultar',
        fields
      }
    };
  }

  private extractFields(parameters: any[]): Field[] {
    return parameters
      .filter(p => p.in === 'query' || p[':in'] === 'query')
      .filter(p => !['token', 'timeout'].includes(p.name || p[':name']))
      .map(p => {
        // Normalizar parâmetro (remover dois pontos se houver)
        const normalizedParam = Object.fromEntries(
          Object.entries(p).map(([key, value]: [string, any]) => [
            key.startsWith(':') ? key.slice(1) : key,
            value
          ])
        );

        return {
          name: normalizedParam.name,
          type: this.inferType(normalizedParam),
          required: normalizedParam.required || false,
          label: normalizedParam.description || normalizedParam.name,
          validation: this.getValidation(normalizedParam)
        };
      });
  }

  private inferType(param: any): string {
    const name = param.name;
    const schema = param.schema;

    if (name === 'cpf') return 'document.cpf';
    if (name === 'cnpj') return 'document.cnpj';
    if (schema?.format === 'date') return 'date.iso';
    if (name === 'placa') return 'vehicle.plate';
    if (name === 'renavam') return 'vehicle.renavam';
    if (name === 'chassi') return 'vehicle.chassi';
    if (name === 'uf') return 'enum.uf';
    if (name === 'name' || name === 'nome') return 'string.name';

    return 'string.generic';
  }

  private getValidation(param: any): { pattern?: string; minLength?: number; maxLength?: number } | undefined {
    const type = this.inferType(param);
    const validation: any = {};

    if (type === 'document.cpf') {
      validation.pattern = '^\\d{11}$';
    } else if (type === 'document.cnpj') {
      validation.pattern = '^\\d{14}$';
    } else if (type === 'date.iso') {
      validation.pattern = '^\\d{4}-\\d{2}-\\d{2}$';
    } else if (type === 'vehicle.plate') {
      validation.pattern = '^[A-Z]{3}\\d{4}$';
    } else if (type === 'vehicle.renavam') {
      validation.pattern = '^\\d{11}$';
    }

    if (param.schema?.minLength) validation.minLength = param.schema.minLength;
    if (param.schema?.maxLength) validation.maxLength = param.schema.maxLength;

    return Object.keys(validation).length > 0 ? validation : undefined;
  }

  // Método utilitário para carregar YAML do arquivo
  static loadFromFile(filePath: string): ConsultaSchema[] {
    const yamlContent = fs.readFileSync(filePath, 'utf8');
    const parser = new OpenApiParser();
    return parser.parse(yamlContent);
  }

  // Alias para compatibilidade
  parseFromFile(filePath: string): ConsultaSchema[] {
    return OpenApiParser.loadFromFile(filePath);
  }
}