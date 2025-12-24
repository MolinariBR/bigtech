// Baseado em: 8.DesignSystem.md, TASK-API-INFOSIMPLES-006
// Validações dinâmicas baseadas nos tipos de campos do OpenAPI

export type ValidationResult = {
  isValid: boolean
  error?: string
}

export type FieldType =
  | 'document'
  | 'document.cpf'
  | 'document.cnpj'
  | 'date.iso'
  | 'date.br'
  | 'vehicle.plate'
  | 'phone.br'
  | 'cep'
  | 'email'
  | 'text'
  | 'number'
  | 'boolean'

/**
 * Valida um campo baseado no seu tipo
 */
export function validateField(type: FieldType, value: string, required: boolean = true): ValidationResult {
  // Verificar se é obrigatório e está vazio
  if (required && (!value || value.trim() === '')) {
    return {
      isValid: false,
      error: 'Este campo é obrigatório'
    }
  }

  // Se não é obrigatório e está vazio, é válido
  if (!required && (!value || value.trim() === '')) {
    return { isValid: true }
  }

  // Limpar valor para validação
  const cleanValue = value.replace(/\s/g, '')

  switch (type) {
    case 'document':
      return validateDocument(cleanValue)
    case 'document.cpf':
      return validateCPF(cleanValue)
    case 'document.cnpj':
      return validateCNPJ(cleanValue)
    case 'date.iso':
      return validateDateISO(cleanValue)
    case 'date.br':
      return validateDateBR(cleanValue)
    case 'vehicle.plate':
      return validatePlate(cleanValue)
    case 'phone.br':
      return validatePhoneBR(cleanValue)
    case 'cep':
      return validateCEP(cleanValue)
    case 'email':
      return validateEmail(cleanValue)
    case 'number':
      return validateNumber(cleanValue)
    case 'boolean':
      return validateBoolean(cleanValue)
    case 'text':
    default:
      return validateText(cleanValue)
  }
}

/**
 * Valida documento (CPF ou CNPJ)
 */
export function validateDocument(document: string): ValidationResult {
  const cleanDocument = document.replace(/\D/g, '')

  if (cleanDocument.length === 11) {
    return validateCPF(cleanDocument)
  } else if (cleanDocument.length === 14) {
    return validateCNPJ(cleanDocument)
  } else {
    return {
      isValid: false,
      error: 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)'
    }
  }
}

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): ValidationResult {
  const cleanCPF = cpf.replace(/\D/g, '')

  if (cleanCPF.length !== 11) {
    return {
      isValid: false,
      error: 'CPF deve ter 11 dígitos'
    }
  }

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) {
    return {
      isValid: false,
      error: 'CPF inválido'
    }
  }

  // Calcular primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0

  if (remainder !== parseInt(cleanCPF.charAt(9))) {
    return {
      isValid: false,
      error: 'CPF inválido'
    }
  }

  // Calcular segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0

  if (remainder !== parseInt(cleanCPF.charAt(10))) {
    return {
      isValid: false,
      error: 'CPF inválido'
    }
  }

  return { isValid: true }
}

/**
 * Valida CNPJ
 */
export function validateCNPJ(cnpj: string): ValidationResult {
  const cleanCNPJ = cnpj.replace(/\D/g, '')

  if (cleanCNPJ.length !== 14) {
    return {
      isValid: false,
      error: 'CNPJ deve ter 14 dígitos'
    }
  }

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) {
    return {
      isValid: false,
      error: 'CNPJ inválido'
    }
  }

  // Calcular primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i]
  }
  let remainder = sum % 11
  let digit1 = remainder < 2 ? 0 : 11 - remainder

  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) {
    return {
      isValid: false,
      error: 'CNPJ inválido'
    }
  }

  // Calcular segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i]
  }
  remainder = sum % 11
  let digit2 = remainder < 2 ? 0 : 11 - remainder

  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) {
    return {
      isValid: false,
      error: 'CNPJ inválido'
    }
  }

  return { isValid: true }
}

/**
 * Valida data no formato ISO (YYYY-MM-DD)
 */
