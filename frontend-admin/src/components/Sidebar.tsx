// Baseado em: 5.Pages.md v1.4, 8.DesignSystem.md v1.2
// Precedência: 1.Project → 2.Architecture → 5.Pages → 8.DesignSystem
// Decisão: Componente Sidebar para frontend-admin com navegação administrativa

import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  Puzzle,
  CreditCard,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Activity,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const router = useRouter();

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      description: 'Visão geral do sistema'
    },
    {
      name: 'Usuários',
      href: '/users',
      icon: Users,
      badge: '120',
      description: 'Gerenciar usuários do app'
    },
    {
      name: 'Tenants',
      href: '/tenants',
      icon: Shield,
      badge: '15',
      description: 'Gerenciar organizações'
    },
    {
      name: 'Plugins',
      href: '/plugins',
      icon: Puzzle,
      badge: '8',
      description: 'Serviços disponíveis'
    },
    {
      name: 'Billing',
      href: '/billing',
      icon: CreditCard,
      description: 'Transações e faturamento'
    },
    {
      name: 'Auditoria',
      href: '/audit',
      icon: Shield,
      description: 'Logs e compliance'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'Configurações do sistema'
    }
  ];

  const quickStats = [
    { label: 'Ativo', value: '98.5%', icon: Activity, color: 'text-green-600' },
    { label: 'Consultas', value: '1.2k', icon: BarChart3, color: 'text-blue-600' },
  ];

  const isActive = (href: string) => router.pathname === href;

  const handleLogout = () => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        await fetch('http://localhost:8080/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
      } catch (e) {
        // ignore
      }
      try {
        localStorage.removeItem('accessToken');
      } catch (e) {}
      router.replace('/login');
    })();
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-16 bottom-0 z-50 flex w-72 flex-col border-r border-border/40 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sidebar-gradient sidebar-border shadow-soft smooth-transition",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header da Sidebar */}
          <div className="flex h-16 items-center border-b border-border/40 px-6">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-muted-foreground">Sistema Online</span>
            </div>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="border-b border-border/40 p-4">
            <div className="grid grid-cols-2 gap-3">
              {quickStats.map((stat, index) => (
                <div key={index} className="flex items-center space-x-2 rounded-lg bg-muted/50 p-2">
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <span className="text-sm font-semibold">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navegação Principal */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <div key={item.name}>
                  <Link href={item.href}>
                    <div className={cn(
                      "group relative flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground nav-item-hover shadow-hover",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground shadow-sm nav-item-active"
                        : "text-muted-foreground"
                    )}>
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-medium">{item.name}</span>
                          {item.description && (
                            <span className="text-xs text-muted-foreground/70 group-hover:text-accent-foreground/70">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {item.badge && (
                          <Badge
                            variant={isActive(item.href) ? "secondary" : "outline"}
                            className="h-5 px-1.5 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isActive(item.href) ? "rotate-90" : "group-hover:translate-x-0.5"
                        )} />
                      </div>

                      {/* Indicador ativo */}
                      {isActive(item.href) && (
                        <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/20" />
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </nav>
          </ScrollArea>

          <Separator className="mx-3" />

          {/* Footer da Sidebar */}
          <div className="p-4">
            <div className="space-y-3">
              {/* Status do Sistema */}
              <div className="rounded-lg bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status do Sistema</span>
                  <div className="flex items-center space-x-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                    <span className="text-green-600 font-medium">Saudável</span>
                  </div>
                </div>
                <div className="mt-2 h-1 w-full rounded-full bg-muted">
                  <div className="h-1 w-4/5 rounded-full bg-green-500 transition-all duration-500"></div>
                </div>
              </div>

              {/* Botão de Logout */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair do Sistema
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}