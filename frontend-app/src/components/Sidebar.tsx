// Baseado em: 5.Pages.md, 8.DesignSystem.md
// Componente Sidebar - menu lateral de navegação

import { useRouter } from 'next/router'
import { useState, useContext } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { Home, Search, BarChart3, DollarSign, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { NavigationContext } from '@/pages/_app'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const router = useRouter()
  const { isNavigating } = useContext(NavigationContext)
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(['Consultas', 'Financeiro']) // Iniciar abertos
  const [lgpdModalOpen, setLgpdModalOpen] = useState(false)

  const navigationItems = [
    { name: 'Principal', href: '/', icon: Home },
    { name: 'Consultas', icon: Search, children: [
      { name: 'Crédito', href: '/consulta/credito' },
      { name: 'Cadastral', href: '/consulta/cadastral' },
      { name: 'Veicular', href: '/consulta/veicular' },
      { name: 'Diversos', href: '/consulta/outros' }
    ]},
    { name: 'Relatórios', href: '/relatorios/consultas', icon: BarChart3 },
    { name: 'Financeiro', href: '/financeiro', icon: DollarSign, children: [
      { name: 'Extrato', href: '/financeiro/extrato' },
      { name: 'Comprar Créditos', href: '/financeiro/comprar' },
      { name: 'Boletos', href: '/financeiro/boletos' }
    ]},
    { name: 'LGPD', onClick: () => setLgpdModalOpen(true), icon: Shield }
  ]

  const isActive = (href: string) => router.pathname === href

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-12 bottom-12 z-55 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-55
      `}>
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-4 py-6 space-y-2 bg-card">
            {navigationItems.map((item, index) => (
              <div key={item.name} className={index === 0 ? 'mt-4' : ''}>
                {item.children ? (
                  <div className="space-y-1">
                    <div
                      className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md cursor-pointer"
                      onClick={() => toggleDropdown(item.name)}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                      {openDropdowns.includes(item.name) ? (
                        <ChevronUp className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      )}
                    </div>
                                    {openDropdowns.includes(item.name) && item.children.map((child) => (
                                      <div
                                        key={child.href}
                                        onClick={() => {
                                          console.log('[sidebar] click', child.href, 'isNavigating:', isNavigating)
                                          if (isNavigating) {
                                            console.log('[sidebar] navigation blocked - already navigating')
                                            return
                                          }
                                          console.log('[sidebar] calling router.push', child.href)
                                          router.push(child.href)
                                        }}
                                        className={`
                                          flex items-center px-6 py-2 text-sm rounded-md transition-colors cursor-pointer
                                          ${isActive(child.href)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                          }
                                        `}
                                      >
                                        {child.name}
                                      </div>
                                    ))}
                  </div>
                ) : item.onClick ? (
                  <div
                    onClick={item.onClick}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer
                      text-muted-foreground hover:bg-muted hover:text-foreground
                    `}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (isNavigating) return
                      console.log('[sidebar] click', item.href)
                      router.push(item.href)
                    }}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer
                      ${isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer da Sidebar */}
          <div className="p-4 border-t border-border bg-card">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
                if (isNavigating) return
                try {
                  const token = localStorage.getItem('accessToken')
                  const headers: HeadersInit = {
                    'Content-Type': 'application/json'
                  }
                  if (token) headers['Authorization'] = `Bearer ${token}`

                  // Tentar notificar backend para limpar cookie de refresh
                  await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers,
                    credentials: 'include'
                  }).catch(() => {})

                  // Limpar estado local e redirecionar para login
                  localStorage.removeItem('accessToken')
                  router.push('/login')
                } catch (e) {
                  console.error('Logout failed', e)
                  localStorage.removeItem('accessToken')
                  router.push('/login')
                }
              }}
            >
              Sair
            </Button>
          </div>
        </div>
      </aside>

      <Modal
        isOpen={lgpdModalOpen}
        onClose={() => setLgpdModalOpen(false)}
        title="Aviso LGPD"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            A Lei Geral de Proteção de Dados - LGPD - permite o uso de dados nas seguintes situações:
          </p>
          <div className="space-y-2 text-sm">
            <p><strong>I -</strong> Mediante o fornecimento de consentimento pelo titular;</p>
            <p><strong>II -</strong> Para o cumprimento de obrigação legal ou regulatória pelo controlador;</p>
            <p><strong>III -</strong> Pela administração pública, para o tratamento e uso compartilhado de dados necessários à execução de políticas públicas previstas em leis e regulamentos ou respaldadas em contratos, convênios ou instrumentos congêneres, observadas as disposições do Capítulo IV desta Lei;</p>
            <p><strong>IV -</strong> Para a realização de estudos por órgão de pesquisa, garantida, sempre que possível, a anonimização dos dados pessoais;</p>
            <p><strong>V -</strong> Quando necessário para a execução de contrato ou de procedimentos preliminares relacionados a contrato do qual seja parte o titular, a pedido do titular dos dados;</p>
            <p><strong>VI -</strong> Para o exercício regular de direitos em processo judicial, administrativo ou arbitral, esse último nos termos da Lei nº 9.307, de 23 de setembro de 1996 (Lei de Arbitragem);</p>
            <p><strong>VII -</strong> Para a proteção de vida ou da incolumidade física do titular ou de terceiro;</p>
            <p><strong>VIII -</strong> Para a tutela da saúde, exclusivamente, em procedimento realizado por profissionais de saúde, serviços de saúde ou autoridade sanitária;</p>
            <p><strong>IX -</strong> Quando necessário para atender aos interesses legítimos do controlador ou de terceiro, exceto no caso de prevalecerem direitos e liberdades fundamentais do titular que exijam a proteção dos dados pessoais; ou</p>
            <p><strong>X -</strong> Para a proteção do crédito, inclusive quanto ao disposto na legislação pertinente.</p>
          </div>
        </div>
      </Modal>
    </>
  )
}