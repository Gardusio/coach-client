// stores/fitbitAuth.ts
import { defineStore } from 'pinia'

type FitbitSession = {
  userId: string | null
  scope: string[]
  expiresAt: number | null // epoch ms
  active: boolean
}

export const useFitbitAuthStore = defineStore('fitbitAuth', {
  state: (): FitbitSession => ({
    userId: null,
    scope: [],
    expiresAt: null,
    active: false
  }),
  actions: {
    async hydrateSession() {
      const sess = await $fetch('/api/fitbit/proxy/session')
      this.userId = sess?.userId ?? null
      this.scope = Array.isArray(sess?.scope) ? sess.scope : []
      this.expiresAt = typeof sess?.expiresAt === 'number' ? sess.expiresAt : null
      this.active = Boolean(sess?.active)
    },
    clear() {
      this.userId = null
      this.scope = []
      this.expiresAt = null
      this.active = false
    }
  },
  getters: {
    isAuthorized: (s) => s.active && !!s.userId && (!!s.expiresAt ? s.expiresAt > Date.now() : true)
  }
})
