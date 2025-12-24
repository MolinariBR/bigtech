import '../styles/index.css'
import type { AppProps } from 'next/app'
import { useEffect, createContext, useState } from 'react'
import { useRouter } from 'next/router'
import { apiCall, API_CONFIG } from '@/lib/api'

export const NavigationContext = createContext({ isNavigating: false })

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

  // Log router events e expor estado de navegação via contexto
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  useEffect(() => {
    const onStart = (url: string) => {
      console.log('[router] start', url)
      setIsNavigating(true)
    }
    const onComplete = (url: string) => {
      console.log('[router] complete', url)
      setIsNavigating(false)
    }
    const onError = (err: any, url: string) => {
      console.log('[router] error', err, url)
      setIsNavigating(false)
    }

    router.events.on('routeChangeStart', onStart)
    router.events.on('routeChangeComplete', onComplete)
    router.events.on('routeChangeError', onError)

    return () => {
      router.events.off('routeChangeStart', onStart)
      router.events.off('routeChangeComplete', onComplete)
      router.events.off('routeChangeError', onError)
    }
  }, [router.events])

  return (
    <NavigationContext.Provider value={{ isNavigating }}>
      <Component {...pageProps} />
    </NavigationContext.Provider>
  )
}