import { createPinia } from 'pinia'
import { useSessionStore } from './session'
import { useMessageStore } from './message'
import { useAuthStore } from './auth'
import { useContactStore } from './contact'
import { useWebRTCStore } from './webrtc'

const pinia = createPinia()

export default pinia                    // 默认导出 Pinia 实例
export { useSessionStore, useMessageStore, useAuthStore, useContactStore, useWebRTCStore } // 具名导出 Store
export async function initAllStores() {
  await Promise.all([
    useSessionStore().getSessionList(),
    useContactStore().getContactList(),
  ])
  await useContactStore().fetchFriendsOnlineStatus()
}