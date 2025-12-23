// Dashboard page (moved from index)
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const userCredits = {
    available: 150,
    previous: 200,
    blocked: 0,
    lastUpdate: new Date().toLocaleDateString('pt-BR')
  }

  const recentConsultations = [
    { id: '1', type: 'Crédito', date: '2025-01-15', status: 'Sucesso' },
    { id: '2', type: 'Cadastral', date: '2025-01-14', status: 'Sucesso' },
    { id: '3', type: 'Veicular', date: '2025-01-13', status: 'Falha' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-64 pb-20">
          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-2">Bem-vindo ao BigTech - Gestão de Consultas</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Saldo Disponível</CardDescription>
                    <CardTitle className="text-2xl text-success">{userCredits.available}</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Saldo Anterior</CardDescription>
                    <CardTitle className="text-2xl text-primary">{userCredits.previous}</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Saldo Bloqueado</CardDescription>
                    <CardTitle className="text-2xl text-destructive">{userCredits.blocked}</CardTitle>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Última Atualização</CardDescription>
                    <CardTitle className="text-sm text-muted-foreground">{userCredits.lastUpdate}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>Consulta de Crédito</CardTitle>
                    <CardDescription>
                      Verifique informações de crédito de pessoas físicas e jurídicas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Acessar Consultas</Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>Consulta Cadastral</CardTitle>
                    <CardDescription>
                      Dados cadastrais completos para validação de identidade
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Acessar Consultas</Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>Consulta Veicular</CardTitle>
                    <CardDescription>
                      Informações veiculares por placa e estado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Acessar Consultas</Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Últimas Consultas Realizadas</CardTitle>
                  <CardDescription>
                    Histórico das suas consultas mais recentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Tipo</th>
                          <th className="text-left p-2">Data</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentConsultations.map((consultation) => (
                          <tr key={consultation.id} className="border-b hover:bg-muted">
                            <td className="p-2">{consultation.type}</td>
                            <td className="p-2">{consultation.date}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                consultation.status === 'Sucesso'
                                  ? 'bg-success text-success-foreground'
                                  : 'bg-error text-error-foreground'
                              }`}>
                                {consultation.status}
                              </span>
                            </td>
                            <td className="p-2">
                              <Button variant="outline" size="sm">
                                Ver Detalhes
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}
