// Baseado em: 4.Entities.md v1.7, 8.Tests.md
// Módulo de validação e normalização para plugin BigTech
// Implementa validação robusta, normalização e sanitização de dados

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class Validator {
  /**
   * Valida CPF
   */
  validateCpf(cpf: string): string {
    const result = BigTechDataValidator.validateAndNormalizeCPF(cpf);
    if (!result.isValid) {
      throw new ValidationError(result.error || 'CPF inválido', 'cpf');
    }
    return result.normalized;
  }

  /**
   * Valida CNPJ
   */
  validateCnpj(cnpj: string): string {
    const result = BigTechDataValidator.validateAndNormalizeCNPJ(cnpj);
    if (!result.isValid) {
      throw new ValidationError(result.error || 'CNPJ inválido', 'cnpj');
    }
    return result.normalized;
  }

  /**
   * Valida placa
   */
  validatePlaca(placa: string): string {
    const result = BigTechDataValidator.validateAndNormalizePlaca(placa);
    if (!result.isValid) {
      throw new ValidationError(result.error || 'Placa inválida', 'placa');
    }
    return result.normalized;
  }

  /**
   * Valida telefone
   */
  validatePhone(phone: string): { ddd: string; numero: string } {
    const result = BigTechDataValidator.validateAndNormalizeTelefone(phone);
    if (!result.isValid) {
      throw new ValidationError(result.error || 'Telefone inválido', 'phone');
    }
    const normalized = result.normalized;
    return {
      ddd: normalized.substring(0, 2),
      numero: normalized.substring(2)
    };
  }

  /**
   * Valida CEP
   */
  validateCep(cep: string): string {
    const result = BigTechDataValidator.validateAndNormalizeCEP(cep);
    if (!result.isValid) {
      throw new ValidationError(result.error || 'CEP inválido', 'cep');
    }
    return result.normalized;
  }

  /**
   * Valida entrada baseada no serviço
   */
  validateInput(serviceCode: string, input: any): void {
    const result = BigTechDataValidator.validateServiceInput(serviceCode, input);
    if (!result.isValid) {
      throw new ValidationError(result.errors.join(', '), 'input');
    }
  }

  /**
   * Normaliza saída
   */
  normalizeOutput(serviceCode: string, data: any): any {
    return BigTechDataValidator.normalizeOutput(data, serviceCode);
  }

  /**
   * Sanitiza saída
   */
  sanitizeOutput(serviceCode: string, data: any): any {
    let sanitized = BigTechDataValidator.sanitizeSensitiveData(data);

    // Regras específicas por serviço
    switch (serviceCode) {
      case '320-contatos-por-cep':
        // Remove rawResponse para serviços de CEP
        delete sanitized.rawResponse;
        break;

      case '327-quod-cadastral-pf':
      case '431-dados-cnh':
        // Mascara CPF/CNPJ nos parâmetros
        if (sanitized.parametros?.cpfCnpj) {
          sanitized.parametros.cpfCnpj = '***.***.***-**';
        }
        if (sanitized.parametros?.cpf) {
          sanitized.parametros.cpf = '***.***.***-**';
        }
        delete sanitized.rawResponse;
        break;

      case '411-crlv-ro':
      case '412-crlv-rr':
      case '415-crlv-se':
      case '416-crlv-sp':
        // Mascara placa nos parâmetros
        if (sanitized.parametros?.placa) {
          sanitized.parametros.placa = '***-****';
        }
        delete sanitized.rawResponse;
        break;

      default:
        delete sanitized.rawResponse;
    }

    return sanitized;
  }
}

export class BigTechDataValidator {
  /**
   * Valida e normaliza CPF
   */
  static validateAndNormalizeCPF(cpf: string): { isValid: boolean; normalized: string; error?: string } {
    try {
      // Remove todos os caracteres não numéricos
      const cleaned = cpf.replace(/\D/g, '');

      // Verifica se tem exatamente 11 dígitos
      if (cleaned.length !== 11) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'CPF deve ter exatamente 11 dígitos'
        };
      }

