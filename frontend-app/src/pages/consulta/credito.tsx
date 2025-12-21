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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // TODO: Buscar dados reais dos plugins ativos
  const creditQueries: CreditQuery[] = [
    {
      id: '1',
      name: 'POSITIVO ACERTA ESSENCIAL PF',
      description: 'Voltado para análise de crédito baseada em dados positivos, ou seja, informações de comportamento financeiro saudável, e não somente dívidas.',
      price: 4.25,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '2',
      name: '39-TeleConfirma',
      description: 'Serviço de confirmação telefônica para validação de informações pessoais e cadastrais, garantindo precisão nos dados fornecidos.',
      price: 1.80,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '3',
      name: 'PROTESTO SINTÉTICO NACIONAL',
      description: 'Retorna informações sobre protestos em cartórios em nível nacional, identificando títulos protestados e valores associados.',
      price: 2.30,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '4',
      name: '36-Busca por Nome+UF',
      description: 'Busca de informações por nome e unidade federativa, facilitando a localização de dados cadastrais em todo o território brasileiro.',
      price: 2.20,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '5',
      name: 'POSITIVO DEFINE RISCO CNPJ',
      description: 'Produto de análise de crédito empresarial baseado exclusivamente em dados positivos, semelhante ao Cadastro Positivo das pessoas físicas.',
      price: 4.25,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '6',
      name: 'QUOD RESTRITIVO + AÇÕES PF',
      description: 'Consulta negativa voltada para identificar todas as ocorrências restritivas de um CPF, somada a processos judiciais que possam indicar risco.',
      price: 1.20,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '7',
      name: 'QUOD RESTRITIVO + AÇÕES PJ',
      description: 'Consulta negativa voltada para identificar todas as ocorrências restritivas de um CNPJ, somada a processos judiciais que possam indicar risco.',
      price: 1.30,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '8',
      name: 'RATING AVANÇADO PJ',
      description: 'Análise que avalia diversos dados financeiros e comportamentais de uma pessoa jurídica para gerar uma avaliação de crédito mais precisa.',
      price: 4.90,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '9',
      name: 'PROCESSOS JUDICIAIS PF/PJ',
      description: 'Verifica processos judiciais em todas as esferas, incluindo dados como número do processo, tribunal, status, partes envolvidas e valores.',
      price: 2.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '10',
      name: 'BOA VISTA DEFINE + SCORE PJ',
      description: 'Produto da Boa Vista voltado para pessoa jurídica, usado para análise rápida e econômica de risco de crédito empresarial.',
      price: 2.30,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '11',
      name: 'RATING AVANÇADO PF',
      description: 'Análise que avalia diversos dados financeiros e comportamentais de uma pessoa física para gerar uma avaliação de crédito mais precisa.',
      price: 4.90,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '12',
      name: 'CCF Bacen PJ/PF',
      description: 'Verifica se uma pessoa possui registros no Cadastro de Cheques sem Fundos (CCF) do Banco Central, reunindo informações de cheques devolvidos.',
      price: 0.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '13',
      name: 'MAX BRASIL AVANÇADO PF',
      description: 'SPC Plus + Score PF combina informações completas de pendências no SPC Brasil com a pontuação de score de crédito do consumidor.',
      price: 5.90,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '14',
      name: 'MAX BRASIL AVANÇADO CNPJ',
      description: 'SPC Plus + Score PJ reúne informações completas de pendências e restrições no SPC Brasil para empresas, junto com o score de crédito PJ.',
      price: 5.90,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '15',
      name: '1003 - SCR Premium + Integrações',
      description: 'Consulta que retorna a pontuação de crédito e análise de risco, combinando o score de mercado com o relatório do Banco Central (SCR).',
      price: 4.00,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '16',
      name: 'BVS BASICA PJ',
      description: 'Versão empresarial da consulta restritiva da Boa Vista para pessoa jurídica, fornecendo dados básicos de restrições e pendências.',
      price: 1.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '17',
      name: 'REALTIME PREMIUM + SCORE PF',
      description: 'Reúne em um único relatório informações de dívidas vencidas registradas no Serasa (Pefin) e protestos em cartórios vinculados ao CPF.',
      price: 5.20,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '18',
      name: '1002-Protesto Nacional',
      description: 'Verifica se existem títulos protestados em nome de uma pessoa ou empresa em qualquer cartório do Brasil, identificando dívidas não pagas.',
      price: 0.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '19',
      name: '194-Ações Trabalhistas',
      description: 'Consulta sobre ações trabalhistas e processos relacionados ao direito do trabalho, incluindo reclamações e disputas laborais.',
      price: 4.50,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '20',
      name: 'BVS BASICA PF',
      description: 'Versão da consulta restritiva da Boa Vista para pessoa física, oferecendo dados essenciais sobre restrições e histórico financeiro.',
      price: 0.60,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '21',
      name: '1001-Ano Ultimo Licenciamento Disponível + Bin Nacional',
      description: 'Retorna o ano do último licenciamento disponível do veículo e apresenta informações complementares da BIN nacional, incluindo dados técnicos.',
      price: 2.90,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '22',
      name: 'SCR PREMIUM + INTEGRAÇÕES',
      description: 'Consulta que retorna a pontuação de crédito e análise de risco, combinando o score de mercado com o relatório do Banco Central (SCR).',
      price: 4.25,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '23',
      name: 'BOA VISTA ACERTA CPF',
      description: 'Consulta para pessoa física que traz, em tempo real, dívidas da Boa Vista + Score, facilitando decisões rápidas de crédito.',
      price: 2.20,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '24',
      name: '303-SCPC PF Basic',
      description: 'Consulta básica no SCPC para pessoa física, fornecendo informações essenciais sobre restrições e pendências no cadastro positivo.',
      price: 0.60,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '25',
      name: 'CADIN',
      description: 'Retorna informações sobre registros no CADIN, identificando dívidas e pendências financeiras com órgãos públicos e entidades federais.',
      price: 2.20,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '26',
      name: 'REALTIME PREMIUM + SCORE PJ',
      description: 'Reúne em um único relatório informações de dívidas vencidas registradas no Serasa (Pefin) e protestos em cartórios vinculados ao CNPJ.',
      price: 5.20,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '27',
      name: '134-Serasa Crednet Pefin+Protesto+SPC PF',
      description: 'Consulta integrada que combina informações do Serasa, protestos e SPC para pessoa física, oferecendo visão completa de restrições.',
      price: 5.20,
      plugin: 'infosimples',
      active: true
    },
    {
      id: '28',
      name: '186-Localização Simples',
      description: 'Serviço de localização simples para endereços e dados cadastrais, auxiliando na validação de informações de contato e residência.',
      price: 2.20,
      plugin: 'infosimples',
      active: true
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

  const truncateDescription = (text: string, maxLength: number = 180): string => {
    if (text.length <= maxLength) return text
    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
  }

  const handleInputChange = (value: string) => {
    const formatted = formatDocument(value)
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
                <h1 className="text-3xl font-bold text-foreground">Consulta de Crédito</h1>
                <p className="text-muted-foreground mt-2">
                  Verifique informações de crédito de pessoas físicas e jurídicas
                </p>
              </div>

              {/* Cards de Consultas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creditQueries.map((query) => (
                  <Card key={query.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg uppercase">{query.name}</CardTitle>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Grupo: Crédito</p>
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