export function validateDateISO(date: string): ValidationResult {
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/

  if (!isoRegex.test(date)) {
    return {
      isValid: false,
      error: 'Data deve estar no formato YYYY-MM-DD'
    }
  }

  const [year, month, day] = date.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)

  if (dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day) {
    return {
      isValid: false,
      error: 'Data inválida'
    }
  }

  // Verificar se não é uma data futura muito distante ou passada demais
  const now = new Date()
  const minDate = new Date(1900, 0, 1)
  const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())

  if (dateObj < minDate || dateObj > maxDate) {
    return {
      isValid: false,
      error: 'Data fora do intervalo permitido'
    }
  }

  return { isValid: true }
}

/**
 * Valida data no formato brasileiro (DD/MM/YYYY)
 */
export function validateDateBR(date: string): ValidationResult {
  const brRegex = /^\d{2}\/\d{2}\/\d{4}$/

  if (!brRegex.test(date)) {
    return {
      isValid: false,
      error: 'Data deve estar no formato DD/MM/YYYY'
    }
  }

  const [day, month, year] = date.split('/').map(Number)
  const dateObj = new Date(year, month - 1, day)

  if (dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day) {
    return {
      isValid: false,
      error: 'Data inválida'
    }
  }

  // Verificar se não é uma data futura muito distante ou passada demais
  const now = new Date()
  const minDate = new Date(1900, 0, 1)
  const maxDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())

  if (dateObj < minDate || dateObj > maxDate) {
    return {
      isValid: false,
      error: 'Data fora do intervalo permitido'
    }
  }

  return { isValid: true }
}

/**
 * Valida placa de veículo
 */
export function validatePlate(plate: string): ValidationResult {
  const cleanPlate = plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

  // Formatos aceitos: AAA9999, AAA9A99
  const plateRegex = /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/

  if (!plateRegex.test(cleanPlate)) {
    return {
      isValid: false,
      error: 'Placa deve estar no formato AAA-9999 ou AAA9A99'
    }
  }

  return { isValid: true }
}

/**
 * Valida telefone brasileiro
 */
export function validatePhoneBR(phone: string): ValidationResult {
  const cleanPhone = phone.replace(/\D/g, '')

  // Aceitar telefones com 10 ou 11 dígitos (com 9º dígito)
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
    return {
      isValid: false,
      error: 'Telefone deve ter 10 ou 11 dígitos'
    }
  }

  // Verificar se começa com dígito de área válido (11-99, exceto 10)
  const areaCode = parseInt(cleanPhone.substring(0, 2))
  if (areaCode < 11 || areaCode > 99) {
    return {
      isValid: false,
      error: 'Código de área inválido'
    }
  }

  return { isValid: true }
}

/**
 * Valida CEP
 */
export function validateCEP(cep: string): ValidationResult {
  const cleanCEP = cep.replace(/\D/g, '')

  if (cleanCEP.length !== 8) {
    return {
      isValid: false,
      error: 'CEP deve ter 8 dígitos'
    }
  }

  return { isValid: true }
}

/**
 * Valida email
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Email inválido'
    }
  }

  return { isValid: true }
}

/**
 * Valida número
 */
export function validateNumber(value: string): ValidationResult {
  const num = parseFloat(value)

  if (isNaN(num)) {
    return {
      isValid: false,
      error: 'Deve ser um número válido'
    }
  }

  return { isValid: true }
}

/**
 * Valida booleano
 */
export function validateBoolean(value: string): ValidationResult {
  const lowerValue = value.toLowerCase().trim()

  if (!['true', 'false', '1', '0', 'sim', 'não', 's', 'n', 'yes', 'no', 'y'].includes(lowerValue)) {
    return {
      isValid: false,
      error: 'Deve ser um valor booleano (sim/não, true/false, etc.)'
    }
  }

  return { isValid: true }
}

/**
 * Valida texto genérico
 */
export function validateText(value: string): ValidationResult {
  if (value.length < 1) {
    return {
      isValid: false,
      error: 'Texto não pode estar vazio'
    }
  }

  if (value.length > 1000) {
    return {
      isValid: false,
      error: 'Texto muito longo (máximo 1000 caracteres)'
    }
  }

  return { isValid: true }
}

/**
 * Valida múltiplos campos de um formulário
 */
export function validateForm(fields: Array<{ type: FieldType; value: string; required?: boolean; label?: string }>): ValidationResult {
  for (const field of fields) {
    const result = validateField(field.type, field.value, field.required ?? true)
    if (!result.isValid) {
      return {
        isValid: false,
        error: field.label ? `${field.label}: ${result.error}` : result.error
      }
    }
  }

  return { isValid: true }
}