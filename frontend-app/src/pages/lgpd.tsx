// Baseado em: 5.Pages.md v1.2, 8.DesignSystem.md v1.1
// TASK-010.4: Implementar Aviso LGPD
// US-006.3: Visualizar Aviso LGPD
// Componentes: Button, Card

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import {
  Shield,
  Eye,
  Lock,
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
  Mail,
  ExternalLink,
  Heart,
  Scale,
  UserCheck,
  Database,
  Settings,
  Info
} from 'lucide-react'

export default function LGPDPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const handleConsentChange = (checked: boolean) => {
    setConsentGiven(checked)
  }

  const handleAcceptConsent = () => {
    // Em produção, salvar consentimento na API
    alert('Consentimento registrado com sucesso!')
  }

  const handleViewFullPolicy = () => {
    // Em produção, abrir modal ou redirecionar para página completa
    window.open('/politica-privacidade', '_blank')
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const lgpdSections = [
    {
      id: 'data-collection',
      title: 'Quais dados coletamos?',
      icon: Database,
      color: 'from-blue-500 to-blue-600',
      content: [
        'Dados de identificação (CPF/CNPJ) para autenticação e consultas',
        'Informações de contato para comunicações importantes',
        'Dados de uso da plataforma para melhoria dos serviços',
        'Informações de pagamento para processamento de transações'
      ]
    },
    {
      id: 'data-usage',
      title: 'Como utilizamos seus dados?',
      icon: Settings,
      color: 'from-green-500 to-green-600',
      content: [
        'Para fornecer os serviços de consulta contratados',
        'Para processar pagamentos e gerenciar créditos',
        'Para comunicação sobre atualizações e notificações importantes',
        'Para análise de uso e melhoria contínua da plataforma'
      ]
    },
    {
      id: 'your-rights',
      title: 'Seus direitos',
      icon: Scale,
      color: 'from-purple-500 to-purple-600',
      content: [
        'Confirmar a existência de tratamento de dados',
        'Acessar seus dados pessoais',
        'Corrigir dados incompletos, inexatos ou desatualizados',
        'Anonimizar, bloquear ou eliminar dados desnecessários',
        'Portabilidade dos dados a outro fornecedor',
        'Eliminar dados tratados com consentimento',
        'Revogar consentimento previamente concedido'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pb-20">
          <div className="p-6">
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Page Header */}
              <div className="text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 rounded-3xl blur-3xl -z-10"></div>
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-3xl mb-6 shadow-lg">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                  Lei Geral de Proteção de Dados
                </h1>
                <p className="text-muted-foreground text-lg">
                  LGPD - Seus direitos e nossa responsabilidade
                </p>
              </div>

              {/* Introduction Card */}
              <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
                        <Heart className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-foreground mb-3">Sobre a Proteção de Dados</h2>
                      <p className="text-muted-foreground leading-relaxed">
                        A <strong className="text-primary">BigTech - Consultas</strong> está comprometida com a proteção
                        e privacidade dos dados pessoais de seus usuários, em conformidade com a Lei
                        Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                      </p>
                      <div className="flex items-center gap-2 mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <Info className="w-5 h-5 text-primary flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          Sua privacidade é nossa prioridade. Todos os dados são tratados com segurança e transparência.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* LGPD Sections */}
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                {lgpdSections.map((section) => (
                  <Card
                    key={section.id}
                    className="backdrop-blur-sm bg-card/95 border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                    onClick={() => toggleSection(section.id)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${section.color} rounded-xl shadow-lg`}>
                          <section.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className={`p-1 rounded-full transition-transform duration-200 ${
                          expandedSections.includes(section.id) ? 'rotate-180' : ''
                        }`}>
                          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {expandedSections.includes(section.id) ? (
                        <ul className="space-y-3">
                          {section.content.map((item, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Clique para expandir</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Contact Information */}
              <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Contato e Suporte
                  </CardTitle>
                  <CardDescription>
                    Entre em contato para exercer seus direitos ou esclarecer dúvidas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Email de Privacidade</p>
                        <a
                          href="mailto:privacidade@bigtech.com.br"
                          className="text-primary hover:text-primary/80 transition-colors text-sm"
                        >
                          privacidade@bigtech.com.br
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Encarregado de Dados</p>
                        <p className="text-muted-foreground text-sm">DPO - Data Protection Officer</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Consent Card */}
              <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-primary" />
                    Consentimento para Tratamento de Dados
                  </CardTitle>
                  <CardDescription>
                    O consentimento é opcional e pode ser revogado a qualquer momento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={consentGiven}
                      onChange={(e) => handleConsentChange(e.target.checked)}
                      className="mt-1 h-5 w-5 text-primary border-border rounded focus:ring-primary focus:ring-2"
                    />
                    <div className="flex-1">
                      <label htmlFor="consent" className="text-sm text-foreground leading-relaxed cursor-pointer">
                        Concordo com o tratamento dos meus dados pessoais conforme descrito acima,
                        incluindo o uso para melhoria dos serviços e comunicações importantes.
                        Este consentimento é opcional e pode ser revogado a qualquer momento.
                      </label>
                      <div className="flex items-center gap-2 mt-3">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <p className="text-xs text-muted-foreground">
                          Você pode alterar esta decisão a qualquer momento nas configurações da sua conta.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="default"
                      onClick={handleAcceptConsent}
                      disabled={!consentGiven}
                      className="flex-1 gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirmar Consentimento
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleViewFullPolicy}
                      className="flex-1 gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Ver Política Completa
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Resources */}
              <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-primary" />
                    Recursos Adicionais
                  </CardTitle>
                  <CardDescription>
                    Links oficiais e informações complementares sobre LGPD
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open('https://www.gov.br/anpd/pt-br', '_blank')}
                      className="w-full justify-start gap-3 h-auto p-4 hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Site da ANPD</div>
                        <div className="text-sm text-muted-foreground">Autoridade Nacional de Proteção de Dados</div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open('https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm', '_blank')}
                      className="w-full justify-start gap-3 h-auto p-4 hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Lei LGPD Completa</div>
                        <div className="text-sm text-muted-foreground">Texto integral da legislação</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Footer Note */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 p-4 bg-muted/50 rounded-lg border border-border/50">
                  <Lock className="w-5 h-5 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Seus dados estão seguros conosco. Comprometemo-nos com as melhores práticas de proteção de dados.
                  </p>
                </div>
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