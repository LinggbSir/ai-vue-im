<template>
  <div class="chat-area">
    <div class="chat-header">
      <h3>与用户{{ friendId }}聊天中</h3>
    </div>
    <div class="message-list" ref="messageList">
      <div v-for="msg in messages" :key="msg.id" class="message" :class="{ 'self': msg.isSelf }">
        <div class="bubble">{{ msg.content }}</div>
        <div class="time">{{ msg.time }}</div>
      </div>
    </div>
    <div class="chat-footer">
      <input v-model="inputMsg" @keyup.enter="sendMsg" placeholder="输入消息..." />
      <button @click="sendMsg">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMessagesStore } from '@/stores/message'

const friendId = ref(123) // 临时
const inputMsg = ref('')
const messagesStore = useMessagesStore()
const currentSessionId = ref(friendId.value) // 假设当前会话 ID 就是好友 ID
const messages = computed(() => messagesStore.getMessages(currentSessionId.value))

const sendMsg = () => {
  if (!inputMsg.value.trim()) return
    messagesStore.addMessage(currentSessionId.value, {
      id: Date.now(),
      content: inputMsg.value,
      time: new Date().toLocaleTimeString().slice(0,5),
      isSelf: true
    })
  inputMsg.value = ''
}
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