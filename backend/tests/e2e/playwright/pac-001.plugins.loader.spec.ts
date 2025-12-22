import { test, expect } from '@playwright/test'

const base = process.env.E2E_BASE_URL || 'http://localhost:3000'
const testPluginId = process.env.TEST_PLUGIN_ID

test.describe('PAC-001 - Sistema de Plugins - Loader (Playwright)', () => {
  test('GET /api/plugins retorna lista de plugins (pelo menos 1)', async ({ request }) => {
    const res = await request.get(`${base.replace(/\/$/, '')}/api/plugins`)
    expect(res.status()).toBeGreaterThanOrEqual(200)
    expect(res.status()).toBeLessThan(300)

    const body = await res.json()
    expect(body).toBeDefined()
    expect(Array.isArray(body.plugins)).toBe(true)
    expect(body.plugins.length).toBeGreaterThan(0)

    if (testPluginId) {
      const hasTest = body.plugins.some((p: any) => p && (p.id === testPluginId || p._id === testPluginId))
      expect(hasTest).toBeTruthy()
    } else {
      for (const p of body.plugins) {
        expect(p).toHaveProperty('id')
      }
    }
  })
})
