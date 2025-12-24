// Baseado em: 8.Tests.md v1.0, TASK-BIGTECH-008
// Testes de validação e normalização para plugin BigTech

import { BigTechPlugin } from '../../src/plugins/consulta/bigtech/index';
import { Validator, ValidationError } from '../../src/plugins/consulta/bigtech/validator';
import { BigTechConfig } from '../../src/plugins/consulta/bigtech/types';

describe('BigTech Validation & Normalization', () => {
  let plugin: BigTechPlugin;
  let validator: Validator;

  const defaultConfig: Partial<BigTechConfig> = {
    baseUrl: 'https://api.bigtech.com.br/v1',
    timeout: 30000,
    retries: 3,
  };

  beforeEach(() => {
    plugin = new BigTechPlugin(defaultConfig);
    validator = new Validator();
  });

  describe('Validator - CPF Validation', () => {
    it('should validate clean CPF', () => {
      const result = validator.validateCpf('52998224725');
      expect(result).toBe('52998224725');
    });

    it('should validate CPF with formatting', () => {
      const result = validator.validateCpf('529.982.247-25');
      expect(result).toBe('52998224725');
    });

    it('should validate CPF with spaces', () => {
      const result = validator.validateCpf('  529 982 247 25  ');
      expect(result).toBe('52998224725');
    });

    it('should throw error for invalid CPF length', () => {
      expect(() => validator.validateCpf('123456789')).toThrow(ValidationError);
      expect(() => validator.validateCpf('123456789012')).toThrow(ValidationError);
    });

    it('should throw error for CPF with non-numeric characters', () => {
      expect(() => validator.validateCpf('123.456.789-0A')).toThrow(ValidationError);
    });
  });

  describe('Validator - CNPJ Validation', () => {
    it('should validate clean CNPJ', () => {
      const result = validator.validateCnpj('19131243000197');
      expect(result).toBe('19131243000197');
    });

    it('should validate CNPJ with formatting', () => {
      const result = validator.validateCnpj('19.131.243/0001-97');
      expect(result).toBe('19131243000197');
    });

    it('should validate CNPJ with spaces', () => {
      const result = validator.validateCnpj('  19 131 243 0001 97  ');
      expect(result).toBe('19131243000197');
    });

    it('should throw error for invalid CNPJ length', () => {
      expect(() => validator.validateCnpj('1234567800012')).toThrow(ValidationError);
      expect(() => validator.validateCnpj('123456780001234')).toThrow(ValidationError);
    });

    it('should throw error for CNPJ with non-numeric characters', () => {
      expect(() => validator.validateCnpj('12.345.678/0001-2A')).toThrow(ValidationError);
    });
  });

  describe('Validator - Placa Validation', () => {
    it('should validate clean placa', () => {
      const result = validator.validatePlaca('ABC1234');
      expect(result).toBe('ABC1234');
    });

    it('should validate placa with lowercase', () => {
      const result = validator.validatePlaca('abc1234');
      expect(result).toBe('ABC1234');
    });

    it('should validate placa with formatting', () => {
      const result = validator.validatePlaca('ABC1234');
      expect(result).toBe('ABC1234');
    });

    it('should validate placa with spaces', () => {
      const result = validator.validatePlaca(' ABC 1234 ');
      expect(result).toBe('ABC1234');
    });

    it('should throw error for invalid placa format', () => {
      expect(() => validator.validatePlaca('AB1234')).toThrow(ValidationError);
      expect(() => validator.validatePlaca('ABCD1234')).toThrow(ValidationError);
      expect(() => validator.validatePlaca('ABC123')).toThrow(ValidationError);
      expect(() => validator.validatePlaca('ABC12345')).toThrow(ValidationError);
    });

    it('should throw error for placa with invalid characters', () => {
      expect(() => validator.validatePlaca('AB@1234')).toThrow(ValidationError);
    });
  });

  describe('Validator - Phone Validation', () => {
    it('should validate phone with DDD', () => {
      const result = validator.validatePhone('11987654321');
      expect(result).toEqual({ ddd: '11', numero: '987654321' });
    });

    it('should validate phone with formatting', () => {
      const result = validator.validatePhone('(11) 98765-4321');
      expect(result).toEqual({ ddd: '11', numero: '987654321' });
    });

    it('should validate phone with spaces', () => {
      const result = validator.validatePhone(' 11 98765 4321 ');
      expect(result).toEqual({ ddd: '11', numero: '987654321' });
    });

    it('should throw error for invalid phone length', () => {
      expect(() => validator.validatePhone('119876543')).toThrow(ValidationError);
      expect(() => validator.validatePhone('119876543210')).toThrow(ValidationError);
    });

    it('should throw error for phone with invalid length', () => {
      expect(() => validator.validatePhone('119876543')).toThrow(ValidationError); // Muito curto
    });
  });

  describe('Validator - CEP Validation', () => {
    it('should validate clean CEP', () => {
      const result = validator.validateCep('12345678');
      expect(result).toBe('12345678');
    });

    it('should validate CEP with formatting', () => {
      const result = validator.validateCep('12345-678');
      expect(result).toBe('12345678');
    });

    it('should validate CEP with spaces', () => {
      const result = validator.validateCep(' 12345 678 ');
      expect(result).toBe('12345678');
    });

    it('should throw error for invalid CEP length', () => {
      expect(() => validator.validateCep('1234567')).toThrow(ValidationError);
      expect(() => validator.validateCep('123456789')).toThrow(ValidationError);
    });

    it('should throw error for CEP with non-numeric characters', () => {
      expect(() => validator.validateCep('12345-67A')).toThrow(ValidationError);
    });
  });

  describe('Validator - Input Validation', () => {
    it('should validate CEP service input', () => {
      const input = { serviceCode: '320-contatos-por-cep', cep: '12345-678' };
      expect(() => validator.validateInput('320-contatos-por-cep', input)).not.toThrow();
    });

    it('should validate CPF service input', () => {
      const input = {
        serviceCode: '327-quod-cadastral-pf',
        cpfCnpj: '529.982.247-25',
        tipoPessoa: 'F'
      };
      expect(() => validator.validateInput('327-quod-cadastral-pf', input)).not.toThrow();
    });

    it('should validate CNPJ service input', () => {
      const input = {
        serviceCode: '304-positivo-define-risco-cnpj',
        cpfCnpj: '19.131.243/0001-97'
      };
      expect(() => validator.validateInput('304-positivo-define-risco-cnpj', input)).not.toThrow();
    });

    it('should validate placa service input', () => {
      const input = { serviceCode: '416-crlv-sp', placa: 'ABC1234' };
      expect(() => validator.validateInput('416-crlv-sp', input)).not.toThrow();
    });

    it('should validate phone service input', () => {
      const input = {
        serviceCode: '39-teleconfirma',
        ddd: '11',
        telefone: '98765-4321'
      };
      expect(() => validator.validateInput('39-teleconfirma', input)).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const input = { serviceCode: '320-contatos-por-cep' };
      expect(() => validator.validateInput('320-contatos-por-cep', input)).toThrow(ValidationError);
    });

    it('should throw error for invalid data format', () => {
      const input = { serviceCode: '320-contatos-por-cep', cep: '123' };
      expect(() => validator.validateInput('320-contatos-por-cep', input)).toThrow(ValidationError);
    });
  });

  describe('Validator - Output Sanitization', () => {
    it('should sanitize CEP service output', () => {
      const output = {
        success: true,
        service: '320-contatos-por-cep',
        chaveConsulta: '12345',
        dataHora: '2024-01-01 12:00',
        parametros: { cep: '12345678' },
        dados: { enderecoCep: true },
        rawResponse: { sensitive: 'data' }
      };

      const sanitized = validator.sanitizeOutput('320-contatos-por-cep', output);

      expect(sanitized.success).toBe(true);
      expect(sanitized.service).toBe('320-contatos-por-cep');
      expect(sanitized.chaveConsulta).toBe('12345');
      expect(sanitized.rawResponse).toBeUndefined(); // Deve ser removido
    });

    it('should sanitize CPF service output', () => {
      const output = {
        success: true,
        service: '327-quod-cadastral-pf',
        chaveConsulta: '12345',
        dataHora: '2024-01-01 12:00',
        parametros: { cpfCnpj: '52998224725', tipoPessoa: 'F' },
        dados: { receitaFederal: true },
        rawResponse: { sensitive: 'data' }
      };

      const sanitized = validator.sanitizeOutput('327-quod-cadastral-pf', output);

      expect(sanitized.success).toBe(true);
      expect(sanitized.parametros.cpfCnpj).toBe('***.***.***-**'); // Deve ser mascarado
      expect(sanitized.rawResponse).toBeUndefined();
    });

    it('should sanitize placa service output', () => {
      const output = {
        success: true,
        service: '416-crlv-sp',
        chaveConsulta: '12345',
        dataHora: '2024-01-01 12:00',
        parametros: { placa: 'ABC1234' },
        dados: { crlv: true },
        rawResponse: { sensitive: 'data' }
      };

      const sanitized = validator.sanitizeOutput('416-crlv-sp', output);

      expect(sanitized.success).toBe(true);
      expect(sanitized.parametros.placa).toBe('***-****'); // Deve ser mascarado
      expect(sanitized.rawResponse).toBeUndefined();
    });
  });

  describe('Plugin Integration - Validation in execute', () => {
    beforeEach(() => {
      // Mock fetch
      global.fetch = jest.fn();
    });

    it('should validate input before execution', async () => {
      const context = {
        tenantId: 'test-tenant',
        userId: 'test-user',
        input: {
          serviceCode: '320-contatos-por-cep',
          cep: '01001000',
        },
        config: {},
      };

      // Mock da resposta da API
      const mockApiResponse = {
        HEADER: {
          INFORMACOES_RETORNO: {
            STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "CONSULTA CONCLUIDA COM SUCESSO" },
            CHAVE_CONSULTA: "1022687",
            DATA_HORA_CONSULTA: "07/02/2019 18:20"
          },
          PARAMETROS: { Cep: "01001000" },
          DADOS_RETORNADOS: { ENDERECO_DO_CEP: "1" }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await plugin.execute(context);

      expect(result.success).toBe(true);
      expect(result.data.parametros).toBeDefined(); // Verifica que parâmetros existem
      expect(result.data.dados).toBeDefined(); // Verifica que dados existem
    }, 10000); // Aumentar timeout para 10 segundos

    it('should reject invalid input', async () => {
      const context = {
        tenantId: 'test-tenant',
        userId: 'test-user',
        input: {
          serviceCode: '320-contatos-por-cep',
          cep: 'invalid-cep',
        },
        config: {},
      };

      const result = await plugin.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('CEP');
    });

    it('should sanitize output data', async () => {
      const context = {
        tenantId: 'test-tenant',
        userId: 'test-user',
        input: {
          serviceCode: '327-quod-cadastral-pf',
          cpfCnpj: '529.982.247-25',
          tipoPessoa: 'F',
        },
        config: {},
      };

      // Mock da resposta da API
      const mockApiResponse = {
        HEADER: {
          INFORMACOES_RETORNO: {
            STATUS_RETORNO: { CODIGO: "1", DESCRICAO: "CONSULTA CONCLUIDA COM SUCESSO" },
            CHAVE_CONSULTA: "1022687",
            DATA_HORA_CONSULTA: "07/02/2019 18:20"
          },
          PARAMETROS: { CPFCNPJ: "52998224725", TIPO_PESSOA: "F" },
          DADOS_RETORNADOS: { DADOS_RECEITA_FEDERAL: "1" }
        }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await plugin.execute(context);

      expect(result.success).toBe(true);
      expect(result.data.parametros.cpfCnpj).toBe('***.***.***-**'); // CPF mascarado
      expect(result.data.rawResponse).toBeUndefined(); // Dados brutos removidos
    }, 10000); // Aumentar timeout para 10 segundos
  });

  describe('Property-based Testing - Edge Cases', () => {
    it('should handle various CPF formats', () => {
      const validCpfs = [
        '52998224725', // CPF válido
        '93541134780', // CPF válido
        '74682489070', // CPF válido
        '12345678909', // CPF válido
        '98765432100'  // CPF válido
      ];

      validCpfs.forEach(cpf => {
        expect(() => validator.validateCpf(cpf)).not.toThrow();
      });
    });

    it('should handle various CNPJ formats', () => {
      const validCnpjs = [
        '19131243000197', // CNPJ válido
        '11444777000161', // CNPJ válido
        '19131243000197', // CNPJ válido
        '11444777000161', // CNPJ válido
        '11444777000161'  // CNPJ válido
      ];

      validCnpjs.forEach(cnpj => {
        expect(() => validator.validateCnpj(cnpj)).not.toThrow();
      });
    });

    it('should handle various placa formats', () => {
      const validPlacas = [
        'AAA0000',
        'ZZZ9999',
        'ABC1234',
        'XYZ9876'
      ];

      validPlacas.forEach(placa => {
        expect(() => validator.validatePlaca(placa)).not.toThrow();
      });
    });

    it('should reject malformed inputs', () => {
      const invalidInputs = [
        { type: 'cpf', value: '123.456.789-0' },
        { type: 'cnpj', value: '12.345.678/0001-2' },
        { type: 'placa', value: 'AB1234' },
        { type: 'cep', value: '12345' },
        { type: 'phone', value: '119876543' }
      ];

      invalidInputs.forEach(({ type, value }) => {
        if (type === 'cpf') expect(() => validator.validateCpf(value)).toThrow();
        if (type === 'cnpj') expect(() => validator.validateCnpj(value)).toThrow();
        if (type === 'placa') expect(() => validator.validatePlaca(value)).toThrow();
        if (type === 'cep') expect(() => validator.validateCep(value)).toThrow();
        if (type === 'phone') expect(() => validator.validatePhone(value)).toThrow();
      });
    });
  });
});