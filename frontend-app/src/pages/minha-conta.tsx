// Baseado em: 1.Project.md, 4.Entities.md, 5.Pages.md (nova página proposta)
// Página de configurações do usuário - Minha Conta
// Permite visualizar e editar dados pessoais, configurações e preferências

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'

export default function MinhaContaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    credits: 0,
    notifications: true,
    theme: 'light',
    language: 'pt-BR'
  })
  const [editing, setEditing] = useState(false)

  // Simulação de carregamento de dados - substituir por API real
  useEffect(() => {
    // TODO: Buscar dados do usuário via API (User entity: name, email, credits)
    setUser({
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '(11) 99999-9999',
      credits: 150,
      notifications: true,
      theme: 'light',
      language: 'pt-BR'
    })
  }, [])

  const handleSave = () => {
    // TODO: Salvar alterações via API
    setEditing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pb-20">
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground">Minha Conta</h1>
                <p className="text-muted-foreground mt-2">Gerencie suas informações pessoais, configurações e preferências</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Dados Pessoais */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dados Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editing ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Nome Completo</label>
                          <input
                            type="text"
                            value={user.name}
                            onChange={(e) => setUser({ ...user, name: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Email</label>
                          <input
                            type="email"
                            value={user.email}
                            onChange={(e) => setUser({ ...user, email: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Telefone</label>
                          <input
                            type="tel"
                            value={user.phone}
                            onChange={(e) => setUser({ ...user, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleSave}>Salvar</Button>
                          <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p><strong>Nome:</strong> {user.name}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Telefone:</strong> {user.phone}</p>
                        <Button onClick={() => setEditing(true)}>Editar Dados</Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Créditos Disponíveis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Créditos Disponíveis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">{user.credits} créditos</p>
                    <p className="text-sm text-muted-foreground mt-2">Use seus créditos para executar consultas</p>
                    <Button className="mt-4 w-full">Comprar Créditos</Button>
                  </CardContent>
                </Card>

                {/* Configurações */}
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Notificações por Email</span>
                      <input
                        type="checkbox"
                        checked={user.notifications}
                        onChange={(e) => setUser({ ...user, notifications: e.target.checked })}
                        className="rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tema Preferido</label>
                      <select
                        value={user.theme}
                        onChange={(e) => setUser({ ...user, theme: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="light">Claro</option>
                        <option value="dark">Escuro</option>
                        <option value="auto">Automático</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Idioma</label>
                      <select
                        value={user.language}
                        onChange={(e) => setUser({ ...user, language: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                      </select>
                    </div>
                    <Button onClick={handleSave} className="w-full">Salvar Configurações</Button>
                  </CardContent>
                </Card>

                {/* Segurança */}
                <Card>
                  <CardHeader>
                    <CardTitle>Segurança</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full">Alterar Senha</Button>
                    <Button variant="outline" className="w-full">Configurar Autenticação 2FA</Button>
                    <Button variant="outline" className="w-full">Histórico de Sessões</Button>
                    <Button variant="destructive" className="w-full">Excluir Conta</Button>
                  </CardContent>
                </Card>
              </div>

              {/* Histórico Recente */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Última consulta: 21/12/2025 às 14:30</p>
                  <p className="text-sm text-muted-foreground">Última compra: 20/12/2025 - 100 créditos</p>
                  <Button variant="outline" className="mt-4">Ver Histórico Completo</Button>
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