import { BigTechDataValidator } from '../src/plugins/consulta/bigtech/validator';

describe('BigTechDataValidator', () => {
  describe('validateAndNormalizeCPF', () => {
    it('should validate and normalize valid CPF', () => {
      const result = BigTechDataValidator.validateAndNormalizeCPF('09469124677');
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('09469124677');
    });

    it('should reject invalid CPF', () => {
      const result = BigTechDataValidator.validateAndNormalizeCPF('12345678901');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('CPF inválido');
    });

    it('should handle CPF with formatting', () => {
      const result = BigTechDataValidator.validateAndNormalizeCPF('094.691.246-77');
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('09469124677');
    });
  });

  describe('validateAndNormalizeCNPJ', () => {
    it('should validate and normalize valid CNPJ', () => {
      const result = BigTechDataValidator.validateAndNormalizeCNPJ('51072961000142');
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('51072961000142');
    });

    it('should reject invalid CNPJ', () => {
      const result = BigTechDataValidator.validateAndNormalizeCNPJ('12345678000123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('CNPJ inválido');
    });
  });

  describe('validateServiceInput', () => {
    it('should validate CPF input for pessoa física service', () => {
      const input = {
        cpfCnpj: '09469124677',
        tipoPessoa: 'F'
      };
      const result = BigTechDataValidator.validateServiceInput('11-serasa-consumidor', input);
      expect(result.isValid).toBe(true);
    });

    it('should validate CNPJ input for pessoa jurídica service', () => {
      const input = {
        cpfCnpj: '51072961000142',
        uf: 'SP',
        tipoPessoa: 'J'
      };
      const result = BigTechDataValidator.validateServiceInput('1003-serasa-empresarial', input);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid input', () => {
      const input = {
        cpfCnpj: 'invalid',
        tipoPessoa: 'F'
      };
      const result = BigTechDataValidator.validateServiceInput('11-serasa-consumidor', input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('CPF inválido');
    });
  });
});</content>
