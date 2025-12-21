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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // TODO: Buscar dados reais dos plugins ativos
  const veicularQueries: VeicularQuery[] = [
    {
      id: '1',
      name: '412-Crlv/RR',
      description: 'Emite o CRLV-e digital para veículos registrados em Roraima, conforme dados oficiais do Detran/RR.',
      price: 6.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '2',
      name: '415-Crlv/SE',
      description: 'Emite o CRLV-e digital para veículos registrados em Sergipe, conforme dados oficiais do Detran/SE.',
      price: 11.00,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '3',
      name: '416-Crlv/SP',
      description: 'Emite o CRLV-e digital para veículos registrados em São Paulo, conforme dados oficiais do Detran/SP.',
      price: 9.90,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '4',
      name: '411-Crlv/RO',
      description: 'Emite o CRLV-e digital para veículos registrados em Rondônia, conforme dados oficiais do Detran/RO.',
      price: 6.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '5',
      name: '404-Crlv/PA',
      description: 'Emite o CRLV-e digital para veículos registrados no Pará, conforme dados oficiais do Detran/PA.',
      price: 6.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '6',
      name: '407-Crlv/PI',
      description: 'Emite o CRLV-e digital para veículos registrados no Piauí, conforme dados oficiais do Detran/PI.',
      price: 6.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '7',
      name: '408-Crlv/PR',
      description: 'Emite o CRLV-e digital para veículos registrados no Paraná, conforme dados oficiais do Detran/PR.',
      price: 7.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '8',
      name: '417-Crlv/TO',
      description: 'Emite o CRLV-e digital para veículos registrados no Tocantins, conforme dados oficiais do Detran/TO.',
      price: 6.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '9',
      name: '646-Comunicado de Venda',
      description: 'Mostra informações sobre comunicação de venda registrada no DETRAN.',
      price: 3.85,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '10',
      name: '87-Bin Nacional Completa',
      description: 'Retorna proprietário atual, cadastro completo e último licenciamento com restrições.',
      price: 3.00,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '11',
      name: '94-Bin Estadual (Prov. único)',
      description: 'Apresenta dados cadastrais completos do veículo no estado de registro.',
      price: 3.00,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '12',
      name: '60-Recall',
      description: 'Consulta de campanhas de recall ativas ou concluídas para o veículo.',
      price: 2.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '13',
      name: '462-Documento CRV',
      description: 'Informa código de segurança do CRV para emissão de ATPV-e e procedimentos no Detran.',
      price: 6.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '14',
      name: '51-Histórico Roubo e Furto',
      description: 'Verifica registros ativos de roubo ou furto nas bases policiais.',
      price: 3.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '15',
      name: '57-Gravame Indicativo',
      description: 'Informa existência de gravame sobre o veículo, como alienação fiduciária.',
      price: 3.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '16',
      name: '403-Crlv/MT',
      description: 'Emite o CRLV-e digital para veículos registrados no Mato Grosso, conforme dados oficiais do Detran/MT.',
      price: 6.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '17',
      name: '182-Renainf',
      description: 'Retorna infrações de trânsito registradas no RENAINF com detalhes.',
      price: 3.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '18',
      name: '188-Indicio Conjugado - Base I',
      description: 'Identifica registros de sinistro vinculados ao veículo.',
      price: 4.25,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '19',
      name: '295-CheckList Veicula',
      description: 'Verifica se veículo atuou como táxi ou possui registro de batida.',
      price: 3.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '20',
      name: '179-Leilão Conjugado - Base I',
      description: 'Informa se o veículo possui registro em base de leilão, conforme dados repassados pelos leiloeiros.',
      price: 5.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '21',
      name: '106-RENAJUD',
      description: 'Identifica restrições judiciais aplicadas ao veículo pelo RENAJUD.',
      price: 3.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '22',
      name: '125-Leilão Score + Indicio + PT',
      description: 'Verifica registros de leilão e sinistro com pontuação de risco.',
      price: 8.25,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '23',
      name: '139-Proprietario Atual',
      description: 'Retorna os dados do veículo juntamente com as informações do proprietário atual.',
      price: 2.40,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '24',
      name: '364-Bin Nacional+Renainf+CSV',
      description: 'Consulta integrada de CSV, RENAINF, RENAJUD, Recall, BIN e proprietário.',
      price: 4.00,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '25',
      name: '400-Crlv/MA',
      description: 'Emite o CRLV-e digital para veículos registrados no Maranhão, conforme dados oficiais do Detran/MA.',
      price: 6.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '26',
      name: '401-Crlv/MG',
      description: 'Emite o CRLV-e digital para veículos registrados em Minas Gerais, conforme dados oficiais do Detran/MG.',
      price: 6.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '27',
      name: '402-Crlv/MS',
      description: 'Emite o CRLV-e digital para veículos registrados em Mato Grosso do Sul, conforme dados oficiais do Detran/MS.',
      price: 6.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '28',
      name: '399-Crlv/GO',
      description: 'Emite o CRLV-e digital para veículos registrados em Goiás, conforme dados oficiais do Detran/GO.',
      price: 8.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '29',
      name: '392-Crlv/AL',
      description: 'Emite o CRLV-e digital para veículos registrados em Alagoas, conforme dados oficiais do Detran/AL.',
      price: 9.00,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '30',
      name: '394-Crlv/AP',
      description: 'Emite o CRLV-e digital para veículos registrados no Amapá, conforme dados oficiais do Detran/AP.',
      price: 6.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '31',
      name: '395-Crlv/BA',
      description: 'Emite o CRLV-e digital para veículos registrados na Bahia, conforme dados oficiais do Detran/BA.',
      price: 15.90,
      plugin: 'infosimples',
      active: true
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
                {veicularQueries.map((query) => (
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