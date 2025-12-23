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
      refresh: '/api/auth/refresh'
    }
  }
}

// Função helper para fazer chamadas para a API
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  // Use caminho relativo para rotas internas `/api` para garantir same-origin
  // (isso evita que o browser faça POST cross-site para :4000 e não envie cookies
  // por causa da política SameSite). Para endpoints externos mantenha o baseURL.
  const url = endpoint.startsWith('/api') ? endpoint : `${API_CONFIG.baseURL}${endpoint}`

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'include', // Para enviar cookies
    ...options
  }

  const response = await fetch(url, defaultOptions)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }

  // Retorna o JSON já parseado para facilitar consumo pelos componentes.
  return response.json()
}