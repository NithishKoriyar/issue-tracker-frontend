import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig(({ mode }) => {
  // Read .env (all keys, not only VITE_*). BACKEND_URL is only used here, by
  // the dev server — it is never sent to the browser. In production the same
  // variable name is read by nginx instead (see nginx.conf).
  const env = loadEnv(mode, '.', '')
  const backendUrl = env.BACKEND_URL || 'http://localhost:5000'

  return {
    resolve: { tsconfigPaths: true },
    // Dev: forward /api to the Express API so the browser sees ONE origin
    // (same as nginx in production) — no CORS, first-party refresh cookie.
    server: {
      proxy: {
        '/api': backendUrl,
      },
    },
    plugins: [
      devtools(),
      tailwindcss(),
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      viteReact(),
    ],
  }
})

export default config
