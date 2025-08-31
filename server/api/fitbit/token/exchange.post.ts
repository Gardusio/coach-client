// server/api/fitbit/token/exchange.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { getSessionId, tokensKey, metaKey } from '../../utils/session'
import { exchangeCode } from '../../utils/fitbit'

export default defineEventHandler(async (event) => {
  const { code, codeVerifier, redirectUri } = await readBody(event)
  if (!code || !codeVerifier || !redirectUri) throw createError({ statusCode: 400, statusMessage: 'Missing fields' })

  const sid = await getSessionId(event)
  const storage = useStorage()
  const cfg = useRuntimeConfig()
  const clientId = cfg.public.fitbitClientId
  const appType = cfg.public.fitbitAppType
  const clientSecret = appType === 'server' && cfg.fitbitClientSecret ? cfg.fitbitClientSecret : undefined

  const tokens = await exchangeCode({ clientId, clientSecret, code, codeVerifier, redirectUri })

  const expiresAt = Date.now() + tokens.expires_in * 1000
  await storage.setItem(tokensKey(sid), {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    scope: tokens.scope,
    user_id: tokens.user_id
  })
  await storage.setItem(metaKey(sid), {
    scope: tokens.scope.split(' ').filter(Boolean),
    user_id: tokens.user_id,
    expires_at: expiresAt
  })

  return { ok: true, userId: tokens.user_id, expiresAt: expiresAt }
})
