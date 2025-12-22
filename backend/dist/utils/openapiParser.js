"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenApiParser = void 0;
const yaml = __importStar(require("js-yaml"));
const fs = __importStar(require("fs"));
class OpenApiParser {
    parse(yamlContent) {
        const spec = yaml.load(yamlContent);
        const schemas = [];
        for (const [path, methods] of Object.entries(spec.paths)) {
            // Normalizar nomes dos métodos (remover dois pontos se houver)
            const normalizedMethods = Object.fromEntries(Object.entries(methods).map(([method, spec]) => [
                method.startsWith(':') ? method.slice(1) : method,
                spec
            ]));
            if (normalizedMethods.post && path.startsWith('/consultas/')) {
                const schema = this.buildSchema(path, normalizedMethods.post);
                schemas.push(schema);
            }
        }
        return schemas;
    }
    buildSchema(path, postSpec) {
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
    extractFields(parameters) {
        return parameters
            .filter(p => p.in === 'query' || p[':in'] === 'query')
            .filter(p => !['token', 'timeout'].includes(p.name || p[':name']))
            .map(p => {
            // Normalizar parâmetro (remover dois pontos se houver)
            const normalizedParam = Object.fromEntries(Object.entries(p).map(([key, value]) => [
                key.startsWith(':') ? key.slice(1) : key,
                value
            ]));
            return {
                name: normalizedParam.name,
                type: this.inferType(normalizedParam),
                required: normalizedParam.required || false,
                label: normalizedParam.description || normalizedParam.name,
                validation: this.getValidation(normalizedParam)
            };
        });
    }
    inferType(param) {
        const name = param.name;
        const schema = param.schema;
        if (name === 'cpf')
            return 'document.cpf';
        if (name === 'cnpj')
            return 'document.cnpj';
        if (schema?.format === 'date')
            return 'date.iso';
        if (name === 'placa')
            return 'vehicle.plate';
        if (name === 'renavam')
            return 'vehicle.renavam';
        if (name === 'chassi')
            return 'vehicle.chassi';
        if (name === 'uf')
            return 'enum.uf';
        if (name === 'name' || name === 'nome')
            return 'string.name';
        return 'string.generic';
    }
    getValidation(param) {
        const type = this.inferType(param);
        const validation = {};
        if (type === 'document.cpf') {
            validation.pattern = '^\\d{11}$';
        }
        else if (type === 'document.cnpj') {
            validation.pattern = '^\\d{14}$';
        }
        else if (type === 'date.iso') {
            validation.pattern = '^\\d{4}-\\d{2}-\\d{2}$';
        }
        else if (type === 'vehicle.plate') {
            validation.pattern = '^[A-Z]{3}\\d{4}$';
        }
        else if (type === 'vehicle.renavam') {
            validation.pattern = '^\\d{11}$';
        }
        if (param.schema?.minLength)
            validation.minLength = param.schema.minLength;
        if (param.schema?.maxLength)
            validation.maxLength = param.schema.maxLength;
        return Object.keys(validation).length > 0 ? validation : undefined;
    }
    // Método utilitário para carregar YAML do arquivo
    static loadFromFile(filePath) {
        const yamlContent = fs.readFileSync(filePath, 'utf8');
        const parser = new OpenApiParser();
        return parser.parse(yamlContent);
    }
    // Alias para compatibilidade
    parseFromFile(filePath) {
        return OpenApiParser.loadFromFile(filePath);
    }
}
exports.OpenApiParser = OpenApiParser;
//# sourceMappingURL=openapiParser.js.map