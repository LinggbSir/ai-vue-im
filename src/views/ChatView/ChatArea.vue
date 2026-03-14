<template>
  <div class="chat-area">
    <div class="chat-header">
      <h3>与用户{{ currentTargetId }}聊天中</h3>
    </div>
    <div class="message-list" ref="messageList">
      <div v-for="msg in messages" :key="msg.id" class="message" :class="{ 'self': msg.from === userStore.myId }">
        <div class="bubble">{{ msg.content }}</div>
        <div class="time">{{ formatTime(msg.createdAt) }}</div>
      </div>
    </div>
    <div class="chat-footer">
      <input v-model="inputMsg" @keyup.enter="sendMsg" placeholder="输入消息..." />
      <button @click="sendMsg">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { authStore, useMessageStore } from '@/stores/index'
import { useRoute  } from 'vue-router'
import dayjs from 'dayjs'
import { getSocket } from '@/utils/socket'

const formatTime = (timestamp) => {
  return dayjs(timestamp).format('HH:mm') // 仅显示时分
}

const route = useRoute()
const inputMsg = ref('')
const messagesStore = useMessageStore()
const userStore = authStore() 
const currentTargetId = ref(null)
const sessionId = computed(() => {
  if (!currentTargetId.value) return null
  return [userStore.myId, currentTargetId.value].sort().join('_')
})
// const messages = computed(() => messagesStore.getMessages(currentTargetId.value))
const messages = computed(() => {
  console.log('重新计算')
  if (!sessionId.value) return []
  return messagesStore.messagesBySession[sessionId.value] || []
})
watch(messages, (newMessages) => {
  console.log('newMessages:', newMessages)
})

watch(() => route.params.targetId, (newTargetId) => {
  console.log('newTargetId:', newTargetId)
  currentTargetId.value = newTargetId
})

const sendMsg = () => {
  if (!inputMsg.value.trim()) returnx``
  socket.emit('private message', {
    to: parseInt(currentTargetId.value),
    content: inputMsg.value,
  });
  inputMsg.value = ''
}

const socket = getSocket()
const handleNewMsg = (msg) => {
  console.log('msg:', msg)
  messagesStore.addMessage(sessionId.value, msg)
}
onMounted(() => {
  socket?.on('private message', handleNewMsg);
  console.log('myId:', userStore.myId)
});

onUnmounted(() => {
  socket?.off('private message', handleNewMsg);
});

</script>

<style scoped>
.chat-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
}
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.message {
  max-width: 60%;
  align-self: flex-start;
}
.message.self {
  align-self: flex-end;
}
.bubble {
  background-color: #f0f0f0;
  padding: 8px 12px;
  border-radius: 8px;
}
.self .bubble {
  background-color: #07c160;
  color: white;
}
.time {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}
.chat-footer {
  padding: 16px;
  border-top: 1px solid #e5e5e5;
  display: flex;
  gap: 8px;
}
.chat-footer input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.chat-footer button {
  padding: 8px 16px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>