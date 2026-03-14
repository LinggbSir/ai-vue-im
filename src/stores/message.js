import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMessageStore = defineStore('message', () => {
  // 按会话 ID 存储消息列表，例如：{ [sessionId]: [msg1, msg2, ...] }
  const messagesBySession = ref({})

  // 获取某个会话的消息
  const getMessages = (sessionId) => {
    return messagesBySession.value[sessionId] || []
  }

  // 设置某个会话的消息（首次加载历史）
  const setMessages = (sessionId, messages) => {
    messagesBySession.value[sessionId] = messages
  }

  // 添加一条新消息（收到 WebSocket 推送时使用）
  const addMessage = (sessionId, message) => {
    if (!messagesBySession.value[sessionId]) {
      messagesBySession.value[sessionId] = []
    }
    messagesBySession.value[sessionId].push(message)
    console.log('addMessage:', messagesBySession.value[sessionId])
  }

  // 清空会话消息（如退出群聊）
  const clearMessages = (sessionId) => {
    delete messagesBySession.value[sessionId]
  }

  return {
    messagesBySession,
    getMessages,
    setMessages,
    addMessage,
    clearMessages
  }
})