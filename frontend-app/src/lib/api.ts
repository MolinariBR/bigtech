// Configuração da API para conectar com o backend
export const API_CONFIG = {
  // Use URL relativa por padrão para que o cliente passe pelo proxy do Next.js
  // Em produção o deploy pode definir NEXT_PUBLIC_API_BASE_URL para um valor absoluto.
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  endpoints: {
    plugins: {
      services: (pluginId: string) => `/api/plugins/${pluginId}/services`,
      execute: (pluginId: string) => `/api/plugins/${pluginId}/execute`,
      active: '/api/plugins/active'
    },
    auth: {
      refresh: '/api/auth/refresh',
      me: {
        plugins: '/api/auth/me/plugins',
        profile: '/api/auth/me'
      }
    }
  }
}

// Função helper para fazer chamadas para a API
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  // Use caminho relativo para rotas internas `/api` para garantir same-origin
  // (isso evita que o browser faça POST cross-site para :4000 e não envie cookies
  // por causa da política SameSite). Para endpoints externos mantenha o baseURL.
  const url = endpoint.startsWith('/api') ? endpoint : `${API_CONFIG.baseURL}${endpoint}`

  // Obter token de autenticação se disponível
  // Suporta chaves alternativas em dev (`accessToken`, `token`, `adminToken`) para facilitar testes/E2E
  let token: string | null = null
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('adminToken') || null
    // Em dev, permitir fallback para NEXT_PUBLIC_DEV_TOKEN embutido pelo Next
    if (!token && typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_DEV_TOKEN) {
      token = process.env.NEXT_PUBLIC_DEV_TOKEN
    }
  }

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    },
    credentials: 'include', // Para enviar cookies
    ...options
  }

  // Registrar se havia token enviado inicialmente — se não havia, `refresh` provavelmente falhará
  const hadToken = Boolean(token)

  const response = await fetch(url, defaultOptions)

  // Se o backend responder 401, tentar ações condicionais
  if (response.status === 401) {
    // Se não havia token inicial, evitar chamar /api/auth/refresh (que exige cookie HttpOnly)
    if (!hadToken) {
      // Em dev, tentar fallback para `NEXT_PUBLIC_DEV_TOKEN` antes de falhar
      if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_DEV_TOKEN) {
        const devToken = process.env.NEXT_PUBLIC_DEV_TOKEN
        const retryOptions = {
          ...defaultOptions,
          headers: {
            ...((defaultOptions && (defaultOptions as any).headers) || {}),
            Authorization: `Bearer ${devToken}`
          }
        }
        const retryResp = await fetch(url, retryOptions)
        if (retryResp.ok) return retryResp.json()
        const retryErr = await retryResp.json().catch(() => ({ error: `HTTP ${retryResp.status}` }))
        throw new Error(retryErr.error || `HTTP ${retryResp.status}`)
      }

      const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    // Se havia token inicial, tentar renovar via endpoint `/api/auth/refresh`
    try {
      const refreshResp = await fetch(API_CONFIG.endpoints.auth.refresh, { method: 'POST', credentials: 'include' })
      if (refreshResp.ok) {
        const refreshJson = await refreshResp.json().catch(() => null)
        if (refreshJson && refreshJson.token) {
          try {
            localStorage.setItem('accessToken', refreshJson.token)
            token = refreshJson.token
          } catch (e) {
            // ignore localStorage errors
          }

          const retryOptions = {
            ...defaultOptions,
            headers: {
              ...((defaultOptions && (defaultOptions as any).headers) || {}),
              Authorization: `Bearer ${token}`
            }
          }
          const retryResp = await fetch(url, retryOptions)
          if (!retryResp.ok) {
            const retryErr = await retryResp.json().catch(() => ({ error: `HTTP ${retryResp.status}` }))
            throw new Error(retryErr.error || `HTTP ${retryResp.status}`)
          }
          return retryResp.json()
        }
      }
    } catch (e) {
      // ignore refresh errors and fallthrough to throw original 401
    }

    const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  // Retorna o JSON já parseado para facilitar consumo pelos componentes.
  return response.json()
}