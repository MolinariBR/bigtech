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

export default function LGPDPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)

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
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Page Header */}
              <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground">Aviso LGPD</h1>
                <p className="text-muted-foreground mt-2">
                  Lei Geral de Proteção de Dados Pessoais
                </p>
              </div>

              {/* Aviso LGPD */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Sobre a Proteção de Dados</CardTitle>
                  <CardDescription>
                    Informações importantes sobre como tratamos seus dados pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none text-foreground">
                    <p>
                      A <strong>Recupera Big Tech - Consultas</strong> está comprometida com a proteção
                      e privacidade dos dados pessoais de seus usuários, em conformidade com a Lei
                      Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                    </p>

                    <h3 className="text-lg font-semibold mt-6 mb-3">Quais dados coletamos?</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Dados de identificação (CPF/CNPJ) para autenticação e consultas</li>
                      <li>Informações de contato para comunicações importantes</li>
                      <li>Dados de uso da plataforma para melhoria dos serviços</li>
                      <li>Informações de pagamento para processamento de transações</li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6 mb-3">Como utilizamos seus dados?</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Para fornecer os serviços de consulta contratados</li>
                      <li>Para processar pagamentos e gerenciar créditos</li>
                      <li>Para comunicação sobre atualizações e notificações importantes</li>
                      <li>Para análise de uso e melhoria contínua da plataforma</li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6 mb-3">Seus direitos</h3>
                    <p>
                      De acordo com a LGPD, você tem direito a:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Confirmar a existência de tratamento de dados</li>
                      <li>Acessar seus dados pessoais</li>
                      <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                      <li>Anonimizar, bloquear ou eliminar dados desnecessários</li>
                      <li>Portabilidade dos dados a outro fornecedor</li>
                      <li>Eliminar dados tratados com consentimento</li>
                      <li>Revogar consentimento previamente concedido</li>
                    </ul>

                    <h3 className="text-lg font-semibold mt-6 mb-3">Contato</h3>
                    <p>
                      Para exercer seus direitos ou esclarecer dúvidas sobre privacidade,
                      entre em contato através do e-mail:{' '}
                      <a
                        href="mailto:privacidade@recuperabigtech.com.br"
                        className="text-primary hover:underline"
                      >
                        privacidade@recuperabigtech.com.br
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Consentimento Opcional */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Consentimento para Tratamento de Dados</CardTitle>
                  <CardDescription>
                    O consentimento é opcional e pode ser revogado a qualquer momento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={consentGiven}
                      onChange={(e) => handleConsentChange(e.target.checked)}
                      className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="consent" className="text-sm text-foreground leading-relaxed">
                      Concordo com o tratamento dos meus dados pessoais conforme descrito acima,
                      incluindo o uso para melhoria dos serviços e comunicações importantes.
                      Este consentimento é opcional e pode ser revogado a qualquer momento.
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="default"
                      onClick={handleAcceptConsent}
                      disabled={!consentGiven}
                      className="flex-1"
                    >
                      Confirmar Consentimento
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleViewFullPolicy}
                      className="flex-1"
                    >
                      Ver Política Completa
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Links Adicionais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Recursos Adicionais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => window.open('https://www.gov.br/anpd/pt-br', '_blank')}
                      className="w-full justify-start"
                    >
                      Site da ANPD
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open('https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm', '_blank')}
                      className="w-full justify-start"
                    >
                      Lei LGPD Completa
                    </Button>
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