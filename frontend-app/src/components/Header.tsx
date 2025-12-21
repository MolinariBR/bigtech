// Baseado em: 5.Pages.md, 8.DesignSystem.md
// Componente Header compartilhado - navegação superior com logo e notificações

import { Button } from './Button'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-foreground">BigTech</h1>
          <span className="text-sm text-muted-foreground">Consultas</span>
        </div>

        {/* Notificações e ações do usuário */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="outline" size="sm">
            Notificações
          </Button>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
            U
          </div>
        </div>
      </div>
    </header>
  )
}