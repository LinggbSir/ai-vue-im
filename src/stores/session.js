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
      throw new Error(res.error || '获取会话列表失败')
      ElMessage.error(res.error || '获取会话列表失败')
    }
    loading.value = false
  }
  const clearSessionList = () => {
    sessionList.value = []
    loaded.value = false
  }
  return {
    sessionList,
    loading,
    getSessionList,
    clearSessionList
  }
})