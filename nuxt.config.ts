// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: [ "@pinia/nuxt", "@nuxtjs/tailwindcss"],
  supabase: { redirect: false },
  ssr: true,
  nitro: {
    preset: "cloudflare_module",
    prerender: { autoSubfolderIndex: false },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },
  build: {
    transpile: ["@vuepic/vue-datepicker"],
  },
});
