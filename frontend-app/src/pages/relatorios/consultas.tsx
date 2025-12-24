// Baseado em: 5.Pages.md v1.1, 8.DesignSystem.md
// TASK-009: Desenvolver Relatório de Consultas
// Entidades: Consulta
// Componentes: Table, Button
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import {
  BarChart3,
  Filter,
  Download,
  FileText,
  Calendar,
  Search,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Database
} from 'lucide-react'

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
    status: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Calcular estatísticas
  const stats = {
    totalConsultas: filteredConsultas.length,
    consultasSucesso: filteredConsultas.filter(c => c.status === 'success').length,
    consultasFalha: filteredConsultas.filter(c => c.status === 'failed').length,
    custoTotal: filteredConsultas.reduce((sum, c) => sum + c.cost, 0),
    consultasPorTipo: {
      credito: filteredConsultas.filter(c => c.type === 'credito').length,
      cadastral: filteredConsultas.filter(c => c.type === 'cadastral').length,
      veicular: filteredConsultas.filter(c => c.type === 'veicular').length,
    }
  }

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
      },
      {
        id: '4',
        type: 'credito',
        executedAt: new Date('2025-12-12T16:45:00'),
        cost: 2.50,
        status: 'success',
        input: { cpf: '111.222.333-44' },
        output: { score: 680, restrictions: true }
      },
      {
        id: '5',
        type: 'cadastral',
        executedAt: new Date('2025-12-11T11:20:00'),
        cost: 1.50,
        status: 'success',
        input: { cnpj: '12.345.678/0001-90' },
        output: { companyName: 'Empresa XYZ Ltda', status: 'active' }
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
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(c =>
        c.id.toLowerCase().includes(searchLower) ||
        JSON.stringify(c.input).toLowerCase().includes(searchLower) ||
        JSON.stringify(c.output).toLowerCase().includes(searchLower)
      )
    }

    setFilteredConsultas(filtered)
  }, [consultas, filters])

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      type: '',
      status: '',
      search: ''
    })
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
    const headers = ['ID', 'Tipo', 'Data/Hora', 'Custo', 'Status', 'Entrada', 'Saída']
    const rows = filteredConsultas.map(c => [
      c.id,
      formatType(c.type),
      c.executedAt.toLocaleString(),
      c.cost.toFixed(2),
      formatStatus(c.status),
      JSON.stringify(c.input),
      JSON.stringify(c.output)
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-consultas-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(filteredConsultas, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-consultas-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
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

  const getStatusColor = (status: string) => {
    return status === 'success' ? 'text-success' : 'text-error'
  }

  const getStatusBgColor = (status: string) => {
    return status === 'success' ? 'bg-success/10' : 'bg-error/10'
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      credito: <TrendingUp className="w-4 h-4" />,
      cadastral: <Database className="w-4 h-4" />,
      veicular: <BarChart3 className="w-4 h-4" />
    }
    return icons[type as keyof typeof icons] || <FileText className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 lg:ml-64 pb-20">
            <div className="p-6">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
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
                  <BarChart3 className="w-8 h-8 text-primary-foreground" />
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Relatório de Consultas</h1>
                <p className="text-muted-foreground text-lg">
                  Visualize e analise suas consultas realizadas na plataforma
                </p>
              </div>

              {/* Estatísticas Resumidas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total de Consultas</p>
                        <p className="text-2xl font-bold text-primary">{stats.totalConsultas}</p>
                      </div>
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-success/10 to-success/5 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Consultas Bem-sucedidas</p>
                        <p className="text-2xl font-bold text-success">{stats.consultasSucesso}</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.totalConsultas > 0 ? ((stats.consultasSucesso / stats.totalConsultas) * 100).toFixed(1) : 0}% do total
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-error/10 to-error/5 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Consultas com Falha</p>
                        <p className="text-2xl font-bold text-error">{stats.consultasFalha}</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.totalConsultas > 0 ? ((stats.consultasFalha / stats.totalConsultas) * 100).toFixed(1) : 0}% do total
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-error/20 rounded-full flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-error" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-info/10 to-info/5 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Custo Total</p>
                        <p className="text-2xl font-bold text-info">{formatCurrency(stats.custoTotal)}</p>
                        <p className="text-xs text-muted-foreground">
                          Média: {stats.totalConsultas > 0 ? formatCurrency(stats.custoTotal / stats.totalConsultas) : formatCurrency(0)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-info/20 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-info" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros e Ações */}
              <Card className="shadow-xl border-0 bg-gradient-to-br from-card to-card/95 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-5 h-5 text-primary" />
                      <CardTitle className="text-xl">Filtros e Busca</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
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
                  </div>
                  <CardDescription>
                    Refine sua busca por período, tipo, status ou termo específico
                  </CardDescription>
                </CardHeader>

                {showFilters && (
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Data Inicial
                        </label>
                        <input
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
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
                          value={filters.dateTo}
                          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Tipo
                        </label>
                        <select
                          value={filters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        >
                          <option value="">Todos os tipos</option>
                          <option value="credito">Crédito</option>
                          <option value="cadastral">Cadastral</option>
                          <option value="veicular">Veicular</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Status
                        </label>
                        <select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                        >
                          <option value="">Todos os status</option>
                          <option value="success">Sucesso</option>
                          <option value="failed">Falha</option>
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
                          placeholder="ID, CPF, placa..."
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

              {/* Export Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button onClick={exportToCSV} className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar CSV</span>
                </Button>
                <Button onClick={exportToJSON} variant="outline" className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Exportar JSON</span>
                </Button>
              </div>

              {/* Tabela de Consultas */}
              <Card className="shadow-xl border-0 bg-gradient-to-br from-card to-card/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Database className="w-5 h-5 mr-2 text-primary" />
                    Histórico de Consultas
                  </CardTitle>
                  <CardDescription>
                    {filteredConsultas.length} consulta(s) encontrada(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-4 px-4 font-semibold text-foreground">Tipo</th>
                          <th className="text-left py-4 px-4 font-semibold text-foreground">Data/Hora</th>
                          <th className="text-left py-4 px-4 font-semibold text-foreground">Custo</th>
                          <th className="text-left py-4 px-4 font-semibold text-foreground">Status</th>
                          <th className="text-left py-4 px-4 font-semibold text-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredConsultas.map((consulta) => (
                          <React.Fragment key={consulta.id}>
                            <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    {getTypeIcon(consulta.type)}
                                  </div>
                                  <span className="text-sm font-medium">{formatType(consulta.type)}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-sm text-muted-foreground">
                                {consulta.executedAt.toLocaleString('pt-BR')}
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm font-semibold text-foreground">
                                  {formatCurrency(consulta.cost)}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  consulta.status === 'success'
                                    ? 'bg-success/10 text-success'
                                    : 'bg-error/10 text-error'
                                }`}>
                                  {consulta.status === 'success' ? (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  ) : (
                                    <XCircle className="w-3 h-3 mr-1" />
                                  )}
                                  {formatStatus(consulta.status)}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRowExpansion(consulta.id)}
                                  className="flex items-center space-x-1"
                                >
                                  {expandedRows.has(consulta.id) ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                  <span>{expandedRows.has(consulta.id) ? 'Ocultar' : 'Detalhes'}</span>
                                </Button>
                              </td>
                            </tr>
                            {expandedRows.has(consulta.id) && (
                              <tr>
                                <td colSpan={5} className="px-4 py-6 bg-gradient-to-r from-muted/50 to-muted/30">
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                      <div className="flex items-center space-x-2">
                                        <TrendingDown className="w-4 h-4 text-primary" />
                                        <h4 className="font-medium text-foreground">Dados de Entrada</h4>
                                      </div>
                                      <div className="bg-card/50 p-3 rounded-md border border-border/50">
                                        <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                                          {JSON.stringify(consulta.input, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      <div className="flex items-center space-x-2">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        <h4 className="font-medium text-foreground">Resultado da Consulta</h4>
                                      </div>
                                      <div className={`p-3 rounded-md border ${
                                        consulta.status === 'success'
                                          ? 'bg-success/5 border-success/20'
                                          : 'bg-error/5 border-error/20'
                                      }`}>
                                        <pre className={`text-xs overflow-x-auto whitespace-pre-wrap ${
                                          consulta.status === 'success' ? 'text-success-foreground' : 'text-error-foreground'
                                        }`}>
                                          {JSON.stringify(consulta.output, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4 pt-4 border-t border-border/50">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                      <span>ID da Consulta: <span className="font-mono text-foreground">{consulta.id}</span></span>
                                      <span>Executada em: {consulta.executedAt.toLocaleString('pt-BR')}</span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                        {filteredConsultas.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-12 px-4 text-center">
                              <div className="flex flex-col items-center space-y-2">
                                <Database className="w-12 h-12 text-muted-foreground/50" />
                                <p className="text-muted-foreground">Nenhuma consulta encontrada</p>
                                <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca</p>
                              </div>
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