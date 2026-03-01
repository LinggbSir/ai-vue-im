import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import axios from 'axios'
import { socket } from './utils/socket'

const app = createApp(App)

// 路由和状态管理
app.use(router)
app.use(pinia)

// 配置全局 axios
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
app.config.globalProperties.$axios = axios

// 挂载 WebSocket 客户端（可选）
app.config.globalProperties.$socket = socket

// 全局组件（如通用弹窗）
// import Message from '@/components/Message.vue'
// app.component('Message', Message)

// 挂载应用
app.mount('#app')