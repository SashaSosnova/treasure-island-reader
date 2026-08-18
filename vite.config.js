import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    watch: {
      // APK / Android assets can lock files on Windows and crash the watcher
      ignored: [
        '**/android/**',
        '**/public-releases/**',
        '**/tmp-apk/**',
        '**/release/**',
        '**/.tmp-screens/**',
      ],
    },
  },
})
