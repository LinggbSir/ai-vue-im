import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCallStore = defineStore('call', () => {
  const callType = ref(null) // 'audio' or 'video' or null
  const targetId = ref(null)

  const startCall = (type, id) => {
    callType.value = type
    targetId.value = id
    // 这里可以触发其他副作用，比如显示弹框
  }

  const clearCall = () => {
    callType.value = null
    targetId.value = null
  }

  return { callType, targetId, startCall, clearCall }
})