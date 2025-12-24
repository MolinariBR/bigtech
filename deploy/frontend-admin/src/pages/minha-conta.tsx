// Baseado em: 1.Project.md, 4.Entities.md, 5.Pages.md (nova página proposta)
// Página de conta do administrador - Minha Conta
// Permite visualizar e editar dados pessoais e configurações administrativas

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

export default function AccountPage() {
  const { theme, setThemePreference } = useTheme()
  const [user, setUser] = useState<{
    name: string;
    email: string;
    phone: string;
    role: string;
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    systemAlerts: boolean;
  }>({
    name: '',
    email: '',
    phone: '',
    role: 'admin',
    notifications: true,
    theme: theme, // Inicializar com o tema atual
    language: 'pt-BR',
    systemAlerts: true
  })
  const [editing, setEditing] = useState(false)

  // Simulação de carregamento de dados - substituir por API real
  useEffect(() => {
    // TODO: Buscar dados do usuário admin via API (User entity: name, email, role)
    setUser(prev => ({ ...prev, theme }))
  }, [theme])

  // Simulação de carregamento de dados - substituir por API real
  useEffect(() => {
    // TODO: Buscar dados do usuário admin via API (User entity: name, email, role)
    setUser({
      name: 'Admin Silva',
      email: 'admin@bigtech.com',
      phone: '(11) 99999-9999',
      role: 'admin',
      notifications: true,
      theme: theme,
      language: 'pt-BR',
      systemAlerts: true
    })
  }, [])

  const handleSave = () => {
    // TODO: Salvar alterações via API
    // Aplicar o tema selecionado
    setThemePreference(user.theme as 'light' | 'dark' | 'auto')
    setEditing(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Minha Conta</h1>
        <p className="text-muted-foreground mt-2">Gerencie suas informações pessoais e configurações administrativas</p>
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
                        <p><strong>Função:</strong> {user.role}</p>
                        <Button onClick={() => setEditing(true)}>Editar Dados</Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Configurações Gerais */}
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações Gerais</CardTitle>
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
                    <div className="flex items-center justify-between">
                      <span>Alertas do Sistema</span>
                      <input
                        type="checkbox"
                        checked={user.systemAlerts}
                        onChange={(e) => setUser({ ...user, systemAlerts: e.target.checked })}
                        className="rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tema Preferido</label>
                      <select
                        value={user.theme}
                        onChange={(e) => setUser({ ...user, theme: e.target.value as 'light' | 'dark' | 'auto' })}
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

                {/* Atividades Recentes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Atividades Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Último login: 21/12/2025 às 14:30</p>
                    <p className="text-sm text-muted-foreground">Última ação: Configuração de plugin - 20/12/2025</p>
                    <Button variant="outline" className="mt-4">Ver Log Completo</Button>
                  </CardContent>
                </Card>
              </div>
    </div>
  )
}