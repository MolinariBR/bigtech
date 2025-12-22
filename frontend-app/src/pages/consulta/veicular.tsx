// Baseado em: 5.Pages.md v1.1, 8.DesignSystem.md
// TASK-008.2: Implementar Consulta Veicular
// Entidades: Consulta, Plugin
// Componentes: Card, Modal, Button

import { useState, useEffect } from 'react'
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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [veicularQueries, setVeicularQueries] = useState<VeicularQuery[]>([])
  const [loadingServices, setLoadingServices] = useState(true)

  // Buscar serviços veiculares do backend
  useEffect(() => {
    const fetchVeicularServices = async () => {
      try {
        setLoadingServices(true)

        // Buscar serviços do plugin infosimples via API REST
        const response = await fetch('/api/plugins/infosimples/services', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // TODO: Adicionar autenticação se necessário
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.services) {
          // Filtrar apenas serviços veiculares
          const veicularServices = data.services
            .filter((service: any) => service.category === 'veicular')
            .map((service: any) => ({
              id: service.id,
              name: service.name,
              description: service.description,
              price: service.price,
              plugin: 'infosimples',
              active: service.active
            }))

          setVeicularQueries(veicularServices)
        } else {
          console.error('Erro ao buscar serviços:', data.error)
          setVeicularQueries([])
        }
      } catch (error) {
        console.error('Erro ao buscar serviços veiculares:', error)
        setVeicularQueries([])
      } finally {
        setLoadingServices(false)
      }
    }

    fetchVeicularServices()
  }, [])

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

  const truncateDescription = (text: string, maxLength: number = 180): string => {
    if (text.length <= maxLength) return text
    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
  }

  const handleInputChange = (value: string) => {
    const formatted = formatPlate(value)
    setInputValue(formatted)
    setInputError('')
  }

  const toggleCardExpansion = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pb-20">
          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Page Header */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground">Consulta Veicular</h1>
                <p className="text-muted-foreground mt-2">
                  Verifique informações de veículos por placa
                </p>
              </div>

              {/* Cards de Consultas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingServices ? (
                  // Loading state
                  Array.from({ length: 7 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded mb-2"></div>
                        <div className="h-4 bg-muted rounded mb-1"></div>
                        <div className="h-16 bg-muted rounded"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div className="h-8 w-16 bg-muted rounded"></div>
                          <div className="h-6 w-12 bg-muted rounded-full"></div>
                        </div>
                        <div className="h-10 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : veicularQueries.length === 0 ? (
                  // Empty state
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      Nenhum serviço veicular disponível no momento.
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      Entre em contato com o suporte se o problema persistir.
                    </p>
                  </div>
                ) : (
                  // Services cards
                  veicularQueries.map((query) => (
                    <Card key={query.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg uppercase">{query.name}</CardTitle>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Grupo: Veicular</p>
                          <CardDescription className={expandedCards.has(query.id) ? '' : 'line-clamp-3'}>
                            {expandedCards.has(query.id) ? query.description : truncateDescription(query.description)}
                          </CardDescription>
                          {query.description.length > 180 && (
                            <button
                              onClick={() => toggleCardExpansion(query.id)}
                              className="text-xs text-primary hover:underline mt-1"
                            >
                              {expandedCards.has(query.id) ? 'Ver menos' : 'Mais...'}
                            </button>
                          )}
                        </div>
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
                  ))
                )}
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