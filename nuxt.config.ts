// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  // 仅在容器化 dev（反代 HTTPS 域名）时启用：让 Vite HMR 走 wss://$HMR_HOST，
  // 并放行该 Host。本地 `npm run dev`（未设 HMR_HOST）走默认行为，不受影响。
  vite: {
    server: {
      allowedHosts: process.env.HMR_HOST ? [process.env.HMR_HOST] : undefined,
      hmr: process.env.HMR_HOST
        ? { protocol: 'wss', host: process.env.HMR_HOST, clientPort: 443 }
        : undefined
    }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
