import '../styles/index.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Tentar renovar access token ao iniciar (envia cookie HttpOnly)
    fetch('/auth/refresh', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } })
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

  return <Component {...pageProps} />
}