// Baseado em: 5.Pages.md v1.1, 8.DesignSystem.md
// TASK-007: Implementar Consulta Crédito
// Entidades: Consulta, Plugin
// Componentes: Card, Modal, Button

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal, ModalInput } from '@/components/Modal'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'

interface CreditQuery {
  id: string
  name: string
  description: string
  price: number
  plugin: string
  active: boolean
}

export default function ConsultaCredito() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState<CreditQuery | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  // TODO: Buscar dados reais dos plugins ativos
  const creditQueries: CreditQuery[] = [
    {
      id: '1',
      name: 'POSITIVO ACERTA ESSENCIAL PF',
      description: 'Consulta básica de crédito pessoa física com score e restrições',
      price: 2.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '2',
      name: 'PROTESTO SINTÉTICO NACIONAL',
      description: 'Consulta de protestos e ações judiciais em todo território nacional',
      price: 3.75,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '3',
      name: 'SCORE DE CRÉDITO COMPLETO',
      description: 'Análise completa de score de crédito com histórico detalhado',
      price: 5.00,
      plugin: 'serasa',
      active: false // Plugin não ativo
    }
  ]

  const validateDocument = (value: string): boolean => {
    // Remove caracteres não numéricos
    const cleanValue = value.replace(/\D/g, '')

    // Valida CPF (11 dígitos)
    if (cleanValue.length === 11) {
      return validateCPF(cleanValue)
    }

    // Valida CNPJ (14 dígitos)
    if (cleanValue.length === 14) {
      return validateCNPJ(cleanValue)
    }

    return false
  }

  const validateCPF = (cpf: string): boolean => {
    // Lógica básica de validação CPF
    if (cpf.length !== 11) return false
    if (/^(\d)\1+$/.test(cpf)) return false // CPF com todos dígitos iguais

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cpf.charAt(9))) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0

    return remainder === parseInt(cpf.charAt(10))
  }

  const validateCNPJ = (cnpj: string): boolean => {
    // Lógica básica de validação CNPJ
    if (cnpj.length !== 14) return false
    if (/^(\d)\1+$/.test(cnpj)) return false // CNPJ com todos dígitos iguais

    // Validação dos dígitos verificadores (simplificada)
    return true // TODO: Implementar validação completa CNPJ
  }

  const handleExecuteQuery = (query: CreditQuery) => {
    setSelectedQuery(query)
    setModalOpen(true)
    setInputValue('')
    setInputError('')
    setResult(null)
  }

  const handleSubmit = async () => {
    if (!selectedQuery) return

    // Valida documento
    if (!validateDocument(inputValue)) {
      setInputError('CPF ou CNPJ inválido')
      return
    }

    // TODO: Verificar saldo de créditos do usuário
    const userCredits = 150 // Mock
    if (userCredits < selectedQuery.price) {
      setInputError('Saldo insuficiente para esta consulta')
      return
    }

    setIsLoading(true)
    setInputError('')

    try {
      // TODO: Executar consulta via plugin
      // Simulação de chamada API
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock result
      setResult({
        status: 'success',
        data: {
          document: inputValue,
          score: Math.floor(Math.random() * 1000) + 1,
          restrictions: Math.random() > 0.7,
          query: selectedQuery.name
        }
      })
    } catch (error) {
      // Fallback automático para outro plugin se disponível
      console.log('Tentando fallback...')
      // TODO: Implementar lógica de fallback

      setResult({
        status: 'error',
        message: 'Erro na consulta. Tente novamente ou entre em contato com o suporte.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDocument = (value: string): string => {
    const cleanValue = value.replace(/\D/g, '')

    if (cleanValue.length <= 11) {
      // Formatar CPF: 000.000.000-00
      return cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    } else {
      // Formatar CNPJ: 00.000.000/0000-00
      return cleanValue
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    }
  }

  const handleInputChange = (value: string) => {
    const formatted = formatDocument(value)
    setInputValue(formatted)
    setInputError('')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Consulta de Crédito</h1>
                <p className="text-gray-600 mt-2">
                  Verifique informações de crédito de pessoas físicas e jurídicas
                </p>
              </div>

              {/* Cards de Consultas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creditQueries.map((query) => (
                  <Card key={query.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{query.name}</CardTitle>
                      <CardDescription>{query.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-success">
                          R$ {query.price.toFixed(2)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          query.active
                            ? 'bg-success text-success-foreground'
                            : 'bg-error text-error-foreground'
                        }`}>
                          {query.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleExecuteQuery(query)}
                        disabled={!query.active}
                        className="w-full"
                      >
                        {query.active ? 'Executar Consulta' : 'Plugin Indisponível'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Modal de Input */}
              <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selectedQuery?.name || 'Consulta de Crédito'}
              >
                <div className="space-y-4">
                  <ModalInput
                    label="CPF ou CNPJ"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    error={inputError}
                  />

                  {selectedQuery && (
                    <div className="bg-primary/10 p-3 rounded-md">
                      <p className="text-sm text-primary-foreground">
                        <strong>Custo:</strong> R$ {selectedQuery.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-primary-foreground">
                        <strong>Plugin:</strong> {selectedQuery.plugin}
                      </p>
                    </div>
                  )}

                  {result && (
                    <div className={`p-3 rounded-md ${
                      result.status === 'success'
                        ? 'bg-success/10 text-success-foreground'
                        : 'bg-error/10 text-error-foreground'
                    }`}>
                      {result.status === 'success' ? (
                        <div>
                          <p className="font-medium">Consulta realizada com sucesso!</p>
                          <p className="text-sm mt-1">
                            Documento: {result.data.document}
                          </p>
                          <p className="text-sm">
                            Score: {result.data.score}
                          </p>
                          <p className="text-sm">
                            Restrições: {result.data.restrictions ? 'Sim' : 'Não'}
                          </p>
                        </div>
                      ) : (
                        <p className="font-medium">{result.message}</p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Processando...' : 'Confirmar Consulta'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setModalOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Modal>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}