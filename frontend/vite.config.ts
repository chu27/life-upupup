import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,       // 监听所有网络接口，手机可访问
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
