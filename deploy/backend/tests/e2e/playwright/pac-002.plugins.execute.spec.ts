import { test, expect } from '@playwright/test'

const base = process.env.E2E_BASE_URL || 'http://localhost:3000'
const pluginId = process.env.TEST_PLUGIN_ID
const tenantId = process.env.E2E_TENANT_ID
const userEmail = process.env.E2E_TEST_USER_EMAIL
const userPass = process.env.E2E_TEST_USER_PASS
const testUserId = process.env.TEST_USER_ID

test.describe('PAC-002 - Sistema de Plugins - Execução (Playwright)', () => {
  test('Autentica e executa plugin com contexto', async ({ request }) => {
    test.skip(!pluginId || !tenantId || !userEmail || !userPass, 'variáveis E2E necessárias não definidas')

    // 1) Autenticar
    const loginRes = await request.post(`${base.replace(/\/$/, '')}/auth/login`, {
      data: { email: userEmail, password: userPass }
    })
    expect(loginRes.ok()).toBeTruthy()
    const loginBody = await loginRes.json()

    // Extrair token e userId (tolerante a formatos)
    const token = loginBody?.accessToken || loginBody?.token || loginBody?.data?.accessToken
    const userId = testUserId || loginBody?.user?.id || loginBody?.data?.user?.id

    const headers: Record<string,string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    // 2) Executar plugin
    const execRes = await request.post(`${base.replace(/\/$/, '')}/api/plugins/${pluginId}/execute`, {
      headers,
      data: { tenantId, userId }
    })

    // 3) Verificar resposta
    expect(execRes.status()).toBe(200)
    const execBody = await execRes.json()
    expect(execBody).toBeDefined()
    expect(execBody.success).toBeTruthy()
    expect(execBody.data).toBeDefined()

    // Opcional: checar campos esperados básicos no payload
    if (execBody.data && typeof execBody.data === 'object') {
      // exemplo: plugin pode retornar `result` ou `output`
      const hasPayload = 'result' in execBody.data || 'output' in execBody.data || Object.keys(execBody.data).length > 0
      expect(hasPayload).toBeTruthy()
    }
  })
})
