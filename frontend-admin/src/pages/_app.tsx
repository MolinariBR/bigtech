import '../styles/index.css';
import type { AppProps } from 'next/app';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Toaster } from 'sonner';

export default function MyApp({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // Verificar se já existe um token válido no localStorage
    const existingToken = localStorage.getItem('accessToken');
    if (!existingToken) {
      // Se não há token, redirecionar para login apenas se não estiver na página de login
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }, []);

  const noLayout = (Component as any).noLayout;

  // If the page opts out of the default layout (login), render minimal wrapper.
  if (noLayout) {
    return (
      <div className="min-h-screen bg-background">
        <Component {...pageProps} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-72 pt-16">
        <div className="px-6 py-6">
          <Component {...pageProps} />
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}