      // Verifica se não é uma sequência de números iguais
      if (/^(\d)\1{10}$/.test(cleaned)) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'CPF inválido (sequência de números iguais)'
        };
      }

      // Calcula e verifica os dígitos verificadores
      const digits = cleaned.split('').map(Number);

      // Primeiro dígito verificador
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += digits[i] * (10 - i);
      }
      let remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== digits[9]) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'CPF inválido (primeiro dígito verificador)'
        };
      }

      // Segundo dígito verificador
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += digits[i] * (11 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== digits[10]) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'CPF inválido (segundo dígito verificador)'
        };
      }

      return {
        isValid: true,
        normalized: cleaned
      };
    } catch (error) {
      return {
        isValid: false,
        normalized: cpf.replace(/\D/g, ''),
        error: 'Erro na validação do CPF'
      };
    }
  }

  /**
   * Valida e normaliza CNPJ
   */
  static validateAndNormalizeCNPJ(cnpj: string): { isValid: boolean; normalized: string; error?: string } {
    try {
      // Remove todos os caracteres não numéricos
      const cleaned = cnpj.replace(/\D/g, '');

      // Verifica se tem exatamente 14 dígitos
      if (cleaned.length !== 14) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'CNPJ deve ter exatamente 14 dígitos'
        };
      }

      // Verifica se não é uma sequência de números iguais
      if (/^(\d)\1{13}$/.test(cleaned)) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'CNPJ inválido (sequência de números iguais)'
        };
      }

      // Calcula e verifica os dígitos verificadores
      const digits = cleaned.split('').map(Number);

      // Primeiro dígito verificador
      let sum = 0;
      let multiplier = 5;
      for (let i = 0; i < 12; i++) {
        sum += digits[i] * multiplier;
        multiplier = multiplier === 2 ? 9 : multiplier - 1;
      }
      let remainder = sum % 11;
      if (remainder < 2) remainder = 0;
      else remainder = 11 - remainder;
      if (remainder !== digits[12]) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'CNPJ inválido (primeiro dígito verificador)'
        };
      }

      // Segundo dígito verificador
      sum = 0;
      multiplier = 6;
      for (let i = 0; i < 13; i++) {
        sum += digits[i] * multiplier;
        multiplier = multiplier === 2 ? 9 : multiplier - 1;
      }
      remainder = sum % 11;
      if (remainder < 2) remainder = 0;
      else remainder = 11 - remainder;
      if (remainder !== digits[13]) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'CNPJ inválido (segundo dígito verificador)'
        };
      }

      return {
        isValid: true,
        normalized: cleaned
      };
    } catch (error) {
      return {
        isValid: false,
        normalized: cnpj.replace(/\D/g, ''),
        error: 'Erro na validação do CNPJ'
      };
    }
  }

  /**
   * Valida e normaliza placa de veículo
   */
  static validateAndNormalizePlaca(placa: string): { isValid: boolean; normalized: string; error?: string } {
    try {
      // Remove espaços e converte para maiúsculo
      const cleaned = placa.replace(/\s/g, '').toUpperCase();

      // Padrões aceitos:
      // AAA9999 (padrão antigo)
      // AAA9A99 (Mercosul)
      const placaRegex = /^[A-Z]{3}[0-9]{4}$|^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;

      if (!placaRegex.test(cleaned)) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'Formato de placa inválido. Use AAA9999 ou AAA9A99'
        };
      }

      // Verifica se não tem caracteres inválidos
      if (!/^[A-Z0-9]+$/.test(cleaned)) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'Placa contém caracteres inválidos'
        };
      }

      return {
        isValid: true,
        normalized: cleaned
      };
    } catch (error) {
      return {
        isValid: false,
        normalized: placa.replace(/\s/g, '').toUpperCase(),
        error: 'Erro na validação da placa'
      };
    }
  }

  /**
   * Valida e normaliza CEP
   */
  static validateAndNormalizeCEP(cep: string): { isValid: boolean; normalized: string; error?: string } {
    try {
      // Remove todos os caracteres não numéricos
      const cleaned = cep.replace(/\D/g, '');

      // Verifica se tem exatamente 8 dígitos
      if (cleaned.length !== 8) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'CEP deve ter exatamente 8 dígitos'
        };
      }

      return {
        isValid: true,
        normalized: cleaned
      };
    } catch (error) {
      return {
        isValid: false,
        normalized: cep.replace(/\D/g, ''),
        error: 'Erro na validação do CEP'
      };
    }
  }

  /**
   * Valida e normaliza telefone
   */
  static validateAndNormalizeTelefone(telefone: string): { isValid: boolean; normalized: string; error?: string } {
    try {
      // Remove todos os caracteres não numéricos
      const cleaned = telefone.replace(/\D/g, '');

      // Verifica se tem entre 10 e 11 dígitos (DDD + número)
      if (cleaned.length < 10 || cleaned.length > 11) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'Telefone deve ter 10 ou 11 dígitos (DDD + número)'
        };
      }

      // Verifica se começa com dígito válido de DDD (1-9)
      const ddd = parseInt(cleaned.substring(0, 2));
      if (ddd < 11 || ddd > 99) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'DDD inválido'
        };
      }

      return {
        isValid: true,
        normalized: cleaned
      };
    } catch (error) {
      return {
        isValid: false,
        normalized: telefone.replace(/\D/g, ''),
        error: 'Erro na validação do telefone'
      };
    }
  }

  /**
   * Valida e normaliza UF
   */
  static validateAndNormalizeUF(uf: string): { isValid: boolean; normalized: string; error?: string } {
    try {
      const normalized = uf.toUpperCase().trim();

      const validStates = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
      ];

      if (!validStates.includes(normalized)) {
        return {
          isValid: false,
          normalized,
          error: 'UF inválida. Deve ser uma das 27 unidades federativas'
        };
      }

      return {
        isValid: true,
        normalized
      };
    } catch (error) {
      return {
        isValid: false,
        normalized: uf.toUpperCase().trim(),
        error: 'Erro na validação da UF'
      };
    }
  }

  /**
   * Valida e normaliza CNH
   */
  static validateAndNormalizeCNH(cnh: string): { isValid: boolean; normalized: string; error?: string } {
    try {
      // Remove todos os caracteres não numéricos
      const cleaned = cnh.replace(/\D/g, '');

      // Verifica se tem exatamente 11 dígitos
      if (cleaned.length !== 11) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'CNH deve ter exatamente 11 dígitos'
        };
      }

      // Algoritmo de validação da CNH (simplificado)
      // CNH válida se passar na validação do DETRAN
      const digits = cleaned.split('').map(Number);

      // Verificações básicas
      if (digits.every((d: number) => d === digits[0])) {
        return {
          isValid: false,
          normalized: cleaned,
          error: 'CNH inválida (sequência de números iguais)'
        };
      }

      return {
        isValid: true,
        normalized: cleaned
      };
    } catch (error) {
      return {
        isValid: false,
        normalized: cnh.replace(/\D/g, ''),
        error: 'Erro na validação da CNH'
      };
    }
  }

  /**
   * Sanitiza dados sensíveis (remove ou mascara informações pessoais)
   */
  static sanitizeSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };

    // Campos que devem ser completamente removidos
    const fieldsToRemove = [
      'senha', 'password', 'token', 'apiKey', 'secret',
      'authorization', 'bearer', 'auth'
    ];

    // Campos que devem ser mascarados (exceto nos parâmetros de entrada)
    const fieldsToMask = [
      'cpf', 'cnpj', 'rg', 'cnh', 'telefone', 'celular',
      'email', 'endereco', 'cep'
    ];

    // Remove campos sensíveis
    fieldsToRemove.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });

    // Mascara campos sensíveis, mas não nos parâmetros de entrada
    const maskFields = (obj: any, path: string[] = []) => {
      if (!obj || typeof obj !== 'object') {
        return;
      }

      Object.keys(obj).forEach(key => {
        const currentPath = [...path, key];

        // Não mascara campos dentro de 'parametros' (parâmetros de entrada)
        if (currentPath.includes('parametros')) {
          return;
        }

        if (fieldsToMask.includes(key) && obj[key]) {
          const value = String(obj[key]);
          if (value.length > 4) {
            obj[key] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
          } else {
            obj[key] = '*'.repeat(value.length);
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          maskFields(obj[key], currentPath);
        }
      });
    };

    maskFields(sanitized);

    return sanitized;
  }

  /**
   * Normaliza formato de saída para consistência
   */
  static normalizeOutput(data: any, serviceCode: string): any {
    const normalized = { ...data };

    // Adiciona metadados padronizados
    normalized._metadata = {
      serviceCode,
      normalizedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    // Padroniza campos de data (verificar validade antes de toISOString)
    if (normalized.dataHora) {
      try {
        const parsed = new Date(normalized.dataHora);
        if (!isNaN(parsed.getTime())) {
          normalized.dataHora = parsed.toISOString();
        } else {
          // Se a data for inválida, remover o campo para evitar erros posteriores
          delete normalized.dataHora;
        }
      } catch (e) {
        delete normalized.dataHora;
      }
    }

    // Padroniza campos booleanos
    const booleanFields = ['enderecoCep', 'contatos', 'telefones', 'emails', 'residentes', 'vizinhos'];
    booleanFields.forEach(field => {
      if (typeof normalized[field] === 'string') {
        normalized[field] = normalized[field] === '1';
      }
    });

    // Padroniza campos de telefone
    if (normalized.telefones) {
      normalized.telefones = {
        fixo: normalized.telefones.fixo === '1' || normalized.telefones.fixo === true,
        celular: normalized.telefones.celular === '1' || normalized.telefones.celular === true,
        comercial: normalized.telefones.comercial === '1' || normalized.telefones.comercial === true
      };
    }

    return normalized;
  }

  /**
   * Valida entrada completa baseada no serviço
   */
  static validateServiceInput(serviceCode: string, input: any): { isValid: boolean; errors: string[]; sanitizedInput: any } {
    const errors: string[] = [];
    const sanitizedInput = { ...input };

    try {
      switch (serviceCode) {
        case '320-contatos-por-cep':
          if (!input.cep) {
            errors.push('CEP é obrigatório');
          } else {
            const cepValidation = BigTechDataValidator.validateAndNormalizeCEP(input.cep);
            if (!cepValidation.isValid) {
              errors.push(`CEP inválido: ${cepValidation.error}`);
            } else {
              sanitizedInput.cep = cepValidation.normalized;
            }
          }
          break;

        case '327-quod-cadastral-pf':
          if (!input.cpfCnpj) {
            errors.push('CPF/CNPJ é obrigatório');
          } else {
            const cpfValidation = BigTechDataValidator.validateAndNormalizeCPF(input.cpfCnpj);
            if (!cpfValidation.isValid) {
              errors.push(`CPF inválido: ${cpfValidation.error}`);
            } else {
              sanitizedInput.cpfCnpj = cpfValidation.normalized;
            }
          }
          if (!input.tipoPessoa || !['F', 'J'].includes(input.tipoPessoa)) {
            errors.push('TipoPessoa deve ser "F" ou "J"');
          }
          break;

        case '431-dados-cnh':
          if (!input.cpf) {
            errors.push('CPF é obrigatório');
          } else {
            const cpfValidation = BigTechDataValidator.validateAndNormalizeCPF(input.cpf);
            if (!cpfValidation.isValid) {
              errors.push(`CPF inválido: ${cpfValidation.error}`);
            } else {
              sanitizedInput.cpf = cpfValidation.normalized;
            }
          }
          break;

        case '411-crlv-ro':
        case '412-crlv-rr':
        case '415-crlv-se':
        case '416-crlv-sp':
          if (!input.placa) {
            errors.push('Placa é obrigatória');
          } else {
            const placaValidation = BigTechDataValidator.validateAndNormalizePlaca(input.placa);
            if (!placaValidation.isValid) {
              errors.push(`Placa inválida: ${placaValidation.error}`);
            } else {
              sanitizedInput.placa = placaValidation.normalized;
            }
          }
          break;

        case '36-busca-nome-uf':
          if (!input.uf) {
            errors.push('UF é obrigatória');
          } else {
            const ufValidation = BigTechDataValidator.validateAndNormalizeUF(input.uf);
            if (!ufValidation.isValid) {
              errors.push(`UF inválida: ${ufValidation.error}`);
            } else {
              sanitizedInput.uf = ufValidation.normalized;
            }
          }
          if (!input.nomeCompleto || input.nomeCompleto.length < 3) {
            errors.push('NomeCompleto é obrigatório e deve ter pelo menos 3 caracteres');
          }
          break;

        case '39-teleconfirma':
          if (!input.ddd) {
            errors.push('DDD é obrigatório');
          }
          if (!input.telefone) {
            errors.push('Telefone é obrigatório');
          } else {
            const telefoneValidation = BigTechDataValidator.validateAndNormalizeTelefone(input.ddd + input.telefone);
            if (!telefoneValidation.isValid) {
              errors.push(`Telefone inválido: ${telefoneValidation.error}`);
            } else {
              const telefone = telefoneValidation.normalized;
              sanitizedInput.ddd = telefone.substring(0, 2);
              sanitizedInput.telefone = telefone.substring(2);
            }
          }
          break;

        case '304-positivo-define-risco-cnpj':
          if (!input.cpfCnpj) {
            errors.push('CNPJ é obrigatório');
          } else {
            const cnpjValidation = BigTechDataValidator.validateAndNormalizeCNPJ(input.cpfCnpj);
            if (!cnpjValidation.isValid) {
              errors.push(`CNPJ inválido: ${cnpjValidation.error}`);
            } else {
              sanitizedInput.cpfCnpj = cnpjValidation.normalized;
            }
          }
          break;

        case '370-positivo-acerta-essencial-pf':
          if (!input.cpfCnpj) {
            errors.push('CPF é obrigatório');
          } else {
            const cpfValidation = BigTechDataValidator.validateAndNormalizeCPF(input.cpfCnpj);
            if (!cpfValidation.isValid) {
              errors.push(`CPF inválido: ${cpfValidation.error}`);
            } else {
              sanitizedInput.cpfCnpj = cpfValidation.normalized;
            }
          }
          break;

        case '1539-bvs-basica-pf':
          if (!input.cpfCnpj) {
            errors.push('CPF é obrigatório');
          } else {
            const cpfValidation = BigTechDataValidator.validateAndNormalizeCPF(input.cpfCnpj);
            if (!cpfValidation.isValid) {
              errors.push(`CPF inválido: ${cpfValidation.error}`);
            } else {
              sanitizedInput.cpfCnpj = cpfValidation.normalized;
            }
          }
          break;

        case 'BVSBasicaPF':
          if (!input.cpfCnpj) {
            errors.push('CPF é obrigatório');
          } else {
            const cpfValidation = BigTechDataValidator.validateAndNormalizeCPF(input.cpfCnpj);
            if (!cpfValidation.isValid) {
              errors.push(`CPF inválido: ${cpfValidation.error}`);
            } else {
              sanitizedInput.cpfCnpj = cpfValidation.normalized;
            }
          }
          break;

        case '11-bvs-basica-pj':
          if (!input.cpfCnpj) {
            errors.push('CNPJ é obrigatório');
          } else {
            const cnpjValidation = BigTechDataValidator.validateAndNormalizeCNPJ(input.cpfCnpj);
            if (!cnpjValidation.isValid) {
              errors.push(`CNPJ inválido: ${cnpjValidation.error}`);
            } else {
              sanitizedInput.cpfCnpj = cnpjValidation.normalized;
            }
          }
          break;

        case '1003-scr-premium-integracoes':
          if (!input.cpfCnpj) {
            errors.push('CPF/CNPJ é obrigatório');
          } else {
            const documento = input.cpfCnpj.replace(/\D/g, '');
            if (documento.length === 11) {
              const cpfValidation = BigTechDataValidator.validateAndNormalizeCPF(input.cpfCnpj);
              if (!cpfValidation.isValid) {
                errors.push(`CPF inválido: ${cpfValidation.error}`);
              } else {
                sanitizedInput.cpfCnpj = cpfValidation.normalized;
              }
            } else if (documento.length === 14) {
              const cnpjValidation = BigTechDataValidator.validateAndNormalizeCNPJ(input.cpfCnpj);
              if (!cnpjValidation.isValid) {
                errors.push(`CNPJ inválido: ${cnpjValidation.error}`);
              } else {
                sanitizedInput.cpfCnpj = cnpjValidation.normalized;
              }
            } else {
              errors.push('CPF/CNPJ deve ter 11 ou 14 dígitos');
            }
          }
          break;
      }

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedInput
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Erro interno na validação'],
        sanitizedInput
      };
    }
  }
}