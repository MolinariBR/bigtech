// Baseado em: 5.Pages.md, 8.DesignSystem.md
// Componente Sidebar - menu lateral de navegação

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button } from './Button'
import { Home, Search, BarChart3, DollarSign, Shield, ChevronDown, ChevronUp } from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navigationItems = [
  { name: 'Principal', href: '/', icon: Home },
  { name: 'Consultas', href: '/consultas', icon: Search, children: [
    { name: 'Crédito', href: '/consulta/credito' },
    { name: 'Cadastral', href: '/consulta/cadastral' },
    { name: 'Veicular', href: '/consulta/veicular' }
  ]},
  { name: 'Relatórios', href: '/relatorios/consultas', icon: BarChart3 },
  { name: 'Financeiro', href: '/financeiro', icon: DollarSign, children: [
    { name: 'Extrato', href: '/financeiro/extrato' },
    { name: 'Comprar Créditos', href: '/financeiro/comprar' },
    { name: 'Boletos', href: '/financeiro/boletos' }
  ]},
  { name: 'LGPD', href: '/lgpd', icon: Shield }
]

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const router = useRouter()
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(['Consultas', 'Financeiro']) // Iniciar abertos

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
        fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          {/* Header da Sidebar */}
          <div className="p-6 border-b border-border bg-card">
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 bg-card">
            {navigationItems.map((item) => (
              <div key={item.name}>
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
                      <Link key={child.href} href={child.href}>
                        <div className={`
                          flex items-center px-6 py-2 text-sm rounded-md transition-colors cursor-pointer
                          ${isActive(child.href)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }
                        `}>
                          {child.name}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link href={item.href}>
                    <div className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer
                      ${isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}>
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                  </Link>
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
              onClick={() => {
                // TODO: Implementar logout
                console.log('Logout')
              }}
            >
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}