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
    type: ''
  })
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Mock tenantId - em produção, obter do contexto de autenticação
  const tenantId = 'tenant-123'
  const userId = 'user-456'

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

    setFilteredTransactions(filtered)
  }, [transactions, filters])

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
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
      pending: 'text-yellow-600',
      completed: 'text-green-600',
      failed: 'text-red-600'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600'
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
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Page Header */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground">Extrato Financeiro</h1>
                <p className="text-muted-foreground mt-2">
                  Histórico completo de suas transações
                </p>
              </div>

              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Filtros</CardTitle>
                  <CardDescription>
                    Filtre suas transações por período e tipo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Data Inicial
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Data Final
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tipo
                      </label>
                      <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Todos</option>
                        <option value="credit_purchase">Compra de Créditos</option>
                        <option value="query_debit">Débito de Consulta</option>
                        <option value="refund">Reembolso</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de Transações */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Transações</CardTitle>
                  <CardDescription>
                    {filteredTransactions.length} transação(ões) encontrada(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-foreground">Data</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Tipo</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Valor</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 text-sm">
                              {formatDate(transaction.processedAt)}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {getTypeLabel(transaction.type)}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium">
                              <span className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className={getStatusColor(transaction.status)}>
                                {getStatusLabel(transaction.status)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleExpandedRow(transaction.id)}
                              >
                                {expandedRow === transaction.id ? 'Ocultar' : 'Detalhes'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 px-4 text-center text-muted-foreground">
                              Nenhuma transação encontrada
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Detalhes Expandidos */}
                  {expandedRow && (
                    <div className="mt-4 p-4 bg-muted rounded-md">
                      {(() => {
                        const transaction = filteredTransactions.find(t => t.id === expandedRow)
                        if (!transaction) return null

                        return (
                          <div className="space-y-2 text-sm">
                            <h4 className="font-medium">Detalhes da Transação</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p><strong>ID:</strong> {transaction.id}</p>
                                <p><strong>Tipo:</strong> {getTypeLabel(transaction.type)}</p>
                                <p><strong>Valor:</strong> {formatCurrency(transaction.amount)}</p>
                                <p><strong>Status:</strong> {getStatusLabel(transaction.status)}</p>
                              </div>
                              <div>
                                <p><strong>Data:</strong> {formatDate(transaction.processedAt)}</p>
                                {transaction.creditAmount && (
                                  <p><strong>Créditos:</strong> {transaction.creditAmount}</p>
                                )}
                                {transaction.paymentMethod && (
                                  <p><strong>Método:</strong> {transaction.paymentMethod.toUpperCase()}</p>
                                )}
                                {transaction.externalTransactionId && (
                                  <p><strong>ID Externo:</strong> {transaction.externalTransactionId}</p>
                                )}
                                {transaction.consultaId && (
                                  <p><strong>Consulta:</strong> {transaction.consultaId}</p>
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