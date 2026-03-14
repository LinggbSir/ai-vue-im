import { createPinia } from 'pinia'
import { useSessionStore } from './session'
import { useMessageStore } from './message'
import { authStore } from './auth'
import { useContactStore } from './contact'

const pinia = createPinia()

export default pinia                    // 默认导出 Pinia 实例
export { useSessionStore, useMessageStore, authStore, useContactStore } // 具名导出 Store