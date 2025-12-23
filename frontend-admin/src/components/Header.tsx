// Baseado em: 5.Pages.md v1.4, 8.DesignSystem.md v1.2
// Precedência: 1.Project → 2.Architecture → 5.Pages → 8.DesignSystem
// Decisão: Componente Header para frontend-admin com navegação superior e controles administrativos

import Link from 'next/link'
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  tenantName?: string;
  userRole?: string;
}

export default function Header({ tenantName, userRole = 'admin' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo e identificação do tenant */}
        <div className="flex items-center space-x-4">
          <div className="text-xl font-bold text-foreground">BigTech Admin</div>
          {tenantName && (
            <Badge variant="secondary" className="text-xs">
              {tenantName}
            </Badge>
          )}
        </div>

        {/* Notificações e ações do usuário */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-error text-error-foreground rounded-full text-xs flex items-center justify-center">
              3
            </span>
          </Button>
          <Link href="/minha-conta" title="Minha Conta">
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md p-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {userRole}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}