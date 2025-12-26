// Baseado em: 1.Project.md, 4.Entities.md, 5.Pages.md (nova página proposta)
// Página de configurações do usuário - Minha Conta
// Permite visualizar e editar dados pessoais, configurações e preferências

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { useUserProfile } from '../hooks/useUserProfile'
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Bell,
  Palette,
  Globe,
  Shield,
  Key,
  Smartphone,
  History,
  Edit3,
  Save,
  X,
  Camera,
  Star,
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  Settings,
  Lock,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle
} from 'lucide-react'

export default function MinhaContaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  const { profile, loading, error, updateProfile } = useUserProfile()

  // Dados simulados para campos não implementados ainda
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    credits: 0,
    notifications: true,
    theme: 'light',
    language: 'pt-BR',
    avatar: '',
    joinDate: '2024-01-15',
    totalQueries: 245,
    favoriteService: 'Crédito'
  })

  // Atualizar estado local quando profile carregar
  useEffect(() => {
    if (profile) {
      setUser({
        name: profile.name,
        email: profile.email || '',
        phone: profile.phone || '',
        credits: profile.credits,
        notifications: profile.preferences?.notifications ?? true,
        theme: profile.preferences?.theme || 'light',
        language: profile.preferences?.language || 'pt-BR',
        avatar: profile.preferences?.avatar || '',
        joinDate: profile.joinDate,
        totalQueries: profile.totalQueries,
        favoriteService: profile.favoriteService
      })
    }
  }, [profile])

  const handleSave = async () => {
    try {
      const updates = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferences: {
          notifications: user.notifications,
          theme: user.theme,
          language: user.language,
          avatar: user.avatar
        }
      }

      const result = await updateProfile(updates)

      if (result.success) {
        setEditing(false)
        // Opcional: mostrar mensagem de sucesso
        console.log('Perfil atualizado com sucesso')
      } else {
        // Mostrar erro
        console.error('Erro ao atualizar perfil:', result.error)
        // TODO: mostrar toast de erro
      }
    } catch (error) {
      console.error('Erro inesperado ao salvar:', error)
      // TODO: mostrar toast de erro
    }
  }

  const handlePasswordChange = () => {
    // TODO: Implementar mudança de senha
    console.log('Alterando senha...')
  }

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'preferences', label: 'Preferências', icon: Settings },
    { id: 'history', label: 'Histórico', icon: History }
  ]

  const recentActivity = [
    { type: 'Consulta de Crédito', date: '21/12/2025 14:30', cost: 2, status: 'success' },
    { type: 'Compra de Créditos', date: '20/12/2025 10:15', cost: -100, status: 'success' },
    { type: 'Consulta Cadastral', date: '19/12/2025 16:45', cost: 1, status: 'success' },
    { type: 'Consulta Veicular', date: '18/12/2025 09:20', cost: 3, status: 'failed' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pb-20">
          <div className="p-6">
            <div className="max-w-6xl mx-auto space-y-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-3xl mb-6">
                    <User className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <p className="text-muted-foreground">Carregando perfil...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-3xl mb-6">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-red-600 dark:text-red-400">Erro ao carregar perfil: {error}</p>
                  <Button onClick={() => window.location.reload()} className="mt-4">
                    Tentar Novamente
                  </Button>
                </div>
              ) : (
                <div>
                  {/* Header Section */}
                  <div className="text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 rounded-3xl blur-3xl -z-10"></div>
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-6 shadow-lg">
                      <User className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                      Minha Conta
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      Gerencie suas informações pessoais e preferências
                    </p>
                  </div>

                  {/* Profile Overview Card */}
                  <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl">
                    <CardContent className="p-8">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
                            <User className="w-12 h-12 text-primary-foreground" />
                          </div>
                          <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/80 transition-colors">
                            <Camera className="w-4 h-4 text-primary-foreground" />
                          </button>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                          <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                          <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </p>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                              <CreditCard className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{user.credits} créditos</span>
                            </div>
                            <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Membro desde {new Date(user.joinDate).toLocaleDateString("pt-BR")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{user.totalQueries}</div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">Consultas</div>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                            <Star className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <div className="text-lg font-bold text-green-700 dark:text-green-300">{user.favoriteService}</div>
                            <div className="text-xs text-green-600 dark:text-green-400">Favorito</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabs Navigation */}
                  <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-xl">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="space-y-6">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Dados Pessoais */}
                        <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-xl">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <User className="w-5 h-5 text-primary" />
                              Dados Pessoais
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {editing ? (
                              <>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    Nome Completo
                                  </label>
                                  <input
                                    type="text"
                                    value={user.name}
                                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-border/50 rounded-lg bg-background focus:border-primary transition-colors"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    Email
                                  </label>
                                  <input
                                    type="email"
                                    value={user.email}
                                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-border/50 rounded-lg bg-background focus:border-primary transition-colors"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    Telefone
                                  </label>
                                  <input
                                    type="tel"
                                    value={user.phone}
                                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                                    className="w-full px-4 py-3 border border-border/50 rounded-lg bg-background focus:border-primary transition-colors"
                                  />
                                </div>
                                <div className="flex gap-3">
                                  <Button onClick={handleSave} className="flex-1 gap-2">
                                    <Save className="w-4 h-4" />
                                    Salvar
                                  </Button>
                                  <Button variant="outline" onClick={() => setEditing(false)} className="gap-2">
                                    <X className="w-4 h-4" />
                                    Cancelar
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm text-muted-foreground">Nome</p>
                                      <p className="font-medium">{user.name}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <Mail className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm text-muted-foreground">Email</p>
                                      <p className="font-medium">{user.email}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <Phone className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm text-muted-foreground">Telefone</p>
                                      <p className="font-medium">{user.phone}</p>
                                    </div>
                                  </div>
                                </div>
                                <Button onClick={() => setEditing(true)} className="w-full gap-2">
                                  <Edit3 className="w-4 h-4" />
                                  Editar Dados
                                </Button>
                              </>
                            )}
                          </CardContent>
                        </Card>

                        {/* Créditos Disponíveis */}
                        <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-xl">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <CreditCard className="w-5 h-5 text-primary" />
                              Créditos Disponíveis
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="text-center">
                              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-4 shadow-lg">
                                <DollarSign className="w-8 h-8 text-white" />
                              </div>
                              <div className="text-3xl font-bold text-green-600 mb-2">{user.credits}</div>
                              <p className="text-muted-foreground">créditos disponíveis</p>
                            </div>
                            <div className="space-y-3">
                              <Button className="w-full gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Comprar Créditos
                              </Button>
                              <Button variant="outline" className="w-full gap-2">
                                <History className="w-4 h-4" />
                                Ver Extrato
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Alterar Senha */}
                        <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-xl">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Key className="w-5 h-5 text-primary" />
                              Alterar Senha
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Senha Atual</label>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={passwordData.current}
                                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                                  className="w-full px-4 py-3 pr-12 border border-border/50 rounded-lg bg-background focus:border-primary transition-colors"
                                  placeholder="Digite sua senha atual"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Nova Senha</label>
                              <input
                                type="password"
                                value={passwordData.new}
                                onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                                className="w-full px-4 py-3 border border-border/50 rounded-lg bg-background focus:border-primary transition-colors"
                                placeholder="Digite a nova senha"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Confirmar Nova Senha</label>
                              <input
                                type="password"
                                value={passwordData.confirm}
                                onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                                className="w-full px-4 py-3 border border-border/50 rounded-lg bg-background focus:border-primary transition-colors"
                                placeholder="Confirme a nova senha"
                              />
                            </div>
                            <Button onClick={handlePasswordChange} className="w-full gap-2">
                              <Lock className="w-4 h-4" />
                              Alterar Senha
                            </Button>
                          </CardContent>
                        </Card>

                        {/* Segurança da Conta */}
                        <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-xl">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Shield className="w-5 h-5 text-primary" />
                              Segurança da Conta
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">Autenticação 2FA</p>
                                    <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">Configurar</Button>
                              </div>

                              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <History className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">Sessões Ativas</p>
                                    <p className="text-sm text-muted-foreground">Gerencie seus dispositivos conectados</p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm">Ver</Button>
                              </div>

                              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-3">
                                  <Trash2 className="w-5 h-5 text-red-600" />
                                  <div>
                                    <p className="font-medium text-red-900 dark:text-red-100">Excluir Conta</p>
                                    <p className="text-sm text-red-700 dark:text-red-300">Esta ação não pode ser desfeita</p>
                                  </div>
                                </div>
                                <Button variant="destructive" size="sm">Excluir</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                      <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            Preferências
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-medium flex items-center gap-2">
                                <Bell className="w-4 h-4 text-muted-foreground" />
                                Notificações por Email
                              </label>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={user.notifications}
                                  onChange={(e) => setUser({ ...user, notifications: e.target.checked })}
                                  className="w-5 h-5 text-primary border-border rounded focus:ring-primary focus:ring-2"
                                />
                                <span className="text-sm text-muted-foreground">
                                  Receber notificações sobre consultas e atualizações
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium flex items-center gap-2">
                                <Palette className="w-4 h-4 text-muted-foreground" />
                                Tema Preferido
                              </label>
                              <select
                                value={user.theme}
                                onChange={(e) => setUser({ ...user, theme: e.target.value })}
                                className="w-full px-4 py-3 border border-border/50 rounded-lg bg-background focus:border-primary transition-colors"
                              >
                                <option value="light">🌞 Claro</option>
                                <option value="dark">🌙 Escuro</option>
                                <option value="auto">🔄 Automático</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium flex items-center gap-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                Idioma
                              </label>
                              <select
                                value={user.language}
                                onChange={(e) => setUser({ ...user, language: e.target.value })}
                                className="w-full px-4 py-3 border border-border/50 rounded-lg bg-background focus:border-primary transition-colors"
                              >
                                <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                                <option value="en-US">🇺🇸 English (US)</option>
                                <option value="es-ES">🇪🇸 Español</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button onClick={handleSave} className="gap-2">
                              <Save className="w-4 h-4" />
                              Salvar Preferências
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                      <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5 text-primary" />
                            Histórico de Atividades
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`p-2 rounded-lg ${
                                    activity.status === 'success'
                                      ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                                      : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                  }`}>
                                    {activity.type.includes('Consulta') ? (
                                      <Activity className="w-5 h-5" />
                                    ) : activity.type.includes('Compra') ? (
                                      <CreditCard className="w-5 h-5" />
                                    ) : (
                                      <History className="w-5 h-5" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{activity.type}</p>
                                    <p className="text-sm text-muted-foreground">{activity.date}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className={`font-medium ${
                                      activity.cost > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      {activity.cost > 0 ? '-' : '+'}
                                      {Math.abs(activity.cost)} Crédito{Math.abs(activity.cost) !== 1 ? 's' : ''}
                                    </p>
                                  </div>

                                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                                    activity.status === 'success'
                                      ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                      : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                  }`}>
                                    {activity.status === 'success' ? (
                                      <CheckCircle className="w-4 h-4" />
                                    ) : (
                                      <X className="w-4 h-4" />
                                    )}
                                    {activity.status === 'success' ? 'Sucesso' : 'Falhou'}
                                  </div>

                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Eye className="w-4 h-4" />
                                    Detalhes
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-6 text-center">
                            <Button variant="outline" className="gap-2">
                              <History className="w-4 h-4" />
                              Ver Histórico Completo
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
