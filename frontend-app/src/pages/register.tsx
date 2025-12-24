// Baseado em: 5.Pages.md v1.3, 9.DesignSystem.md
// TASK-USER-001: Página de registro com auto-onboarding de tenant
// Entidades: User, Tenant
// Componentes: Card, Button, Input, Modal

import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { Eye, EyeOff, Mail, Lock, User, Building, Check, AlertCircle, Shield, Sparkles } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '', // Opcional para derivar nome do tenant
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const router = useRouter()

  const validateForm = () => {
    if (!formData.name.trim()) return 'Nome é obrigatório'
    if (!formData.email.trim()) return 'Email é obrigatório'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Email inválido'
    if (formData.password.length < 8) return 'Senha deve ter pelo menos 8 caracteres'
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) return 'Senha deve conter maiúscula, minúscula e número'
    if (formData.password !== formData.confirmPassword) return 'Senhas não coincidem'
    if (!acceptTerms) return 'Aceite os termos de uso'
    return null
  }

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^A-Za-z\d]/.test(password)) strength++
    return strength
  }

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, password }))
    setPasswordStrength(calculatePasswordStrength(password))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          company: formData.company || null, // Opcional
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        setShowSuccessModal(true)
      } else {
        setError(data.message || 'Erro no registro')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false)
    router.replace('/login') // Redirecionar para login após registro
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-destructive'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    return 'bg-success'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Fraca'
    if (passwordStrength <= 3) return 'Média'
    return 'Forte'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-10 w-24 h-24 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-32 left-10 w-20 h-20 bg-accent/10 rounded-full blur-xl animate-pulse delay-1000"></div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Criar Conta
          </h1>
          <p className="text-muted-foreground mt-2">
            Junte-se à plataforma BigTech
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/95 border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-semibold">Registrar-se</CardTitle>
            <CardDescription className="text-base">
              Crie sua conta para acessar consultas de crédito
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Nome Completo
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  placeholder="Seu nome completo"
                  className="h-12 border-border/50 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="seu@exemplo.com"
                  className="h-12 border-border/50 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  Empresa/Domínio <span className="text-muted-foreground text-xs">(Opcional)</span>
                </label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={handleInputChange('company')}
                  placeholder="Nome da empresa ou domínio"
                  className="h-12 border-border/50 focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Crie uma senha forte"
                    className="h-12 pl-4 pr-12 border-border/50 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-success' : ''}`}>
                        <Check className="w-3 h-3" />
                        Pelo menos 8 caracteres
                      </div>
                      <div className={`flex items-center gap-1 ${/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password) ? 'text-success' : ''}`}>
                        <Check className="w-3 h-3" />
                        Maiúscula e minúscula
                      </div>
                      <div className={`flex items-center gap-1 ${/\d/.test(formData.password) ? 'text-success' : ''}`}>
                        <Check className="w-3 h-3" />
                        Pelo menos um número
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    placeholder="Confirme sua senha"
                    className="h-12 pl-4 pr-12 border-border/50 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <div className="flex items-center gap-2 text-destructive text-xs">
                    <AlertCircle className="w-4 h-4" />
                    As senhas não coincidem
                  </div>
                )}
              </div>

              <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg border border-border/50">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-2"
                />
                <label htmlFor="acceptTerms" className="text-sm leading-relaxed">
                  Aceito os{' '}
                  <Link href="/lgpd" className="text-primary hover:text-primary/80 font-medium underline underline-offset-2">
                    termos de uso e LGPD
                  </Link>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    Criando conta...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Criar Conta
                  </div>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Já tem conta?{' '}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/80 font-medium transition-colors underline underline-offset-4"
                >
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            © 2024 BigTech. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Modal de sucesso */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Conta Criada com Sucesso!"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-success-foreground" />
            </div>
            <div>
              <p className="font-medium text-success-foreground">Registro concluído</p>
              <p className="text-sm text-muted-foreground">Sua conta foi criada com sucesso</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Um tenant foi associado automaticamente à sua conta. Faça login para acessar o sistema.
          </p>
          <Button onClick={handleSuccessConfirm} className="w-full h-11">
            Ir para Login
          </Button>
        </div>
      </Modal>
    </div>
  )
}