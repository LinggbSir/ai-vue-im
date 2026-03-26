<template>
</template>
<script setup>
import { onMounted, onUnmounted } from 'vue'
import { getSocket } from '@/utils/socket'
import { useMessageStore } from '@/stores/message'

const socket = getSocket()
const messageStore = useMessageStore()

const handleNewMessage = (msg) => {
  console.log('newMsg', msg);
  if (msg.temp_id) {
    // 用真实消息替换临时消息
    messageStore.updateTempMessage(msg.session_id, msg.temp_id, msg);
  } else {
    messageStore.addMessage(msg.session_id, msg);
  }
};

onMounted(() => {
  if (socket) {
    socket.on('private message', handleNewMessage)
  }
})

onUnmounted(() => {
  if (socket) {
    socket.off('private message', handleNewMessage)
  }
})
</script>