// Baseado em: 8.DesignSystem.md, TASK-API-INFOSIMPLES-006
// Hook para validação dinâmica de formulários

import { useState, useCallback } from 'react'
import { validateField, validateForm, FieldType, ValidationResult } from '../lib/validation'

export interface FormField {
  name: string
  type: FieldType
  value: string
  required?: boolean
  label: string
  error?: string
  placeholder?: string
  onChange: (value: string) => void
}

export interface InitialFormField {
  name: string
  type: FieldType
  value?: string
  required?: boolean
  label: string
  placeholder?: string
}

export interface UseDynamicValidationReturn {
  fields: FormField[]
  setFieldValue: (name: string, value: string) => void
  validateField: (name: string) => ValidationResult
  validateForm: () => ValidationResult
  resetValidation: () => void
  clearErrors: () => void
  isValid: boolean
  hasErrors: boolean
}

/**
 * Hook para validação dinâmica de formulários
 */
export function useDynamicValidation(initialFields: InitialFormField[]): UseDynamicValidationReturn {
  const [fields, setFields] = useState<FormField[]>(
    initialFields.map(field => ({
      ...field,
      value: field.value || '',
      error: undefined,
      onChange: (value: string) => setFieldValue(field.name, value)
    }))
  )

  const setFieldValue = useCallback((name: string, value: string) => {
    setFields(prevFields =>
      prevFields.map(field =>
        field.name === name
          ? { ...field, value, error: undefined }
          : field
      )
    )
  }, [])

  const validateSingleField = useCallback((name: string): ValidationResult => {
    const field = fields.find(f => f.name === name)
    if (!field) {
      return { isValid: false, error: 'Campo não encontrado' }
    }

    const result = validateField(field.type, field.value || '', field.required ?? true)

    // Atualizar erro do campo
    setFields(prevFields =>
      prevFields.map(f =>
        f.name === name
          ? { ...f, error: result.isValid ? undefined : result.error }
          : f
      )
    )

    return result
  }, [fields])

  const validateAll = useCallback((): ValidationResult => {
    const formFields = fields.map(field => ({
      type: field.type,
      value: field.value || '',
      required: field.required ?? true,
      label: field.label
    }))

    const result = validateForm(formFields)

    // Atualizar erros de todos os campos
    setFields(prevFields =>
      prevFields.map(field => {
        const fieldResult = validateField(field.type, field.value || '', field.required ?? true)
        return {
          ...field,
          error: fieldResult.isValid ? undefined : fieldResult.error
        }
      })
    )

    return result
  }, [fields])

  const resetValidation = useCallback(() => {
    setFields(prevFields =>
      prevFields.map(field => ({ ...field, value: '', error: undefined }))
    )
  }, [])

  const clearErrors = useCallback(() => {
    setFields(prevFields =>
      prevFields.map(field => ({ ...field, error: undefined }))
    )
  }, [])

  const isValid = fields.every(field => !field.error)
  const hasErrors = fields.some(field => field.error)

  return {
    fields,
    setFieldValue,
    validateField: validateSingleField,
    validateForm: validateAll,
    resetValidation,
    clearErrors,
    isValid,
    hasErrors
  }
}