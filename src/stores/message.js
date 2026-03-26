import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'

export const useMessageStore = defineStore('message', () => {
  // 存储每个会话的消息列表，按会话ID索引
  const messagesBySession = ref({})
  // 记录每个会话是否还有更多历史消息
  const hasMoreBySession = ref({})
  // 记录每个会话是否正在加载更多
  const loadingMoreBySession = ref({})

  const messageCount = computed(() => {
    let total = 0
    for (const msgs of Object.values(messagesBySession.value)) {
      total += msgs.length
    }
    return total
  })

  // 获取某个会话的消息
  const getMessages = (sessionId) => messagesBySession.value[sessionId] || []

  // 设置整个会话的消息（首次加载）
  const setMessages = (sessionId, messages) => {
    messagesBySession.value[sessionId] = messages
  }

  // 追加更早的消息到列表顶部（保持升序）
  const prependMessages = (sessionId, olderMessages) => {
    const current = messagesBySession.value[sessionId] || []
    // 合并并去重（根据id）
    const merged = [...olderMessages, ...current]
    // 简单去重，假设消息id唯一
    const unique = merged.filter((msg, index, self) => 
      index === self.findIndex(m => m.id === msg.id)
    )
    messagesBySession.value[sessionId] = unique
  }

  // 添加一条新消息（实时推送）
  const addMessage = (sessionId, message) => {
    if (!messagesBySession.value[sessionId]) {
      messagesBySession.value[sessionId] = []
    }
    messagesBySession.value[sessionId].push(message)
  }

  // 异步加载历史消息
  const loadMoreMessages = async (sessionId, firstLoad = false) => {
    if (loadingMoreBySession.value[sessionId]) return
    const currentMessages = messagesBySession.value[sessionId] || []
    // 获取当前列表中最旧的消息ID（最早的一条）
    const oldestMessage = currentMessages[0]
    const beforeId = oldestMessage ? oldestMessage.id : ''

    // 如果没有更多可加载（根据之前记录的hasMore标志）
    if (hasMoreBySession.value[sessionId] === false) return

    loadingMoreBySession.value[sessionId] = true
    try {
      const res = await request.get('/messages', {
        params: {
          sessionId,
          beforeId,
          limit: 30
        }
      })
      if (res.success) {
        if (res.messages.length > 0) {
          prependMessages(sessionId, res.messages)
        }
        hasMoreBySession.value[sessionId] = res.hasMore
      } else {
        console.error('加载历史消息失败', res.error)
      }
    } catch (err) {
      console.error('加载历史消息网络错误', err)
    } finally {
      loadingMoreBySession.value[sessionId] = false
    }
  }

  // 重置会话消息（退出登录或切换会话时调用）
  const clearSessionMessages = (sessionId) => {
    delete messagesBySession.value[sessionId]
    delete hasMoreBySession.value[sessionId]
    delete loadingMoreBySession.value[sessionId]
  }

  const addTempMessage = (sessionId, tempId, message) => {
    if (!messagesBySession.value[sessionId]) {
      messagesBySession.value[sessionId] = [];
    }
    messagesBySession.value[sessionId].push({ ...message, id: tempId, temp: true });
  };

  const updateTempMessage = (sessionId, tempId, realMessage) => {
    const msgs = messagesBySession.value[sessionId];
    if (!msgs) return;
    const index = msgs.findIndex(m => m.id === tempId);
    if (index !== -1) {
      msgs.splice(index, 1, { ...realMessage, temp: false });
    }
  };

  const removeTempMessage = (sessionId, tempId) => {
    const msgs = messagesBySession.value[sessionId];
    if (!msgs) return;
    messagesBySession.value[sessionId] = msgs.filter(m => m.id !== tempId);
  };

  const getLastMessage = (sessionId) => {
    const msgs = messagesBySession.value[sessionId];
    if (!msgs) return null;
    return msgs[msgs.length - 1];
  }

  return {
    messagesBySession,
    loadingMoreBySession,
    hasMoreBySession,
    messageCount,
    getMessages,
    setMessages,
    prependMessages,
    addMessage,
    loadMoreMessages,
    clearSessionMessages,
    addTempMessage,
    updateTempMessage,
    removeTempMessage,
    getLastMessage
  }
})