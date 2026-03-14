import { createPinia } from 'pinia'
import { useSessionStore } from './session'
import { useMessageStore } from './message'
import { useUserStore } from './user'

const pinia = createPinia()

export default pinia                    // 默认导出 Pinia 实例
export { useSessionStore, useMessageStore, useUserStore } // 具名导出 Store