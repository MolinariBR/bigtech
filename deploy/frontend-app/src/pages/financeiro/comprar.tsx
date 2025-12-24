// Baseado em: 5.Pages.md v1.2, 8.DesignSystem.md v1.1
// TASK-010: Implementar Compra de Créditos
// Entidades: Billing, User
// Componentes: Input, Button, Modal

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal, ModalInput } from '@/components/Modal'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'

export default function ComprarCreditos() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [creditAmount, setCreditAmount] = useState('')
  const [inputError, setInputError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  // TODO: Buscar valores configuráveis do admin
  const creditConfig = {
    minCredits: 10,
    maxCredits: 10000,
    creditValue: 0.50, // R$ 0,50 por crédito
    currency: 'BRL'
  }

  const validateCreditAmount = (value: string): boolean => {
    const numValue = parseInt(value)
    return !isNaN(numValue) &&
           numValue >= creditConfig.minCredits &&
           numValue <= creditConfig.maxCredits
  }

  const calculateTotal = (amount: string): number => {
    const numAmount = parseInt(amount) || 0
    return numAmount * creditConfig.creditValue
  }

  const handleCreditAmountChange = (value: string) => {
    // Remove caracteres não numéricos
    const cleanValue = value.replace(/\D/g, '')
    setCreditAmount(cleanValue)
    setInputError('')
  }

  const handlePurchase = () => {
    if (!validateCreditAmount(creditAmount)) {
      setInputError(`Quantidade deve ser entre ${creditConfig.minCredits} e ${creditConfig.maxCredits} créditos`)
      return
    }

    setModalOpen(true)
    setResult(null)
  }

  const handleConfirmPurchase = async () => {
    setIsLoading(true)
    setInputError('')

    try {
      // TODO: Integrar com plugin de pagamento (Asaas/Pagarme)
      // Simulação de chamada API
      await new Promise(resolve => setTimeout(resolve, 3000))

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
                <h1 className="text-3xl font-bold text-foreground">Comprar Créditos</h1>
                <p className="text-muted-foreground mt-2">
                  Adquira créditos para executar consultas na plataforma
                </p>
              </div>

              {/* Card de Compra */}
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-xl">Selecionar Quantidade de Créditos</CardTitle>
                  <CardDescription>
                    Modelo pré-pago - você escolhe quantos créditos deseja comprar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Informações de Preço */}
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Valor por crédito: {formatCurrency(creditConfig.creditValue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Mínimo: {creditConfig.minCredits} créditos | Máximo: {creditConfig.maxCredits} créditos
                    </p>
                  </div>

                  {/* Input de Quantidade */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Quantidade de Créditos
                    </label>
                    <ModalInput
                      label="Quantidade de Créditos"
                      value={creditAmount}
                      onChange={handleCreditAmountChange}
                      placeholder="Ex: 100"
                      error={inputError}
                    />
                  </div>

                  {/* Cálculo do Total */}
                  {creditAmount && validateCreditAmount(creditAmount) && (
                    <div className="bg-primary/10 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total a pagar:</span>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(calculateTotal(creditAmount))}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {creditAmount} créditos × {formatCurrency(creditConfig.creditValue)} = {formatCurrency(calculateTotal(creditAmount))}
                      </p>
                    </div>
                  )}

                  {/* Botão de Compra */}
                  <Button
                    onClick={handlePurchase}
                    disabled={!creditAmount || !validateCreditAmount(creditAmount)}
                    className="w-full"
                  >
                    Comprar Créditos
                  </Button>
                </CardContent>
              </Card>

              {/* Modal de Confirmação */}
              <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Confirmar Compra de Créditos"
              >
                <div className="space-y-4">
                  <div className="bg-primary/10 p-4 rounded-md">
                    <h3 className="font-medium text-primary-foreground mb-2">Resumo da Compra</h3>
                    <div className="space-y-1 text-sm text-primary-foreground">
                      <p><strong>Créditos:</strong> {creditAmount}</p>
                      <p><strong>Valor unitário:</strong> {formatCurrency(creditConfig.creditValue)}</p>
                      <p><strong>Total:</strong> {formatCurrency(calculateTotal(creditAmount))}</p>
                    </div>
                  </div>

                  <div className="bg-warning/10 p-3 rounded-md">
                    <p className="text-sm text-warning-foreground">
                      <strong>Atenção:</strong> Após a confirmação, você será redirecionado para o pagamento.
                      Os créditos serão adicionados automaticamente após a confirmação do pagamento.
                    </p>
                  </div>

                  {result && (
                    <div className={`p-3 rounded-md ${
                      result.status === 'success'
                        ? 'bg-success/10 text-success-foreground'
                        : 'bg-error/10 text-error-foreground'
                    }`}>
                      {result.status === 'success' ? (
                        <div>
                          <p className="font-medium">Compra realizada com sucesso!</p>
                          <p className="text-sm mt-1">
                            Créditos adquiridos: {result.data.credits}
                          </p>
                          <p className="text-sm">
                            Valor pago: {formatCurrency(result.data.total)}
                          </p>
                          <p className="text-sm">
                            ID da transação: {result.data.transactionId}
                          </p>
                          <p className="text-sm">
                            Método: {result.data.paymentMethod.toUpperCase()}
                          </p>
                        </div>
                      ) : (
                        <p className="font-medium">{result.message}</p>
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