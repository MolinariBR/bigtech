// Baseado em: 4.Entities.md v1.7, Docs/APIServicosSelecionados.md
// Configurações para plugin BigTech

import { BigTechConfig, BigTechServiceValidation, BigTechValidationRule, BigTechProviderConfig } from './types';

export const defaultConfig: BigTechConfig = {
  baseUrl: 'https://api.consultasbigtech.com.br/json/service.aspx',
  homologationUrl: 'https://api.consultasbigtech.com.br/json/homologa.aspx',
  useHomologation: false, // false = produção, true = homologação
  timeout: 30000, // 30 segundos
  retries: 3, // Aumentar retries para lidar com rate limiting
  retryDelayMs: 5000, // Aumentar delay base entre retries
  fallbackSources: ['internal'], // Fontes de fallback (provedores internos)
  rateLimitPerMinute: 10, // Limitar a 10 requisições por minuto
  rateLimitWindowMs: 60000, // Janela de 1 minuto para rate limiting
  minRequestInterval: 6000, // Mínimo 6 segundos entre requisições
};

// Mapeamento de códigos para endpoints BigTech
// Baseado na documentação dos arquivos .md
export const bigTechServices = {
  // Cadastral
  '320-contatos-por-cep': '/consultas/cadastral/contatos-cep',
  '327-quod-cadastral-pf': '/consultas/cadastral/quod-pf',
  '424-validid-localizacao': '/consultas/cadastral/validid-localizacao',
  '431-dados-cnh': '/consultas/cadastral/dados-cnh',

  // Crédito
  '36-busca-nome-uf': '/consultas/credito/busca-nome-uf',
  '39-teleconfirma': '/consultas/credito/teleconfirma',
  '41-protesto-sintetico-nacional': '/consultas/credito/protesto-sintetico',
  '304-positivo-define-risco-cnpj': '/consultas/credito/positivo-risco-cnpj',
  'positivo-acerta-essencial-pf': '/consultas/credito/positivo-essencial-pf',
  '1539-bvs-basica-pf': '/consultas/credito/bvs-basica-pf',
  '11-bvs-basica-pj': '/consultas/credito/bvs-basica-pj',
  '1003-scr-premium-integracoes': '/consultas/credito/scr-premium-integracoes',

  // Veículo
  '411-crlv-ro': '/consultas/veicular/crlv-ro',
  '412-crlv-rr': '/consultas/veicular/crlv-rr',
  '415-crlv-se': '/consultas/veicular/crlv-se',
  '416-crlv-sp': '/consultas/veicular/crlv-sp',
};

// Mapeamento de códigos de produto da API BigTech
export const bigTechProductCodes = {
  // Cadastral
  '320-contatos-por-cep': '1465',
  '327-quod-cadastral-pf': '1448',
  '424-validid-localizacao': '1508',
  '431-dados-cnh': '1452',

  // Crédito
  '36-busca-nome-uf': '1449',
  '39-teleconfirma': '1450',
  '41-protesto-sintetico-nacional': '1451',
  '304-positivo-define-risco-cnpj': '1518',
  'positivo-acerta-essencial-pf': '1519',
  '1539-bvs-basica-pf': '1539',
  '11-bvs-basica-pj': '11',
  '1003-scr-premium-integracoes': '1003',

  // Veículo
  '411-crlv-ro': '1527',
  '412-crlv-rr': '1528',
  '415-crlv-se': '1531',
  '416-crlv-sp': '1532',
};

// Mapeamento de categorias
export const serviceCategories = {
  // Cadastral
  '320-contatos-por-cep': 'cadastral',
  '327-quod-cadastral-pf': 'cadastral',
  '424-validid-localizacao': 'cadastral',
  '431-dados-cnh': 'cadastral',

  // Crédito
  '36-busca-nome-uf': 'credito',
  '39-teleconfirma': 'credito',
  '41-protesto-sintetico-nacional': 'credito',
  '304-positivo-define-risco-cnpj': 'credito',
  'positivo-acerta-essencial-pf': 'credito',
  '1539-bvs-basica-pf': 'credito',
  '11-bvs-basica-pj': 'credito',
  '1003-scr-premium-integracoes': 'credito',

  // Veículo
  '411-crlv-ro': 'veicular',
  '412-crlv-rr': 'veicular',
  '415-crlv-se': 'veicular',
  '416-crlv-sp': 'veicular',
};

