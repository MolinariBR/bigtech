// Baseado em: 5.Pages.md v1.1, 8.DesignSystem.md
// TASK-007: Implementar Consulta Outros
// Entidades: Consulta, Plugin
// Componentes: Card, Modal, Button

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal, ModalForm, ModalResult } from '@/components/Modal'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import { useDynamicValidation, InitialFormField } from '@/hooks/useDynamicValidation'

interface OtherQuery {
  id: string
  name: string
  description: string
  price: number
  plugin: string
  active: boolean
}

export default function ConsultaOutros() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState<OtherQuery | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [otherQueries, setOtherQueries] = useState<OtherQuery[]>([])
  const [loadingServices, setLoadingServices] = useState(true)

  // Campos dinâmicos para validação
  const outrosFields: InitialFormField[] = [
    {
      name: 'document',
      label: 'CPF ou CNPJ',
      type: 'document',
      value: '',
      placeholder: '000.000.000-00 ou 00.000.000/0000-00',
      required: true
    }
  ]

  // Hook de validação dinâmica
  const { fields, validateForm, resetValidation } = useDynamicValidation(outrosFields)

  // Função helper para acessar campos por nome
  const getField = (name: string) => fields.find(f => f.name === name)

  // Buscar serviços de outras categorias do backend
  useEffect(() => {
    const fetchOtherServices = async () => {
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
          // Filtrar apenas serviços de outras categorias
          const otherServices = data.services
            .filter((service: any) => service.category === 'outros')
            .map((service: any) => ({
              id: service.id,
              name: service.name,
              description: service.description,
              price: service.price,
              plugin: 'infosimples',
              active: service.active
            }))

          setOtherQueries(otherServices)
        } else {
          console.error('Erro ao buscar serviços:', data.error)
          setOtherQueries([])
        }
      } catch (error) {
        console.error('Erro ao buscar serviços de outras categorias:', error)
        setOtherQueries([])
      } finally {
        setLoadingServices(false)
      }
    }

    fetchOtherServices()
  }, [])

  const handleExecuteQuery = (query: OtherQuery) => {
    setSelectedQuery(query)
    setModalOpen(true)
    resetValidation()
    setResult(null)
  }

  const handleSubmit = async () => {
    if (!selectedQuery) return

    // Validação dinâmica
    if (!validateForm()) {
      return
    }

    // TODO: Verificar saldo de créditos do usuário
    const userCredits = 150 // Mock
    if (userCredits < selectedQuery.price) {
      // Adicionar erro ao campo se necessário
      return
    }

    setIsLoading(true)

    try {
      // Executar consulta via plugin
      const response = await fetch('/api/plugins/infosimples/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'default', // TODO: Obter do contexto do usuário
          // TODO: Adicionar Authorization se necessário
        },
        body: JSON.stringify({
          input: {
            type: selectedQuery.id, // Usar o ID do serviço como tipo
            input: {
              cpf: getField('document')?.value?.replace(/\D/g, '').length === 11 ? getField('document')?.value?.replace(/\D/g, '') : undefined,
              cnpj: getField('document')?.value?.replace(/\D/g, '').length === 14 ? getField('document')?.value?.replace(/\D/g, '') : undefined,
            }
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Erro na consulta: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Extrair dados reais da resposta normalizada
        const consultaData = data.data?.output?.data || {}

        // Normalizar resultado para exibição
        setResult({
          status: 'success',
          data: consultaData,
          raw: data.data
        })
      } else {
        setResult({
          status: 'error',
          message: data.error || 'Erro na consulta. Tente novamente.',
          details: data.details
        })
      }
    } catch (error) {
      console.error('Erro ao executar consulta:', error)
      setResult({
        status: 'error',
        message: 'Erro na consulta. Tente novamente ou entre em contato com o suporte.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const truncateDescription = (text: string, maxLength: number = 180): string => {
    if (text.length <= maxLength) return text
    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
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
                <h1 className="text-3xl font-bold text-foreground">Consultas Diversas</h1>
                <p className="text-muted-foreground mt-2">
                  Outros tipos de consultas disponíveis no sistema
                </p>
              </div>

              {/* Cards de Consultas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingServices ? (
                  // Loading state
                  Array.from({ length: 4 }).map((_, index) => (
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
                ) : otherQueries.length === 0 ? (
                  // Empty state
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      Nenhum serviço diverso disponível no momento.
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      Entre em contato com o suporte se o problema persistir.
                    </p>
                  </div>
                ) : (
                  // Services cards
                  otherQueries.map((query) => (
                    <Card key={query.id} className="hover:shadow-md transition-shadow" data-testid="consulta-card">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg uppercase flex-1" data-testid="card-title">{query.name}</CardTitle>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium ml-2">
                            Diversos
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1" data-testid="card-category">Grupo: Diversos</p>
                          <CardDescription className={expandedCards.has(query.id) ? '' : 'line-clamp-3'} data-testid="card-description">
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
                          <span className="text-2xl font-bold text-success" data-testid="card-price">
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
                title={selectedQuery?.name || 'Consulta Diversa'}
              >
                <div className="space-y-4">
                  <ModalForm
                    fields={fields}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
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
                    <ModalResult result={result} inputValue={getField('document')?.value || ''} />
                  )}
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