import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import 'element-plus/dist/index.css'
import './styles/element-override.css'

const app = createApp(App)

// 路由和状态管理
app.use(router)
app.use(pinia)


// 挂载应用
app.mount('#app')