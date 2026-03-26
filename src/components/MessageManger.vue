<template>
</template>
<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { getSocket } from '@/utils/socket'
import { useMessageStore } from '@/stores/message'
import { useSessionStore } from '@/stores/session'
import { useAuthStore } from '@/stores/auth'
import { useContactStore } from '@/stores/contact'
import { useRoute } from 'vue-router'

const route = useRoute()
const socket = getSocket()
const messageStore = useMessageStore()
const sessionStore = useSessionStore()
const contactStore = useContactStore()
const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)

const currentUserId = userInfo.value?.id
const handleNewMessage = async (msg) => {
  console.log('newMsg', msg);
  if (msg.temp_id) {
    // 用真实消息替换临时消息
    await messageStore.updateTempMessage(msg.session_id, msg.temp_id, msg);

  } else {
    await messageStore.addMessage(msg.session_id, msg);
    if (msg.sender_id === currentUserId) {
      // 发送方
      await sessionStore.updateSessionForLastRead(msg.session_id, msg)
    } else {
      // 接收方
      await sessionStore.updateSessionForUnreadCount(msg.session_id, msg)
    }
  }
};


watch(() => route.params.targetId, async (newTarget, oldTarget) => {
  if (oldTarget) {
    const oldSession = [oldTarget, currentUserId].sort().join('_')
    await updateSession(oldSession)
  }
  if (newTarget) {
    const newSession = [newTarget, currentUserId].sort().join('_')
    await updateSession(newSession)
  }
})

const updateSession = async (sessionId) => {
    const lastMessage = messageStore.getLastMessage(sessionId)
    if (lastMessage) {
      await sessionStore.updateSessionForLastRead(sessionId, lastMessage)
    } 
}


onMounted(() => {
  if (socket) {
    socket.on('private message', handleNewMessage)
    socket.on('user-status', ({ userId, online }) => {
      contactStore.updateOnlineStatus(userId, online);
    });
  }
})

onUnmounted(() => {
  if (socket) {
    socket.off('private message', handleNewMessage)
    socket.off('user-status', ({ userId, online }) => {
      contactStore.updateOnlineStatus(userId, online);
    });
  }
})
</script>