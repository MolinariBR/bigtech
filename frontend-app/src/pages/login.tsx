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
  const [identifier, setIdentifier] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTenantModal, setShowTenantModal] = useState(false)
  const [tenantCreated, setTenantCreated] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId || 'default'
        },
        body: JSON.stringify({ identifier }),
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
            Entre com seu CPF/CNPJ para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium mb-1">
                CPF/CNPJ
              </label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIdentifier(e.target.value)}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                required
              />
            </div>

            <div>
              <label htmlFor="tenantId" className="block text-sm font-medium mb-1">
                Tenant ID (opcional)
              </label>
              <Input
                id="tenantId"
                type="text"
                value={tenantId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTenantId(e.target.value)}
                placeholder="Deixe vazio para tenant padrão"
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
            Um novo tenant foi criado automaticamente para você: <strong>{tenantId || 'default'}</strong>
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