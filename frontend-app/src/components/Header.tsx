// Baseado em: 5.Pages.md, 8.DesignSystem.md
// Componente Header compartilhado - navegação superior com logo e notificações

import Link from 'next/link'
import { User } from 'lucide-react'
import { Button } from './Button'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="text-xl font-bold text-foreground">BigTech</div>
          <span className="text-sm text-muted-foreground">Consultas</span>
        </div>

        {/* Notificações e ações do usuário */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="outline" size="sm">
            Notificações
          </Button>
          <Link href="/minha-conta" title="Minha Conta">
            <User className="w-6 h-6 text-foreground hover:text-primary cursor-pointer" />
          </Link>
        </div>
      </div>
    </header>
  )
}