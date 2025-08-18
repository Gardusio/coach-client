// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss"],
  ssr: true,
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
  build: {
    transpile: ["@vuepic/vue-datepicker"],
  },
});
