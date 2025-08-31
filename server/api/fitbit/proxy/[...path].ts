// server/api/fitbit/proxy/[...path].ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { getSessionId, tokensKey } from '../../utils/session'
import { $fetch } from 'ofetch'

export default defineEventHandler(async (event) => {
  const sid = await getSessionId(event)
  const storage = useStorage()
  const tokens = await storage.getItem<any>(tokensKey(sid))
  if (!tokens?.access_token) throw createError({ statusCode: 401, statusMessage: 'Not authorized' })

  // Optional silent refresh if near expiry (within 60s)
  if (tokens.expires_at && tokens.expires_at < Date.now() + 60_000 && tokens.refresh_token) {
    try {
      await $fetch('/api/fitbit/token/refresh', { method: 'POST' })
      const fresh = await storage.getItem<any>(tokensKey(sid))
      if (fresh?.access_token) tokens.access_token = fresh.access_token
    } catch { /* ignore */ }
  }

  const path = event.context.params?.path
  if (!path) throw createError({ statusCode: 400, statusMessage: 'Missing path' })

  const query = getQuery(event)
  const url = new URL(`https://api.fitbit.com/${Array.isArray(path) ? path.join('/') : path}`)
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v))

  // Only allow read endpoints by default; upgrade as needed.
  // You can guard write routes here if required.
  const method = event.method || 'GET'
  const body = method === 'GET' ? undefined : await readRawBody(event)

  const res = await $fetch(url.toString(), {
    method,
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    body
  })

  return res
})
