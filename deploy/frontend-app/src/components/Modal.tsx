import * as React from "react"
import { cn } from "../lib/utils"
import { Button } from "./Button"
import { FieldType } from "../lib/validation"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-gray-900/90"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-card rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[98vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-card-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl"
          >
            <span className="sr-only">Fechar</span>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ModalInputProps {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  required?: boolean
}

export function ModalInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required = false
}: ModalInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{ '::placeholder': { color: '#ccc' } } as any}
        className={cn(
          "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-white",
          error ? "border-destructive" : "border-border"
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

interface ModalResultProps {
  result: any
  inputValue: string
}

export function ModalResult({ result, inputValue }: ModalResultProps) {
  if (!result) return null

  const formatValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return 'N/A'

    // Formatação específica por tipo de campo
    if (key.toLowerCase().includes('cpf') || key.toLowerCase().includes('cnpj')) {
      const clean = String(value).replace(/\D/g, '')
      if (clean.length === 11) {
        return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      } else if (clean.length === 14) {
        return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
      }
    }

    if (key.toLowerCase().includes('data') || key.toLowerCase().includes('birthdate') || key.toLowerCase().includes('nascimento')) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('pt-BR')
        }
      } catch (e) {
        // Ignorar erro de formatação
      }
    }

    if (key.toLowerCase().includes('cep')) {
      const clean = String(value).replace(/\D/g, '')
      if (clean.length === 8) {
        return clean.replace(/(\d{5})(\d{3})/, '$1-$2')
      }
    }

    if (key.toLowerCase().includes('telefone') || key.toLowerCase().includes('celular')) {
      const clean = String(value).replace(/\D/g, '')
      if (clean.length === 11) {
        return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      } else if (clean.length === 10) {
        return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
      }
    }

    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não'
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'Nenhum'
    }

    return String(value)
  }

  const renderDataObject = (data: any, prefix = ''): React.ReactNode => {
    if (!data || typeof data !== 'object') return null

    return Object.entries(data).map(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return (
          <div key={fullKey} className="mb-4">
            <h4 className="font-medium text-foreground mb-2">{displayKey}:</h4>
            <div className="ml-4 pl-4 border-l border-border">
              {renderDataObject(value, fullKey)}
            </div>
          </div>
        )
      }

      return (
        <div key={fullKey} className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0">
          <span className="font-medium text-foreground">{displayKey}:</span>
          <span className="text-muted-foreground text-right">{formatValue(key, value)}</span>
        </div>
      )
    })
  }

  return (
    <div className="space-y-4">
      {result.status === 'success' ? (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center mr-3">
              <span className="text-success-foreground font-bold">✓</span>
            </div>
            <h3 className="text-lg font-semibold text-success-foreground">
              Consulta realizada com sucesso!
            </h3>
          </div>

          {result.data && (
            <div className="space-y-4">
              <div className="bg-background/50 rounded-md p-3">
                <h4 className="font-medium text-foreground mb-3">Dados da Consulta:</h4>
                {renderDataObject(result.data)}
              </div>

              {inputValue && (
                <div className="text-sm text-muted-foreground">
                  <strong>Documento consultado:</strong> {formatValue('documento', inputValue)}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-error/10 border border-error/20 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-error rounded-full flex items-center justify-center mr-3">
              <span className="text-error-foreground font-bold">✕</span>
            </div>
            <h3 className="text-lg font-semibold text-error-foreground">
              Erro na consulta
            </h3>
          </div>

          <div className="space-y-2">
            <p className="text-error-foreground">{result.message || 'Ocorreu um erro durante a consulta.'}</p>

            {result.details && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Detalhes técnicos
                </summary>
                <pre className="mt-2 p-2 bg-background/50 rounded text-xs text-muted-foreground overflow-x-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface DynamicField {
  name: string
  type: FieldType
  label: string
  placeholder?: string
  required?: boolean
  value: string
  error?: string
  onChange: (value: string) => void
}

interface ModalFormProps {
  fields: DynamicField[]
  onSubmit: () => void
  submitLabel?: string
  isLoading?: boolean
  submitDisabled?: boolean
}

function getInputType(fieldType: FieldType): string {
  switch (fieldType) {
    case 'date.iso':
    case 'date.br':
      return 'date'
    case 'number':
      return 'number'
    case 'email':
      return 'email'
    case 'phone.br':
    case 'cep':
    case 'document':
    case 'document.cpf':
    case 'document.cnpj':
    case 'vehicle.plate':
    case 'text':
    case 'boolean':
    default:
      return 'text'
  }
}

export function ModalForm({ fields, onSubmit, submitLabel = "Confirmar", isLoading = false, submitDisabled = false }: ModalFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <ModalInput
          key={field.name}
          label={field.label}
          type={getInputType(field.type)}
          value={field.value}
          onChange={field.onChange}
          placeholder={field.placeholder}
          error={field.error}
          required={field.required}
        />
      ))}

      <div className="flex space-x-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || submitDisabled}
          className="flex-1"
        >
          {isLoading ? 'Processando...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}