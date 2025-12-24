// Baseado em: 5.Pages.md v1.1, 8.DesignSystem.md
// TASK-009: Desenvolver Relatório de Consultas
// Entidades: Consulta
// Componentes: Table, Button
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'

interface Consulta {
  id: string
  type: 'credito' | 'cadastral' | 'veicular'
  executedAt: Date
  cost: number
  status: 'success' | 'failed'
  input: any
  output: any
}

export default function RelatorioConsultas() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [filteredConsultas, setFilteredConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: '',
    status: ''
  })
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // TODO: Buscar dados reais das consultas do usuário isoladas por tenant
  useEffect(() => {
    // Mock data
    const mockConsultas: Consulta[] = [
      {
        id: '1',
        type: 'credito',
        executedAt: new Date('2025-12-15T10:00:00'),
        cost: 2.50,
        status: 'success',
        input: { cpf: '123.456.789-00' },
        output: { score: 750, restrictions: false }
      },
      {
        id: '2',
        type: 'cadastral',
        executedAt: new Date('2025-12-14T14:30:00'),
        cost: 1.50,
        status: 'success',
        input: { cpf: '987.654.321-00' },
        output: { name: 'João Silva', processes: 0 }
      },
      {
        id: '3',
        type: 'veicular',
        executedAt: new Date('2025-12-13T09:15:00'),
        cost: 2.00,
        status: 'failed',
        input: { placa: 'ABC-1234' },
        output: { error: 'Veículo não encontrado' }
      }
    ]

    setConsultas(mockConsultas)
    setFilteredConsultas(mockConsultas)
    setLoading(false)
  }, [])

  useEffect(() => {
    let filtered = consultas

    if (filters.dateFrom) {
      filtered = filtered.filter(c => c.executedAt >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter(c => c.executedAt <= new Date(filters.dateTo + 'T23:59:59'))
    }
    if (filters.type) {
      filtered = filtered.filter(c => c.type === filters.type)
    }
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status)
    }

    setFilteredConsultas(filtered)
  }, [consultas, filters])

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const exportToCSV = () => {
    const headers = ['Tipo', 'Data/Hora', 'Custo', 'Status']
    const rows = filteredConsultas.map(c => [
      c.type,
      c.executedAt.toLocaleString(),
      c.cost.toFixed(2),
      c.status
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'relatorio-consultas.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(filteredConsultas, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'relatorio-consultas.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatType = (type: string) => {
    const types = {
      credito: 'Crédito',
      cadastral: 'Cadastral',
      veicular: 'Veicular'
    }
    return types[type as keyof typeof types] || type
  }

  const formatStatus = (status: string) => {
    return status === 'success' ? 'Sucesso' : 'Falha'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 lg:ml-64 pb-20">
            <div className="p-6">
              <div className="text-center">Carregando...</div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    )
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
                <h1 className="text-3xl font-bold text-foreground">Relatório de Consultas</h1>
                <p className="text-muted-foreground mt-2">
                  Visualize e filtre suas consultas realizadas
                </p>
              </div>

              {/* Filters */}
              <div className="bg-card p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Filtros</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Data Final
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Tipo
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Todos</option>
                      <option value="credito">Crédito</option>
                      <option value="cadastral">Cadastral</option>
                      <option value="veicular">Veicular</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Todos</option>
                      <option value="success">Sucesso</option>
                      <option value="failed">Falha</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex space-x-4">
                <Button onClick={exportToCSV}>
                  Exportar CSV
                </Button>
                <Button onClick={exportToJSON} variant="outline">
                  Exportar JSON
                </Button>
              </div>

              {/* Table */}
              <div className="bg-card rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Data/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Custo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {filteredConsultas.map((consulta) => (
                      <React.Fragment key={consulta.id}>
                        <tr className="hover:bg-muted">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatType(consulta.type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {consulta.executedAt.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            R$ {consulta.cost.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              consulta.status === 'success'
                                ? 'bg-success text-success-foreground'
                                : 'bg-error text-error-foreground'
                            }`}>
                              {formatStatus(consulta.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button
                              onClick={() => toggleRowExpansion(consulta.id)}
                              variant="outline"
                              size="sm"
                            >
                              {expandedRows.has(consulta.id) ? 'Ocultar' : 'Detalhes'}
                            </Button>
                          </td>
                        </tr>
                        {expandedRows.has(consulta.id) && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-muted">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-foreground mb-2">Entrada</h4>
                                  <pre className="text-sm text-muted-foreground bg-card p-2 rounded border overflow-x-auto">
                                    {JSON.stringify(consulta.input, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <h4 className="font-medium text-foreground mb-2">Saída</h4>
                                  <pre className="text-sm text-muted-foreground bg-card p-2 rounded border overflow-x-auto">
                                    {JSON.stringify(consulta.output, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                {filteredConsultas.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma consulta encontrada com os filtros aplicados.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}