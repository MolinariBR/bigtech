// Baseado em: 5.Pages.md v1.2, 8.DesignSystem.md v1.1
// TASK-010.2: Implementar Extrato Financeiro
// Entidades: Billing
// Componentes: Table, Button

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import {
  Receipt,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  ArrowUpDown,
  Eye,
  EyeOff,
  Download,
  Search
} from 'lucide-react'

interface BillingTransaction {
  id: string
  tenantId: string
  userId: string
  type: 'credit_purchase' | 'query_debit' | 'refund'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  processedAt: string
  creditAmount?: number
  creditValue?: number
  paymentMethod?: string
  externalTransactionId?: string
  consultaId?: string
}

export default function ExtratoFinanceiro() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [transactions, setTransactions] = useState<BillingTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<BillingTransaction[]>([])
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    search: ''
  })
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Mock tenantId - em produção, obter do contexto de autenticação
  const tenantId = 'tenant-123'
  const userId = 'user-456'

  // Calcular estatísticas
  const stats = {
    totalCredits: filteredTransactions
      .filter(t => t.type === 'credit_purchase' && t.status === 'completed')
      .reduce((sum, t) => sum + (t.creditAmount || 0), 0),
    totalSpent: Math.abs(filteredTransactions
      .filter(t => t.type === 'query_debit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)),
    totalRefunded: filteredTransactions
      .filter(t => t.type === 'refund' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    pendingAmount: filteredTransactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  }

  // Mock data - em produção, buscar da API
  useEffect(() => {
    const mockTransactions: BillingTransaction[] = [
      {
        id: '1',
        tenantId,
        userId,
        type: 'credit_purchase',
        amount: 50.00,
        currency: 'BRL',
        status: 'completed',
        processedAt: '2025-12-20T10:00:00Z',
        creditAmount: 100,
        creditValue: 0.50,
        paymentMethod: 'pix',
        externalTransactionId: 'TXN-123456'
      },
      {
        id: '2',
        tenantId,
        userId,
        type: 'query_debit',
        amount: -5.00,
        currency: 'BRL',
        status: 'completed',
        processedAt: '2025-12-19T15:30:00Z',
        consultaId: 'consulta-789'
      },
      {
        id: '3',
        tenantId,
        userId,
        type: 'refund',
        amount: 10.00,
        currency: 'BRL',
        status: 'pending',
        processedAt: '2025-12-18T09:15:00Z',
        externalTransactionId: 'REF-987654'
      },
      {
        id: '4',
        tenantId,
        userId,
        type: 'credit_purchase',
        amount: 25.00,
        currency: 'BRL',
        status: 'completed',
        processedAt: '2025-12-15T14:20:00Z',
        creditAmount: 50,
        creditValue: 0.50,
        paymentMethod: 'pix',
        externalTransactionId: 'TXN-789012'
      },
      {
        id: '5',
        tenantId,
        userId,
        type: 'query_debit',
        amount: -2.50,
        currency: 'BRL',
        status: 'completed',
        processedAt: '2025-12-14T11:45:00Z',
        consultaId: 'consulta-456'
      }
    ]
    setTransactions(mockTransactions)
    setFilteredTransactions(mockTransactions)
  }, [tenantId, userId])

  // Aplicar filtros
  useEffect(() => {
    let filtered = transactions

    if (filters.startDate) {
      filtered = filtered.filter(t => new Date(t.processedAt) >= new Date(filters.startDate))
    }

    if (filters.endDate) {
      filtered = filtered.filter(t => new Date(t.processedAt) <= new Date(filters.endDate))
    }

    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(searchLower) ||
        t.externalTransactionId?.toLowerCase().includes(searchLower) ||
        getTypeLabel(t.type).toLowerCase().includes(searchLower)
      )
    }

    setFilteredTransactions(filtered)
  }, [transactions, filters])

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      type: '',
      search: ''
    })
  }

  const toggleExpandedRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeLabel = (type: string): string => {
    const labels = {
      credit_purchase: 'Compra de Créditos',
      query_debit: 'Débito de Consulta',
      refund: 'Reembolso'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getStatusLabel = (status: string): string => {
    const labels = {
      pending: 'Pendente',
      completed: 'Concluído',
      failed: 'Falhou'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusColor = (status: string): string => {
    const colors = {
      pending: 'text-warning',
      completed: 'text-success',
      failed: 'text-error'
    }
    return colors[status as keyof typeof colors] || 'text-muted-foreground'
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      credit_purchase: <CreditCard className="w-4 h-4" />,
      query_debit: <TrendingDown className="w-4 h-4" />,
      refund: <TrendingUp className="w-4 h-4" />
    }
    return icons[type as keyof typeof icons] || <Receipt className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pb-20">
          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Page Header */}
              <div className="text-center relative">
                <div className="absolute inset-0 -z-10">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-full mb-4 shadow-lg">
                  <Receipt className="w-8 h-8 text-primary-foreground" />
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Extrato Financeiro</h1>
                <p className="text-muted-foreground text-lg">
                  Histórico completo de suas transações e movimentações
                </p>
              </div>

              {/* Estatísticas Resumidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-success/10 to-success/5 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Créditos Comprados</p>
                        <p className="text-2xl font-bold text-success">{stats.totalCredits}</p>
                      </div>
                      <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-error/10 to-error/5 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Gasto</p>
                        <p className="text-2xl font-bold text-error">{formatCurrency(stats.totalSpent)}</p>
                      </div>
                      <div className="w-12 h-12 bg-error/20 rounded-full flex items-center justify-center">
                        <TrendingDown className="w-6 h-6 text-error" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-info/10 to-info/5 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Reembolsado</p>
                        <p className="text-2xl font-bold text-info">{formatCurrency(stats.totalRefunded)}</p>
                      </div>
                      <div className="w-12 h-12 bg-info/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-info" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-warning/10 to-warning/5 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pendente</p>
                        <p className="text-2xl font-bold text-warning">{formatCurrency(stats.pendingAmount)}</p>
                      </div>
                      <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
                        <ArrowUpDown className="w-6 h-6 text-warning" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros */}
              <Card className="shadow-xl border-0 bg-gradient-to-br from-card to-card/95 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-5 h-5 text-primary" />
                      <CardTitle className="text-xl">Filtros e Busca</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center space-x-2"
                    >
                      {showFilters ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</span>
                    </Button>
                  </div>
                  <CardDescription>
                    Refine sua busca por período, tipo ou termo específico
                  </CardDescription>
                </CardHeader>

                {showFilters && (
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Data Inicial
                        </label>
                        <input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => handleFilterChange('startDate', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Data Final
                        </label>
                        <input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => handleFilterChange('endDate', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground flex items-center">
                          <Receipt className="w-4 h-4 mr-2" />
                          Tipo
                        </label>
                        <select
                          value={filters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        >
                          <option value="">Todos os tipos</option>
                          <option value="credit_purchase">Compra de Créditos</option>
                          <option value="query_debit">Débito de Consulta</option>
                          <option value="refund">Reembolso</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground flex items-center">
                          <Search className="w-4 h-4 mr-2" />
                          Buscar
                        </label>
                        <input
                          type="text"
                          value={filters.search}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                          placeholder="ID, transação..."
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <Button variant="outline" onClick={clearFilters}>
                        Limpar Filtros
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Tabela de Transações */}
              <Card className="shadow-xl border-0 bg-gradient-to-br from-card to-card/95 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center">
                        <Receipt className="w-5 h-5 mr-2 text-primary" />
                        Histórico de Transações
                      </CardTitle>
                      <CardDescription>
                        {filteredTransactions.length} transação(ões) encontrada(s)
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Exportar</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-4 px-4 font-semibold text-foreground">Data</th>
                          <th className="text-left py-4 px-4 font-semibold text-foreground">Tipo</th>
                          <th className="text-left py-4 px-4 font-semibold text-foreground">Valor</th>
                          <th className="text-left py-4 px-4 font-semibold text-foreground">Status</th>
                          <th className="text-left py-4 px-4 font-semibold text-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-4 text-sm text-muted-foreground">
                              {formatDate(transaction.processedAt)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  {getTypeIcon(transaction.type)}
                                </div>
                                <span className="text-sm font-medium">{getTypeLabel(transaction.type)}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-sm font-semibold ${
                                transaction.amount < 0 ? 'text-error' : 'text-success'
                              }`}>
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.status === 'completed'
                                  ? 'bg-success/10 text-success'
                                  : transaction.status === 'pending'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-error/10 text-error'
                              }`}>
                                {getStatusLabel(transaction.status)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpandedRow(transaction.id)}
                                className="flex items-center space-x-1"
                              >
                                {expandedRow === transaction.id ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                                <span>{expandedRow === transaction.id ? 'Ocultar' : 'Detalhes'}</span>
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-12 px-4 text-center">
                              <div className="flex flex-col items-center space-y-2">
                                <Receipt className="w-12 h-12 text-muted-foreground/50" />
                                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                                <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Detalhes Expandidos */}
                  {expandedRow && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border border-border/50">
                      {(() => {
                        const transaction = filteredTransactions.find(t => t.id === expandedRow)
                        if (!transaction) return null

                        return (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(transaction.type)}
                              <h4 className="font-semibold text-foreground">Detalhes da Transação</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                  <span className="text-sm font-medium text-muted-foreground">ID da Transação:</span>
                                  <span className="text-sm font-mono text-foreground">{transaction.id}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                  <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
                                  <span className="text-sm text-foreground">{getTypeLabel(transaction.type)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                  <span className="text-sm font-medium text-muted-foreground">Valor:</span>
                                  <span className={`text-sm font-semibold ${
                                    transaction.amount < 0 ? 'text-error' : 'text-success'
                                  }`}>
                                    {formatCurrency(transaction.amount)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                                  <span className={`text-sm font-medium ${
                                    transaction.status === 'completed'
                                      ? 'text-success'
                                      : transaction.status === 'pending'
                                      ? 'text-warning'
                                      : 'text-error'
                                  }`}>
                                    {getStatusLabel(transaction.status)}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-border/30">
                                  <span className="text-sm font-medium text-muted-foreground">Data:</span>
                                  <span className="text-sm text-foreground">{formatDate(transaction.processedAt)}</span>
                                </div>
                                {transaction.creditAmount && (
                                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                                    <span className="text-sm font-medium text-muted-foreground">Créditos:</span>
                                    <span className="text-sm text-foreground">{transaction.creditAmount}</span>
                                  </div>
                                )}
                                {transaction.paymentMethod && (
                                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                                    <span className="text-sm font-medium text-muted-foreground">Método:</span>
                                    <span className="text-sm text-foreground">{transaction.paymentMethod.toUpperCase()}</span>
                                  </div>
                                )}
                                {transaction.externalTransactionId && (
                                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                                    <span className="text-sm font-medium text-muted-foreground">ID Externo:</span>
                                    <span className="text-sm font-mono text-foreground">{transaction.externalTransactionId}</span>
                                  </div>
                                )}
                                {transaction.consultaId && (
                                  <div className="flex justify-between items-center py-2">
                                    <span className="text-sm font-medium text-muted-foreground">Consulta:</span>
                                    <span className="text-sm font-mono text-foreground">{transaction.consultaId}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}