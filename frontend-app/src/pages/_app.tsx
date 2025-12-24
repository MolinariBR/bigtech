import '../styles/index.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { apiCall, API_CONFIG } from '@/lib/api'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Tentar renovar access token ao iniciar (envia cookie HttpOnly)
    apiCall(API_CONFIG.endpoints.auth.refresh, { method: 'POST' })
      .then((data) => {
        if (data && data.success && data.token) {
          localStorage.setItem('accessToken', data.token);
        }
      })
      .catch(() => {
        // silent
      });
  }, []);

  return <Component {...pageProps} />
}