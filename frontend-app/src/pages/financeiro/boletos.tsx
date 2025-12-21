// Baseado em: 5.Pages.md v1.2, 8.DesignSystem.md v1.1
// TASK-010.3: Implementar Boletos e Faturas
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
  paymentMethod?: string
  externalTransactionId?: string
  boletoUrl?: string // URL para download do boleto
  dueDate?: string // Data de vencimento
}

export default function BoletosFaturas() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [boletos, setBoletos] = useState<BillingTransaction[]>([])
  const [filteredBoletos, setFilteredBoletos] = useState<BillingTransaction[]>([])
  const [filters, setFilters] = useState({
    status: ''
  })

  // Mock tenantId - em produção, obter do contexto de autenticação
  const tenantId = 'tenant-123'
  const userId = 'user-456'

  // Mock data - em produção, buscar da API (apenas transações que geram boletos)
  useEffect(() => {
    const mockBoletos: BillingTransaction[] = [
      {
        id: '1',
        tenantId,
        userId,
        type: 'credit_purchase',
        amount: 50.00,
        currency: 'BRL',
        status: 'pending',
        processedAt: '2025-12-20T10:00:00Z',
        paymentMethod: 'boleto',
        externalTransactionId: 'BOL-123456',
        boletoUrl: 'https://example.com/boleto/123456.pdf',
        dueDate: '2025-12-25T23:59:59Z'
      },
      {
        id: '2',
        tenantId,
        userId,
        type: 'credit_purchase',
        amount: 100.00,
        currency: 'BRL',
        status: 'completed',
        processedAt: '2025-12-15T14:30:00Z',
        paymentMethod: 'boleto',
        externalTransactionId: 'BOL-789012',
        boletoUrl: 'https://example.com/boleto/789012.pdf',
        dueDate: '2025-12-20T23:59:59Z'
      },
      {
        id: '3',
        tenantId,
        userId,
        type: 'credit_purchase',
        amount: 25.00,
        currency: 'BRL',
        status: 'failed',
        processedAt: '2025-12-10T09:15:00Z',
        paymentMethod: 'boleto',
        externalTransactionId: 'BOL-345678',
        boletoUrl: 'https://example.com/boleto/345678.pdf',
        dueDate: '2025-12-15T23:59:59Z'
      }
    ]
    setBoletos(mockBoletos)
    setFilteredBoletos(mockBoletos)
  }, [tenantId, userId])

  // Aplicar filtros
  useEffect(() => {
    let filtered = boletos

    if (filters.status) {
      filtered = filtered.filter(b => b.status === filters.status)
    }

    setFilteredBoletos(filtered)
  }, [boletos, filters])

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
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
      year: 'numeric'
    })
  }

  const getStatusLabel = (status: string): string => {
    const labels = {
      pending: 'Pendente',
      completed: 'Pago',
      failed: 'Vencido/Falhou'
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

  const handleDownloadBoleto = (boletoUrl: string, transactionId: string) => {
    // Em produção, isso seria um link direto ou download via API
    window.open(boletoUrl, '_blank')
  }

  const getVencimentoStatus = (dueDate: string): { label: string; color: string } => {
    const now = new Date()
    const due = new Date(dueDate)

    if (now > due) {
      return { label: 'Vencido', color: 'text-red-600' }
    } else if (now.getTime() + (3 * 24 * 60 * 60 * 1000) > due.getTime()) { // 3 dias
      return { label: 'Vence em breve', color: 'text-orange-600' }
    } else {
      return { label: 'Em dia', color: 'text-green-600' }
    }
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
                <h1 className="text-3xl font-bold text-foreground">Boletos e Faturas</h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie seus boletos pendentes e pagamentos realizados
                </p>
              </div>

              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Filtros</CardTitle>
                  <CardDescription>
                    Filtre seus boletos por status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Todos</option>
                        <option value="pending">Pendente</option>
                        <option value="completed">Pago</option>
                        <option value="failed">Vencido/Falhou</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de Boletos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Boletos</CardTitle>
                  <CardDescription>
                    {filteredBoletos.length} boleto(s) encontrado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-foreground">Data</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Valor</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Vencimento</th>
                          <th className="text-left py-3 px-4 font-medium text-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBoletos.map((boleto) => (
                          <tr key={boleto.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 text-sm">
                              {formatDate(boleto.processedAt)}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium">
                              {formatCurrency(boleto.amount)}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span className={getStatusColor(boleto.status)}>
                                {getStatusLabel(boleto.status)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {boleto.dueDate && (
                                <span className={getVencimentoStatus(boleto.dueDate).color}>
                                  {formatDate(boleto.dueDate)} - {getVencimentoStatus(boleto.dueDate).label}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {boleto.boletoUrl && boleto.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadBoleto(boleto.boletoUrl!, boleto.id)}
                                >
                                  Baixar Boleto
                                </Button>
                              )}
                              {boleto.status === 'completed' && (
                                <span className="text-green-600 text-sm">Pago</span>
                              )}
                              {boleto.status === 'failed' && (
                                <span className="text-red-600 text-sm">Falhou</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredBoletos.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 px-4 text-center text-muted-foreground">
                              Nenhum boleto encontrado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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