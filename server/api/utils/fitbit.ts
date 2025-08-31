// server/utils/fitbit.ts
import { $fetch } from 'ofetch'

const TOKEN_URL = 'https://api.fitbit.com/oauth2/token'
const REVOKE_URL = 'https://api.fitbit.com/oauth2/revoke'
// Introspection exists at /oauth2/introspect (v1.1) if you want to validate server-side.  :contentReference[oaicite:3]{index=3}

type TokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  token_type: 'Bearer'
  user_id: string
}

export async function exchangeCode(opts: {
  clientId: string
  clientSecret?: string
  code: string
  codeVerifier: string
  redirectUri: string
}): Promise<TokenResponse> {
  const body = new URLSearchParams()
  body.set('client_id', opts.clientId)
  body.set('code', opts.code)
  body.set('code_verifier', opts.codeVerifier)
  body.set('grant_type', 'authorization_code')
  body.set('redirect_uri', opts.redirectUri)

  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' }
  if (opts.clientSecret) {
    const basic = Buffer.from(`${opts.clientId}:${opts.clientSecret}`).toString('base64')
    headers['Authorization'] = `Basic ${basic}`
  }

  return await $fetch<TokenResponse>(TOKEN_URL, { method: 'POST', body, headers })
}

export async function refreshTokens(opts: {
  clientId: string
  clientSecret?: string
  refreshToken: string
}): Promise<TokenResponse> {
  const body = new URLSearchParams()
  body.set('grant_type', 'refresh_token')
  body.set('refresh_token', opts.refreshToken)
  body.set('client_id', opts.clientId)

  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' }
  if (opts.clientSecret) {
    const basic = Buffer.from(`${opts.clientId}:${opts.clientSecret}`).toString('base64')
    headers['Authorization'] = `Basic ${basic}`
  }

  return await $fetch<TokenResponse>(TOKEN_URL, { method: 'POST', body, headers })
}

export async function revokeToken(opts: {
  clientId: string
  clientSecret?: string
  token: string // refresh token preferred; Fitbit revokes consent for the token provided
}) {
  const body = new URLSearchParams()
  body.set('token', opts.token)
  // For public clients, Fitbit expects client_id in the body; confidential clients use Basic. :contentReference[oaicite:4]{index=4}
  if (!opts.clientSecret) body.set('client_id', opts.clientId)

  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' }
  if (opts.clientSecret) {
    const basic = Buffer.from(`${opts.clientId}:${opts.clientSecret}`).toString('base64')
    headers['Authorization'] = `Basic ${basic}`
  }
  // Fitbit documents POST /oauth2/revoke in its API explorer. :contentReference[oaicite:5]{index=5}
  await $fetch(REVOKE_URL, { method: 'POST', body, headers })
}
