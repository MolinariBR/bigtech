// Baseado em: 5.Pages.md v1.1, 8.DesignSystem.md
// TASK-008.2: Implementar Consulta Veicular
// Entidades: Consulta, Plugin
// Componentes: Card, Modal, Button

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal, ModalInput } from '@/components/Modal'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'

interface VeicularQuery {
  id: string
  name: string
  description: string
  price: number
  plugin: string
  active: boolean
}

export default function ConsultaVeicular() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState<VeicularQuery | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  // TODO: Buscar dados reais dos plugins ativos
  const veicularQueries: VeicularQuery[] = [
    {
      id: '1',
      name: 'BIN NACIONAL COMPLETA',
      description: 'Consulta completa de dados veiculares nacionais com histórico detalhado',
      price: 4.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '2',
      name: 'CRLV por Estado',
      description: 'Consulta de CRLV específica por estado brasileiro',
      price: 3.00,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '3',
      name: 'CONSULTA VEICULAR BÁSICA',
      description: 'Dados básicos do veículo com validação de propriedade',
      price: 2.50,
      plugin: 'serasa',
      active: false // Plugin não ativo
    }
  ]

  const validatePlate = (value: string): boolean => {
    // Remove caracteres não alfanuméricos
    const cleanValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

    // Valida formato brasileiro: AAA-9999 ou AAA9A99
    const oldFormat = /^[A-Z]{3}\d{4}$/
    const newFormat = /^[A-Z]{3}\d[A-Z]\d{2}$/

    return oldFormat.test(cleanValue) || newFormat.test(cleanValue)
  }

  const handleExecuteQuery = (query: VeicularQuery) => {
    setSelectedQuery(query)
    setModalOpen(true)
    setInputValue('')
    setInputError('')
    setResult(null)
  }

  const handleSubmit = async () => {
    if (!selectedQuery) return

    // Valida placa
    if (!validatePlate(inputValue)) {
      setInputError('Placa inválida (formato: AAA-9999 ou AAA9A99)')
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
          plate: inputValue,
          model: 'Honda Civic',
          year: 2020,
          owner: 'João Silva',
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

  const formatPlate = (value: string): string => {
    const cleanValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

    if (cleanValue.length <= 7) {
      // Formatar como AAA-9999
      if (cleanValue.length <= 3) {
        return cleanValue
      } else {
        return cleanValue.slice(0, 3) + '-' + cleanValue.slice(3)
      }
    } else {
      // Formatar como AAA9A99
      return cleanValue.slice(0, 3) + cleanValue.slice(3, 4) + cleanValue.slice(4, 5) + cleanValue.slice(5)
    }
  }

  const handleInputChange = (value: string) => {
    const formatted = formatPlate(value)
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
                <h1 className="text-3xl font-bold text-gray-900">Consulta Veicular</h1>
                <p className="text-gray-600 mt-2">
                  Verifique informações de veículos por placa
                </p>
              </div>

              {/* Cards de Consultas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {veicularQueries.map((query) => (
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
                title={selectedQuery?.name || 'Consulta Veicular'}
              >
                <div className="space-y-4">
                  <ModalInput
                    label="Placa do Veículo"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="AAA-9999 ou AAA9A99"
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
                            Placa: {result.data.plate}
                          </p>
                          <p className="text-sm">
                            Modelo: {result.data.model}
                          </p>
                          <p className="text-sm">
                            Ano: {result.data.year}
                          </p>
                          <p className="text-sm">
                            Proprietário: {result.data.owner}
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