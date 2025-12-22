#!/usr/bin/env node
/*
  Simple E2E provisioning helper.
  Usage:
    E2E_BASE_URL=http://localhost:3000 E2E_ADMIN_TOKEN=<admin-token> node setup-e2e.js

  The script will create a tenant, a test plugin entry and a test user, then write `.env.e2e`
  with the variables used by the Playwright tests.
*/

const fs = require('fs')

const base = process.env.E2E_BASE_URL || 'http://localhost:3000'
const adminToken = process.env.E2E_ADMIN_TOKEN

if (!adminToken) {
  console.error('E2E_ADMIN_TOKEN is required (admin API token).')
  process.exit(2)
}

function url(path) {
  return `${base.replace(/\/$/, '')}${path}`
}

async function call(path, options = {}) {
  const fetch = globalThis.fetch || require('node-fetch')
  const res = await fetch(url(path), options)
  const text = await res.text()
  let body
  try { body = text ? JSON.parse(text) : null } catch (e) { body = text }
  return { status: res.status, body }
}

;(async function main(){
  try {
    console.log('Creating tenant...')
    const tenantSlug = `e2e-tenant-${Date.now()}`
    const tenantPayload = { name: `E2E Tenant ${Date.now()}`, slug: tenantSlug }
    const t = await call('/api/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify(tenantPayload)
    })
    if (t.status < 200 || t.status >= 300) {
      console.error('Failed to create tenant:', t.status, t.body)
      process.exit(3)
    }
    const tenantId = t.body?.id || t.body?._id || t.body?.$id || tenantSlug
    console.log('Tenant created:', tenantId)

    console.log('Installing test plugin entry (admin)...')
    const pluginId = `e2e-test-plugin-${Date.now()}`
    const pluginPayload = { id: pluginId, name: 'E2E Test Plugin', entry: 'plugins/test/index.js', tenantId }
    const p = await call('/api/admin/plugins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify(pluginPayload)
    })
    if (p.status < 200 || p.status >= 300) {
      console.error('Failed to create plugin entry:', p.status, p.body)
      process.exit(4)
    }
    console.log('Plugin entry created:', pluginId)

    console.log('Creating test user...')
    const userEmail = `e2e+${Date.now()}@example.test`
    const userPass = 'E2Epass123!'
    const userPayload = { email: userEmail, password: userPass, name: 'E2E User', tenantId }
    const u = await call('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload)
    })
    if (u.status < 200 || u.status >= 300) {
      console.error('Failed to create user:', u.status, u.body)
      process.exit(5)
    }
    const userId = u.body?.id || u.body?._id || u.body?.user?.id || null
    console.log('User created:', userEmail, userId)

    // write .env.e2e
    const env = []
    env.push(`E2E_BASE_URL=${base}`)
    env.push(`TEST_PLUGIN_ID=${pluginId}`)
    env.push(`E2E_TENANT_ID=${tenantId}`)
    env.push(`E2E_TEST_USER_EMAIL=${userEmail}`)
    env.push(`E2E_TEST_USER_PASS=${userPass}`)
    if (userId) env.push(`TEST_USER_ID=${userId}`)

    fs.writeFileSync('.env.e2e', env.join('\n'))
    console.log('Wrote .env.e2e with variables:')
    console.log(env.join('\n'))
    console.log('\nRun tests with:')
    console.log('  source .env.e2e')
    console.log('  npx --prefix backend playwright test backend/tests/e2e/playwright/pac-002.plugins.execute.spec.ts')
  } catch (err) {
    console.error('Error during setup-e2e:', err)
    process.exit(10)
  }
})()
