import '../styles/index.css';
import type { AppProps } from 'next/app';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';

export default function MyApp({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Tentar renovar access token ao iniciar (envia cookie HttpOnly)
    fetch('/api/auth/refresh', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.success && data.token) {
          localStorage.setItem('accessToken', data.token);
        }
      })
      .catch(() => {
        // silent
      });
  }, []);

  const noLayout = (Component as any).noLayout;

  // If the page opts out of the default layout (login), render minimal wrapper.
  if (noLayout) {
    return (
      <div className="dark min-h-screen bg-background">
        <Component {...pageProps} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16">
        <div className="px-4 py-6">
          <Component {...pageProps} />
        </div>
      </main>
    </div>
  );
}