// Baseado em: 5.Pages.md v1.4, 8.DesignSystem.md v1.2
// Precedência: 1.Project → 2.Architecture → 5.Pages → 8.DesignSystem
// Decisão: Componente Sidebar para frontend-admin com navegação administrativa

import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Puzzle,
  CreditCard,
  Shield,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const router = useRouter();

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tenants', href: '/tenants', icon: Users },
    { name: 'Plugins', href: '/plugins', icon: Puzzle },
    { name: 'Billing', href: '/billing', icon: CreditCard },
    { name: 'Auditoria', href: '/audit', icon: Shield }
  ];

  const isActive = (href: string) => router.pathname === href;

  const handleLogout = () => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        await fetch('/api/auth/logout', {
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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-16 bottom-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-50
      `}>
        <div className="flex flex-col h-full">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <div key={item.name}>
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
              </div>
            ))}
          </nav>

          {/* Footer da Sidebar */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}