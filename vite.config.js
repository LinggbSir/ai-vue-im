import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173, // 前端开发服务器端口
    proxy: {
      // 代理 /api 到后端服务器
      '/api': {
        target: 'http://localhost:3000', // 你的后端地址
        changeOrigin: true,
        // 可选：如果后端接口没有 /api 前缀，可以重写路径
        // rewrite: (path) => path.replace(/^\/api/, '')
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('代理请求:', req.url);
          });
        }
      }
    }
  }
})