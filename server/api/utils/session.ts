// server/utils/session.ts
import { H3Event, getCookie, setCookie } from 'h3'
import { randomUUID } from 'node:crypto'

const STORAGE_NS = 'fitbit_sessions'
const SID_COOKIE = 'fitbit_sid'

export async function getSessionId(event: H3Event) {
  let sid = getCookie(event, SID_COOKIE)
  if (!sid) {
    sid = randomUUID()
    setCookie(event, SID_COOKIE, sid, { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30 })
  }
  return sid
}

export function tokensKey(sid: string) {
  return `${STORAGE_NS}:${sid}:tokens`
}

export function metaKey(sid: string) {
  return `${STORAGE_NS}:${sid}:meta`
}
