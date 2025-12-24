// Baseado em: 5.Pages.md v1.2, 8.DesignSystem.md v1.1
// TASK-010: Implementar Compra de Créditos
// Entidades: Billing, User
// Componentes: Input, Button, Modal

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal, ModalForm } from '@/components/Modal'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import { useDynamicValidation, InitialFormField } from '@/hooks/useDynamicValidation'
import { CreditCard, Calculator, CheckCircle, AlertCircle, DollarSign, ShoppingCart } from 'lucide-react'

export default function ComprarCreditos() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  // TODO: Buscar valores configuráveis do admin
  const creditConfig = {
    minCredits: 10,
    maxCredits: 10000,
    creditValue: 0.50, // R$ 0,50 por crédito
    currency: 'BRL'
  }

  // Campos dinâmicos para validação
  const creditFields: InitialFormField[] = [
    {
      name: 'creditAmount',
      label: 'Quantidade de Créditos',
      type: 'number',
      value: '',
      placeholder: 'Ex: 100',
      required: true
    }
  ]

  // Hook de validação dinâmica
  const { fields, validateForm, resetValidation } = useDynamicValidation(creditFields)

  // Função helper para acessar campos por nome
  const getField = (name: string) => fields.find(f => f.name === name)

  const calculateTotal = (amount: string): number => {
    const numAmount = parseInt(amount) || 0
    return numAmount * creditConfig.creditValue
  }

  const handlePurchase = () => {
    // Validação dinâmica
    if (!validateForm()) {
      return
    }

    const creditAmount = getField('creditAmount')?.value || ''
    const numValue = parseInt(creditAmount)

    if (numValue < creditConfig.minCredits || numValue > creditConfig.maxCredits) {
      // Adicionar erro ao campo se necessário
      return
    }

    setModalOpen(true)
    setResult(null)
  }

  const handleConfirmPurchase = async () => {
    setIsLoading(true)

    try {
      // TODO: Integrar com plugin de pagamento (Asaas/Pagarme)
      // Simulação de chamada API
      await new Promise(resolve => setTimeout(resolve, 3000))

      const creditAmount = getField('creditAmount')?.value || ''

      // Mock result - sucesso
      setResult({
        status: 'success',
        data: {
          credits: parseInt(creditAmount),
          total: calculateTotal(creditAmount),
          transactionId: `TXN-${Date.now()}`,
          paymentMethod: 'pix' // ou 'asaas', 'pagarme'
        }
      })

      // TODO: Atualizar User.credits via webhook
      // TODO: Registrar em Billing

    } catch (error) {
      setResult({
        status: 'error',
        message: 'Erro no processamento do pagamento. Tente novamente ou entre em contato com o suporte.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: creditConfig.currency
    }).format(value)
  }

  const creditAmount = getField('creditAmount')?.value || ''
  const isValidAmount = creditAmount && parseInt(creditAmount) >= creditConfig.minCredits && parseInt(creditAmount) <= creditConfig.maxCredits

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
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Page Header */}
              <div className="text-center relative">
                <div className="absolute inset-0 -z-10">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-full mb-4 shadow-lg">
                  <ShoppingCart className="w-8 h-8 text-primary-foreground" />
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Comprar Créditos</h1>
                <p className="text-muted-foreground text-lg">
                  Adquira créditos para executar consultas na plataforma
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Card de Compra Principal */}
                <div className="lg:col-span-2">
                  <Card className="shadow-xl border-0 bg-gradient-to-br from-card to-card/95 backdrop-blur-sm">
                    <CardHeader className="text-center pb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">Selecionar Quantidade de Créditos</CardTitle>
                      <CardDescription className="text-base">
                        Modelo pré-pago - você escolhe quantos créditos deseja comprar
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Informações de Preço */}
                      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="font-medium text-primary">Informações de Preço</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <p className="text-muted-foreground">
                            Valor por crédito: <span className="font-semibold text-foreground">{formatCurrency(creditConfig.creditValue)}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Mínimo: <span className="font-semibold text-foreground">{creditConfig.minCredits} créditos</span>
                          </p>
                          <p className="text-muted-foreground sm:col-span-2 text-center">
                            Máximo: <span className="font-semibold text-foreground">{creditConfig.maxCredits} créditos</span>
                          </p>
                        </div>
                      </div>

                      {/* Formulário */}
                      <ModalForm
                        fields={fields}
                        onSubmit={handlePurchase}
                        submitLabel="Comprar Créditos"
                        submitDisabled={!isValidAmount}
                      />

                      {/* Cálculo do Total */}
                      {isValidAmount && (
                        <div className="bg-gradient-to-r from-success/10 to-success/5 p-4 rounded-lg border border-success/20">
                          <div className="flex items-center space-x-2 mb-3">
                            <Calculator className="w-5 h-5 text-success" />
                            <span className="font-medium text-success-foreground">Resumo da Compra</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Créditos selecionados:</span>
                              <span className="font-semibold text-foreground">{creditAmount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Valor unitário:</span>
                              <span className="font-semibold text-foreground">{formatCurrency(creditConfig.creditValue)}</span>
                            </div>
                            <div className="border-t border-success/20 pt-2 mt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-success-foreground">Total a pagar:</span>
                                <span className="text-2xl font-bold text-success">
                                  {formatCurrency(calculateTotal(creditAmount))}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Card de Informações */}
                <div className="space-y-6">
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/95 backdrop-blur-sm">
                    <CardHeader>
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-info/10 rounded-full mb-2">
                        <AlertCircle className="w-5 h-5 text-info" />
                      </div>
                      <CardTitle className="text-lg">Como Funciona</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">1</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Escolha a quantidade de créditos desejada
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">2</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Confirme o valor e proceda com o pagamento
                        </p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">3</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Créditos são adicionados automaticamente após confirmação
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-0 bg-gradient-to-br from-card to-card/95 backdrop-blur-sm">
                    <CardHeader>
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-success/10 rounded-full mb-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <CardTitle className="text-lg">Vantagens</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Pagamento seguro via PIX</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Créditos adicionados instantaneamente</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Sem taxas ocultas</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Suporte técnico disponível</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Modal de Confirmação */}
              <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Confirmar Compra de Créditos"
              >
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
                    <h3 className="font-semibold text-primary-foreground mb-3 flex items-center">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Resumo da Compra
                    </h3>
                    <div className="space-y-2 text-sm text-primary-foreground">
                      <div className="flex justify-between">
                        <span>Créditos:</span>
                        <span className="font-semibold">{creditAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor unitário:</span>
                        <span className="font-semibold">{formatCurrency(creditConfig.creditValue)}</span>
                      </div>
                      <div className="border-t border-primary/20 pt-2 mt-3">
                        <div className="flex justify-between">
                          <span className="font-bold">Total:</span>
                          <span className="font-bold text-lg">{formatCurrency(calculateTotal(creditAmount))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-warning/10 to-warning/5 p-4 rounded-lg border border-warning/20">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-warning-foreground mb-1">Atenção</p>
                        <p className="text-sm text-warning-foreground">
                          Após a confirmação, você será redirecionado para o pagamento.
                          Os créditos serão adicionados automaticamente após a confirmação do pagamento.
                        </p>
                      </div>
                    </div>
                  </div>

                  {result && (
                    <div className={`p-4 rounded-lg border ${
                      result.status === 'success'
                        ? 'bg-success/10 border-success/20'
                        : 'bg-error/10 border-error/20'
                    }`}>
                      {result.status === 'success' ? (
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-success-foreground mb-2">Compra realizada com sucesso!</p>
                            <div className="space-y-1 text-sm text-success-foreground">
                              <p>Créditos adquiridos: <span className="font-semibold">{result.data.credits}</span></p>
                              <p>Valor pago: <span className="font-semibold">{formatCurrency(result.data.total)}</span></p>
                              <p>ID da transação: <span className="font-semibold">{result.data.transactionId}</span></p>
                              <p>Método: <span className="font-semibold">{result.data.paymentMethod.toUpperCase()}</span></p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                          <p className="font-semibold text-error-foreground">{result.message}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleConfirmPurchase}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Processando...' : 'Confirmar e Pagar'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setModalOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Modal>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}