import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

export const useSessionStore = defineStore('session', () => {
  const sessionList = ref([])
  const loading = ref(false)
  const loaded = ref(false)

  const getSessionList = async () => {
    if (loaded.value) {
      return
    }
    loading.value = true
    const res = await request.get('/sessions')
    if (res.success) {
      // 假设后端已经返回了每个会话的 target_name 和 avatar
      sessionList.value = res.sessions || []
      loaded.value = true
      console.log(' store sessionList:', sessionList.value)
    } else {
      ElMessage.error(res.error || '获取会话列表失败')
      throw new Error(res.error || '获取会话列表失败')
    }
    loading.value = false
  }
  const clearSessionList = () => {
    sessionList.value = []
    loaded.value = false
  }

  const updateSessionForLastRead = async (sessionId, msg) => {
    const session = sessionList.value.find(s => s.session_id === sessionId)
    if (session && session.last_read_msg_id !== msg.id) {
      try {
        await request.put(`/sessions/${sessionId}/read`, { lastReadMsgId: msg.id });
        session.last_read_msg_id = msg.id
        session.unread_count = 0
        session.last_msg_time = msg.created_at
        session.last_msg_content = msg.content
      } catch (err) {
        console.error('上报已读位置失败', err);
      }
    }
  }

  const updateSessionForUnreadCount = async (sessionId, msg) => {
    const session = sessionList.value.find(s => s.session_id === sessionId)
    if (session) {
      session.unread_count += 1
      session.last_msg_time = msg.created_at
      session.last_msg_content = msg.content
    }
  }
  return {
    sessionList,
    loading,
    getSessionList,
    clearSessionList,
    updateSessionForLastRead,
    updateSessionForUnreadCount
  }
})