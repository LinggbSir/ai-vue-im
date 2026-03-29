import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWebRTCStore = defineStore('webrtc', () => {
  const callType = ref(null) // 'audio' or 'video' or null
  const targetId = ref(null)
  const isCallActive = ref(false)
  const file = ref(null)
  const isFileSending = ref(false)

  const startCall = (type, id) => {
    callType.value = type
    targetId.value = id
    isCallActive.value = true
  }

  const clearCall = () => {
    callType.value = null
    targetId.value = null
    isCallActive.value = false
  }

  const startSendingFile = (f, id) => {
    file.value = f
    targetId.value = id
    isFileSending.value = true
  }

  const clearSendingFile = () => {
    file.value = null
    targetId.value = null
    isFileSending.value = false
  }
  const clearWebRTCState = () => {
    callType.value = null
    targetId.value = null
    isCallActive.value = false
    file.value = null
    isFileSending.value = false
  }

  return { 
    callType, 
    targetId, 
    isCallActive, 
    file, 
    isFileSending, 
    startCall, 
    clearCall, 
    startSendingFile, 
    clearSendingFile,  
    clearWebRTCState
   }
})