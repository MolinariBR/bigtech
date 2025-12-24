// Baseado em: 5.Pages.md, 8.DesignSystem.md
// Componente Sidebar - menu lateral de navegação

import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from './Button'
import { Home, Search, BarChart3, DollarSign, Shield, ChevronDown, ChevronUp } from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

interface NavigationItem {
  name: string
  href?: string
  icon: any
  children?: { name: string; href: string }[]
  onClick?: () => void
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const router = useRouter()
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(['Consultas', 'Financeiro'])

  // Efeito removido conforme diagnóstico em problema.md para eliminar loops de renderização e lentidão.
  // A Sidebar agora é puramente reativa às interações do usuário.

  const navigationItems: NavigationItem[] = [
    { name: 'Principal', href: '/', icon: Home },
    {
      name: 'Consultas', icon: Search, children: [
        { name: 'Crédito', href: '/consulta/credito' },
        { name: 'Cadastral', href: '/consulta/cadastral' },
        { name: 'Veicular', href: '/consulta/veicular' },
        { name: 'Diversos', href: '/consulta/outros' }
      ]
    },
    { name: 'Relatórios', href: '/relatorios/consultas', icon: BarChart3 },
    {
      name: 'Financeiro', href: '/financeiro', icon: DollarSign, children: [
        { name: 'Extrato', href: '/financeiro/extrato' },
        { name: 'Comprar Créditos', href: '/financeiro/comprar' },
        { name: 'Boletos', href: '/financeiro/boletos' }
      ]
    },
    { name: 'LGPD', href: '/lgpd', icon: Shield }
  ]

  const isActive = (href: string) => {
    if (href === '/' && router.pathname === '/dashboard') return true
    return router.pathname === href
  }

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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Fixado no topo e lateral */}
      <aside className={`
        fixed left-0 top-[64px] bottom-0 z-45 w-64 bg-card/95 backdrop-blur-sm border-r border-border shadow-sm
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-45
      `}>
        <div className="flex flex-col h-full overflow-y-auto">
          <nav className="flex-1 px-3 py-6 space-y-2">
            {navigationItems.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div className="space-y-1">
                    <button
                      className="w-full flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
                      onClick={() => toggleDropdown(item.name)}
                      data-cy={`sidebar-${item.name.toLowerCase()}-dropdown`}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.name}</span>
                      {openDropdowns.includes(item.name) ? (
                        <ChevronUp className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 flex-shrink-0" />
                      )}
                    </button>

                    {openDropdowns.includes(item.name) && (
                      <div className="space-y-1 ml-4 border-l border-border/50 pl-3 mt-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`
                              flex items-center px-4 py-2 text-sm rounded-md transition-colors
                              ${isActive(child.href)
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }
                            `}
                            data-cy={`sidebar-${child.name.toLowerCase().replace(' ', '-')}`}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href || '#'}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive(item.href || '#')
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                    data-cy={`sidebar-${item.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}