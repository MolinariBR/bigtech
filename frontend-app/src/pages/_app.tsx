import '../styles/index.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { apiCall, API_CONFIG } from '@/lib/api'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Em desenvolvimento, forçar injeção do token dev (sempre)
    if (process.env.NEXT_PUBLIC_DEV_TOKEN) {
      try {
        localStorage.setItem('accessToken', process.env.NEXT_PUBLIC_DEV_TOKEN)
      } catch (e) {
        // ignore
      }
    }

    // Se não houver token válido (ex: em produção), tentar renovar via cookie HttpOnly
    const existingToken = localStorage.getItem('accessToken')
    if (!existingToken) {
      apiCall(API_CONFIG.endpoints.auth.refresh, { method: 'POST' })
        .then((data) => {
          if (data && data.success && data.token) {
            localStorage.setItem('accessToken', data.token)
            window.location.reload()
          }
        })
        .catch(() => {
          // continuar sem token
        })
    }
  }, []);

  return <Component {...pageProps} />
}