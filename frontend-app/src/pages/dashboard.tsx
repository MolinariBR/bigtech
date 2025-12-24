// Dashboard page (moved from index)
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'
import {
  CreditCard,
  Users,
  Car,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  BarChart3,
  Activity,
  Shield,
  Star,
  ArrowRight,
  Eye
} from 'lucide-react'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const userCredits = {
    available: 150,
    previous: 200,
    blocked: 0,
    lastUpdate: new Date().toLocaleDateString('pt-BR')
  }

  const recentConsultations = [
    { id: '1', type: 'Crédito', date: '2025-01-15', status: 'Sucesso', icon: CreditCard, cost: 2 },
    { id: '2', type: 'Cadastral', date: '2025-01-14', status: 'Sucesso', icon: Users, cost: 1 },
    { id: '3', type: 'Veicular', date: '2025-01-13', status: 'Falha', icon: Car, cost: 3 },
  ]

  const quickStats = [
    {
      title: 'Consultas Hoje',
      value: '12',
      change: '+20%',
      trend: 'up',
      icon: Activity,
      color: 'text-blue-600'
    },
    {
      title: 'Créditos Usados',
      value: '45',
      change: '+15%',
      trend: 'up',
      icon: Zap,
      color: 'text-orange-600'
    },
    {
      title: 'Taxa de Sucesso',
      value: '94%',
      change: '+2%',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Tempo Médio',
      value: '2.3s',
      change: '-0.5s',
      trend: 'down',
      icon: Clock,
      color: 'text-purple-600'
    }
  ]

  const services = [
    {
      title: 'Consulta de Crédito',
      description: 'Verifique informações de crédito de pessoas físicas e jurídicas',
      icon: CreditCard,
      href: '/consulta/credito',
      color: 'from-blue-500 to-blue-600',
      popular: true
    },
    {
      title: 'Consulta Cadastral',
      description: 'Dados cadastrais completos para validação de identidade',
      icon: Users,
      href: '/consulta/cadastral',
      color: 'from-green-500 to-green-600',
      popular: false
    },
    {
      title: 'Consulta Veicular',
      description: 'Informações veiculares por placa e estado',
      icon: Car,
      href: '/consulta/veicular',
      color: 'from-purple-500 to-purple-600',
      popular: false
    },
    {
      title: 'Outros Serviços',
      description: 'Consultas diversas e especializadas',
      icon: FileText,
      href: '/consulta/outros',
      color: 'from-orange-500 to-orange-600',
      popular: false
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Sucesso':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Falha':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sucesso':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Falha':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-64 pb-20">
          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header Section */}
              <div className="text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 rounded-3xl blur-3xl -z-10"></div>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-6 shadow-lg">
                  <BarChart3 className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                  Dashboard
                </h1>
                <p className="text-muted-foreground text-lg">
                  Bem-vindo ao BigTech - Sua plataforma de consultas inteligentes
                </p>
              </div>

              {/* Credits Overview */}
              <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Saldo de Créditos
                  </CardTitle>
                  <CardDescription>
                    Controle seu saldo disponível para consultas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mb-3">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">{userCredits.available}</div>
                      <div className="text-sm text-green-600 dark:text-green-400">Disponível</div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full mb-3">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{userCredits.previous}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">Saldo Anterior</div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500 rounded-full mb-3">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-red-700 dark:text-red-300">{userCredits.blocked}</div>
                      <div className="text-sm text-red-600 dark:text-red-400">Bloqueado</div>
                    </div>

                    <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-xl border border-gray-200 dark:border-gray-800">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-500 rounded-full mb-3">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{userCredits.lastUpdate}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Última Atualização</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickStats.map((stat, index) => (
                  <Card key={index} className="backdrop-blur-sm bg-card/95 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                          <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                          <div className="flex items-center gap-1 mt-2">
                            {stat.trend === 'up' ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${
                              stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stat.change}
                            </span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
                          <stat.icon className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Services Grid */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Serviços Disponíveis</h2>
                  <Button variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Ver Todos
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {services.map((service, index) => (
                    <Card
                      key={index}
                      className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                      onClick={() => router.push(service.href)}
                    >
                      {service.popular && (
                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Popular
                        </div>
                      )}
                      <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                      <CardHeader className="pb-3">
                        <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${service.color} rounded-xl mb-3 shadow-lg`}>
                          <service.icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {service.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-sm leading-relaxed mb-4">
                          {service.description}
                        </CardDescription>
                        <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors gap-2">
                          Acessar
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Recent Consultations */}
              <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Últimas Consultas
                  </CardTitle>
                  <CardDescription>
                    Histórico das suas consultas mais recentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentConsultations.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-background rounded-lg border border-border/50">
                            <consultation.icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{consultation.type}</div>
                            <div className="text-sm text-muted-foreground">{consultation.date}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-muted-foreground">
                              {consultation.cost} crédito{consultation.cost !== 1 ? 's' : ''}
                            </div>
                          </div>

                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(consultation.status)}`}>
                            {getStatusIcon(consultation.status)}
                            {consultation.status}
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
                      <BarChart3 className="w-4 h-4" />
                      Ver Histórico Completo
                    </Button>
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
