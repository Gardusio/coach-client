// server/api/fitbit/token/refresh.post.ts
import { defineEventHandler, createError } from 'h3'
import { getSessionId, tokensKey, metaKey } from '../../utils/session'
import { refreshTokens } from '../../utils/fitbit'

export default defineEventHandler(async (event) => {
  const sid = await getSessionId(event)
  const storage = useStorage()
  const existing = await storage.getItem<any>(tokensKey(sid))
  if (!existing?.refresh_token) throw createError({ statusCode: 401, statusMessage: 'No refresh token' })

  const cfg = useRuntimeConfig()
  const clientId = cfg.public.fitbitClientId
  const appType = cfg.public.fitbitAppType
  const clientSecret = appType === 'server' && cfg.fitbitClientSecret ? cfg.fitbitClientSecret : undefined

  const res = await refreshTokens({ clientId, clientSecret, refreshToken: existing.refresh_token })
  // Fitbit rotates refresh tokens; store the new pair and discard the old one. :contentReference[oaicite:6]{index=6}
  const expiresAt = Date.now() + res.expires_in * 1000
  await storage.setItem(tokensKey(sid), {
    access_token: res.access_token,
    refresh_token: res.refresh_token ?? existing.refresh_token, // if absent, keep (defensive)
    expires_at: expiresAt,
    scope: res.scope,
    user_id: res.user_id
  })
  await storage.setItem(metaKey(sid), {
    scope: res.scope.split(' ').filter(Boolean),
    user_id: res.user_id,
    expires_at: expiresAt
  })
  return { ok: true, userId: res.user_id, expiresAt }
})
