import '../styles/index.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { apiCall, API_CONFIG } from '@/lib/api'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Só tentar renovar access token se não houver um token válido
    const existingToken = localStorage.getItem('accessToken');
    if (!existingToken) {
      // Tentar renovar access token ao iniciar (envia cookie HttpOnly)
      apiCall(API_CONFIG.endpoints.auth.refresh, { method: 'POST' })
        .then((data) => {
          if (data && data.success && data.token) {
            localStorage.setItem('accessToken', data.token);
            // Recarregar a página para aplicar o novo token
            window.location.reload();
          }
        })
        .catch(() => {
          // Se não conseguir renovar, continuar sem token (usuário precisa fazer login)
        });
    }
  }, []);

  return <Component {...pageProps} />
}