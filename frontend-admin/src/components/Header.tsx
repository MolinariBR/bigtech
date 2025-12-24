// Baseado em: 5.Pages.md v1.4, 8.DesignSystem.md v1.2
// Precedência: 1.Project → 2.Architecture → 5.Pages → 8.DesignSystem
// Decisão: Componente Header para frontend-admin com navegação superior e controles administrativos

import Link from 'next/link'
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  User,
  Menu,
  Search,
  Settings as SettingsIcon,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  tenantName?: string;
  userRole?: string;
  onMenuClick?: () => void;
}

export default function Header({ tenantName, userRole = 'admin', onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 header-shadow smooth-transition">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 lg:px-6">
        {/* Menu Toggle para Mobile */}
        <Button
          variant="ghost"
          size="sm"
          className="mr-4 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo e identificação do tenant */}
        <div className="flex items-center space-x-4 flex-1 lg:flex-none">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">BT</span>
            </div>
            <div className="hidden font-bold text-lg sm:inline-block">
              BigTech Admin
            </div>
          </Link>

          {tenantName && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Badge variant="secondary" className="text-xs font-medium">
                {tenantName}
              </Badge>
            </>
          )}
        </div>

        {/* Barra de Pesquisa Centralizada */}
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Buscar..."
                className="h-9 w-full rounded-md border border-input bg-background px-9 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Ações do Header */}
        <div className="flex items-center space-x-2">
          {/* Notificações */}
          <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              3
            </span>
            <span className="sr-only">Notificações</span>
          </Button>

          {/* Configurações Rápidas */}
          <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full">
            <SettingsIcon className="h-4 w-4" />
            <span className="sr-only">Configurações</span>
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="Avatar" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Administrador</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@bigtech.com.br
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/minha-conta" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Minha Conta</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}