// Preços por serviço (baseado em 9.paginas.md)
export const servicePrices = {
  // Cadastral - R$ 1.00 cada
  cadastral: 1.00,

  // Crédito - R$ 1.80 cada
  credito: 1.80,

  // Veículo - R$ 3.00 cada
  veicular: 3.00,
};

// Regras de validação por serviço
export const serviceValidations: BigTechServiceValidation = {
  // Cadastral
  '320-contatos-por-cep': [
    {
      field: 'cep',
      type: 'cep',
      required: true,
      pattern: /^\d{8}$/,
      customValidator: (value: string) => value.replace(/\D/g, '').length === 8
    }
  ],
  '327-quod-cadastral-pf': [
    {
      field: 'cpf',
      type: 'cpf',
      required: true,
      pattern: /^\d{11}$/,
      customValidator: (value: string) => {
        const cpf = value.replace(/\D/g, '');
        if (cpf.length !== 11) return false;
        // Validação de CPF básica
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
          sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        return remainder === parseInt(cpf.charAt(10));
      }
    }
  ],
  '424-validid-localizacao': [
    {
      field: 'id',
      type: 'cpf',
      required: true,
      minLength: 11,
      maxLength: 14
    }
  ],
  '431-dados-cnh': [
    {
      field: 'cnh',
      type: 'cnh',
      required: true,
      minLength: 11,
      maxLength: 11,
      pattern: /^\d{11}$/
    }
  ],

  // Crédito
  '36-busca-nome-uf': [
    {
      field: 'nome',
      type: 'nome',
      required: true,
      minLength: 3,
      maxLength: 100
    },
    {
      field: 'uf',
      type: 'uf',
      required: true,
      pattern: /^[A-Z]{2}$/,
      customValidator: (value: string) => {
        const validStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
        return validStates.includes(value.toUpperCase());
      }
    }
  ],
  '39-teleconfirma': [
    {
      field: 'telefone',
      type: 'telefone',
      required: true,
      pattern: /^\d{10,11}$/
    }
  ],
  '41-protesto-sintetico-nacional': [
    {
      field: 'cpf',
      type: 'cpf',
      required: false
    },
    {
      field: 'cnpj',
      type: 'cnpj',
      required: false,
      customValidator: (value: string) => {
        const cnpj = value.replace(/\D/g, '');
        if (cnpj.length !== 14) return false;
        // Validação de CNPJ básica
        let sum = 0;
        let multiplier = 5;
        for (let i = 0; i < 12; i++) {
          sum += parseInt(cnpj.charAt(i)) * multiplier;
          multiplier = multiplier === 2 ? 9 : multiplier - 1;
        }
        let remainder = sum % 11;
        if (remainder < 2) remainder = 0;
        else remainder = 11 - remainder;
        if (remainder !== parseInt(cnpj.charAt(12))) return false;

        sum = 0;
        multiplier = 6;
        for (let i = 0; i < 13; i++) {
          sum += parseInt(cnpj.charAt(i)) * multiplier;
          multiplier = multiplier === 2 ? 9 : multiplier - 1;
        }
        remainder = sum % 11;
        if (remainder < 2) remainder = 0;
        else remainder = 11 - remainder;
        return remainder === parseInt(cnpj.charAt(13));
      }
    }
  ],
  '304-positivo-define-risco-cnpj': [
    {
      field: 'cnpj',
      type: 'cnpj',
      required: true
    }
  ],
  'positivo-acerta-essencial-pf': [
    {
      field: 'cpf',
      type: 'cpf',
      required: true
    }
  ],
  '1539-bvs-basica-pf': [
    {
      field: 'cpf',
      type: 'cpf',
      required: true
    }
  ],
  '11-bvs-basica-pj': [
    {
      field: 'cnpj',
      type: 'cnpj',
      required: true,
      customValidator: (value: string) => {
        const cnpj = value.replace(/\D/g, '');
        if (cnpj.length !== 14) return false;
        // Validação de CNPJ básica
        let sum = 0;
        let multiplier = 5;
        for (let i = 0; i < 12; i++) {
          sum += parseInt(cnpj.charAt(i)) * multiplier;
          multiplier = multiplier === 2 ? 9 : multiplier - 1;
        }
        let remainder = sum % 11;
        if (remainder < 2) remainder = 0;
        else remainder = 11 - remainder;
        if (remainder !== parseInt(cnpj.charAt(12))) return false;

        sum = 0;
        multiplier = 6;
        for (let i = 0; i < 13; i++) {
          sum += parseInt(cnpj.charAt(i)) * multiplier;
          multiplier = multiplier === 2 ? 9 : multiplier - 1;
        }
        remainder = sum % 11;
        if (remainder < 2) remainder = 0;
        else remainder = 11 - remainder;
        return remainder === parseInt(cnpj.charAt(13));
      }
    }
  ],
  '1003-scr-premium-integracoes': [
    {
      field: 'cpfCnpj',
      type: 'cpf', // Usando 'cpf' como base, mas validação customizada aceitará ambos
      required: true,
      customValidator: (value: string) => {
        const documento = value.replace(/\D/g, '');
        if (documento.length === 11) {
          // Validação de CPF
          let sum = 0;
          for (let i = 0; i < 9; i++) {
            sum += parseInt(documento.charAt(i)) * (10 - i);
          }
          let remainder = (sum * 10) % 11;
          if (remainder === 10 || remainder === 11) remainder = 0;
          if (remainder !== parseInt(documento.charAt(9))) return false;

          sum = 0;
          for (let i = 0; i < 10; i++) {
            sum += parseInt(documento.charAt(i)) * (11 - i);
          }
          remainder = (sum * 10) % 11;
          if (remainder === 10 || remainder === 11) remainder = 0;
          return remainder === parseInt(documento.charAt(10));
        } else if (documento.length === 14) {
          // Validação de CNPJ
          let sum = 0;
          let multiplier = 5;
          for (let i = 0; i < 12; i++) {
            sum += parseInt(documento.charAt(i)) * multiplier;
            multiplier = multiplier === 2 ? 9 : multiplier - 1;
          }
          let remainder = sum % 11;
          if (remainder < 2) remainder = 0;
          else remainder = 11 - remainder;
          if (remainder !== parseInt(documento.charAt(12))) return false;

          sum = 0;
          multiplier = 6;
          for (let i = 0; i < 13; i++) {
            sum += parseInt(documento.charAt(i)) * multiplier;
            multiplier = multiplier === 2 ? 9 : multiplier - 1;
          }
          remainder = sum % 11;
          if (remainder < 2) remainder = 0;
          else remainder = 11 - remainder;
          return remainder === parseInt(documento.charAt(13));
        }
        return false;
      }
    }
  ],

  // Veículo
  '411-crlv-ro': [
    {
      field: 'placa',
      type: 'placa',
      required: true,
      pattern: /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d{1}[A-Z]{1}\d{2}$/,
      customValidator: (value: string) => {
        const placa = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        return placa.length === 7 && /^[A-Z]{3}[0-9]{4}$/.test(placa);
      }
    }
  ],
  '412-crlv-rr': [
    {
      field: 'placa',
      type: 'placa',
      required: true,
      pattern: /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d{1}[A-Z]{1}\d{2}$/
    }
  ],
  '415-crlv-se': [
    {
      field: 'placa',
      type: 'placa',
      required: true,
      pattern: /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d{1}[A-Z]{1}\d{2}$/
    }
  ],
  '416-crlv-sp': [
    {
      field: 'placa',
      type: 'placa',
      required: true,
      pattern: /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d{1}[A-Z]{1}\d{2}$/
    }
  ]
};

// Configurações específicas por provedor
export const providerConfigs: Record<string, BigTechProviderConfig> = {
  bigtech: {
    name: 'BigTech Consultas',
    baseUrl: 'https://api.consultasbigtech.com.br/json/service.aspx',
    timeout: 30000,
    retries: 3,
    rateLimit: 10,
    supportedServices: Object.keys(bigTechServices)
  }
};

// Configurações de cache
export const cacheConfig = {
  defaultTtl: 3600000, // 1 hora em ms
  maxSize: 1000, // Máximo de entradas no cache
  serviceSpecificTtl: {
    '320-contatos-por-cep': 86400000, // 24 horas
    '36-busca-nome-uf': 3600000, // 1 hora
    '411-crlv-ro': 1800000 // 30 minutos
  }
};

// Configurações de rate limiting por serviço
export const rateLimitConfig = {
  default: {
    requests: 10,
    windowMs: 60000 // 1 minuto
  },
  serviceSpecific: {
    '320-contatos-por-cep': { requests: 5, windowMs: 60000 },
    '36-busca-nome-uf': { requests: 3, windowMs: 60000 },
    '411-crlv-ro': { requests: 2, windowMs: 60000 }
  }
};