// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss"],
  ssr: true,
  runtimeConfig: {
    // server-only secrets
    fitbitClientSecret: process.env.FITBIT_CLIENT_SECRET || "",
    // public values the browser may read
    public: {
      baseUrlDev: process.env.NUXT_PUBLIC_BASE_URL_DEV,
      baseUrlProd: process.env.NUXT_PUBLIC_BASE_URL_PROD,
      fitbitClientId: process.env.FITBIT_CLIENT_ID || "",
      fitbitRedirectUri:
        process.env.FITBIT_REDIRECT_URI ||
        "http://localhost:3000/auth/fitbit/callback",
      // space-delimited scopes; override per-call if you like
      fitbitScopes:
        "activity heartrate location nutrition cardio_fitness oxygen_saturation profile respiratory_rate settings sleep social temperature weight",
      // App type per Fitbit settings: 'server' | 'client' | 'personal'
      fitbitAppType: process.env.FITBIT_APP_TYPE || "server",
    },
  },
  nitro: {
    preset: "cloudflare-module",
    prerender: { autoSubfolderIndex: false },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
    replace: {
      "typeof window": "`undefined`",
    },
  },
});
