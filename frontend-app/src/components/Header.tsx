// Baseado em: 5.Pages.md, 8.DesignSystem.md
// Componente Header compartilhado - navegação superior com logo e notificações

import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { User, Menu, Bell, ChevronDown, LogOut } from 'lucide-react'
import { Button } from './Button'
import ThemeToggle from './ThemeToggle'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleMinhaConta = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/minha-conta')
    setDropdownOpen(false)
  }

  const handleSair = async () => {
    localStorage.removeItem('accessToken')
    router.push('/login')
    setDropdownOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border px-4 lg:px-6 py-3 lg:py-4 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo e Menu Mobile */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2"
            onClick={onMenuClick}
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="text-xl font-bold text-foreground">BigTech</div>
            <span className="hidden sm:inline text-sm text-muted-foreground">Consultas</span>
          </div>
        </div>

        {/* Notificações e ações do usuário */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <User className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Minha Conta</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={handleMinhaConta}
                    className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4 mr-3" />
                    Minha Conta
                  </button>
                  <button
                    onClick={handleSair}
                    className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Overlay para fechar dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </header>
  )
}