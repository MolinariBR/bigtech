// Baseado em: 5.Pages.md v1.1, 9.DesignSystem.md
// TASK-TENANT-003: Página de login com auto-onboarding de tenant
// Entidades: User, Tenant
// Componentes: Card, Button, Input, Modal

import { useState } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components'
import { Modal } from '../components/Modal'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTenantModal, setShowTenantModal] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': 'default'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        // Armazenar token
        localStorage.setItem('accessToken', data.token)

        // Verificar se tenant foi criado
        if (data.tenantCreated) {
          setTenantCreated(true)
          setShowTenantModal(true)
        } else {
          // Redirecionar para dashboard via router para evitar problemas de HMR/navegação
          router.replace('/')
        }
      } else {
        setError(data.message || 'Erro no login')
      }
    } catch (err) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handleTenantConfirm = () => {
    setShowTenantModal(false)
    // Redirecionar para dashboard após confirmação
    router.replace('/')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">BigTech Login</CardTitle>
          <CardDescription>
            Entre com seu email e senha para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="seu@exemplo.com"
                className="text-black"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="********"
                className="text-black"
                required
              />
            </div>

            {error && (
              <div className="text-destructive text-sm text-center">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Modal de confirmação de criação de tenant */}
      <Modal
        isOpen={showTenantModal}
        onClose={() => setShowTenantModal(false)}
        title="Tenant Criado com Sucesso!"
      >
        <div className="space-y-4">
          <p>
            Um novo tenant foi criado automaticamente para você: <strong>default</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            O tenant está em status &quot;pendente&quot; e aguarda aprovação do administrador.
            Você pode usar o sistema normalmente, mas algumas funcionalidades podem estar limitadas até a aprovação.
          </p>
          <Button onClick={handleTenantConfirm} className="w-full">
            Continuar
          </Button>
        </div>
      </Modal>
    </div>
  )
}