import type { NextApiRequest, NextApiResponse } from 'next'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
const INJECT_TENANT = process.env.NEXT_PUBLIC_INJECT_TENANT === 'true' || process.env.NODE_ENV !== 'production'
const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'default'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { slug } = req.query
    const path = Array.isArray(slug) ? slug.join('/') : String(slug || '')

    const url = `${BACKEND}/api/plugins/${path}${req.url?.includes('?') ? '' : ''}`

    // Prepare headers: forward most headers but override host/connection
    const forwardHeaders: Record<string, string> = {}
    Object.entries(req.headers).forEach(([k, v]) => {
      if (!v) return
      // Skip headers that should not be forwarded
      if (['host', 'connection'].includes(k)) return
      if (Array.isArray(v)) forwardHeaders[k] = v.join(',')
      else forwardHeaders[k] = v
    })

    // Inject tenant in dev when configured
    if (INJECT_TENANT) {
      forwardHeaders['x-tenant-id'] = DEFAULT_TENANT
    }

    // Fetch from backend
    const backendRes = await fetch(url + (req.url?.includes('?') ? '' : ''), {
      method: req.method,
      headers: {
        ...forwardHeaders,
        'content-type': req.headers['content-type'] || 'application/json'
      },
      body: ['GET', 'HEAD'].includes((req.method || '').toUpperCase()) ? undefined : req.body ? JSON.stringify(req.body) : undefined,
    })

    const buffer = await backendRes.arrayBuffer()
    const body = Buffer.from(buffer)

    // Copy status and headers
    backendRes.headers.forEach((value, key) => {
      // Prevent Next from overwriting some headers
      if (key.toLowerCase() === 'transfer-encoding') return
      res.setHeader(key, value)
    })

    res.status(backendRes.status).send(body)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ error: 'Proxy request failed', details: error instanceof Error ? error.message : String(error) })
  }
}
