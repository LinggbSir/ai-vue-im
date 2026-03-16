<template>
  <div class="chat-area" ref="chatAreaRef">
    <div class="message-list" ref="messageListRef" @scroll="handleScroll">
      <!-- 加载更多指示器 -->
      <div v-if="showLoadMore" class="loading-more-tip">{{ loadingMore ? '加载中...' : '查看更多消息' }}</div>
      <div v-if="!hasMore" class="no-more">没有更多消息</div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message"
        :class="{ self: msg.sender_id === currentUserId }"
      >
        <!-- 对方消息的头像放在左侧 -->
        <img
          v-if="msg.sender_id !== currentUserId"
          :src="msg.avatar"
          class="avatar"
          alt="avatar"
        />
        <div class="bubble-wrapper">
          <div class="bubble">{{ msg.content }}</div>
          <div class="time">{{ formatTime(msg.created_at) }}</div>
        </div>
        <!-- 自己消息的头像放在右侧 -->
        <img
          v-if="msg.sender_id === currentUserId"
          :src="msg.avatar"
          class="avatar"
          alt="avatar"
        />
      </div>
    </div>

    <!-- 重构后的输入区域 -->
    <div class="input-area">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="toolbar-btn" title="表情" @click="handleEmoji">😊</button>
          <button class="toolbar-btn" title="文件" @click="handleFile">📎</button>
        </div>
        <div class="toolbar-right">
          <button class="toolbar-btn" title="音频通话" @click="startAudioCall">📞</button>
          <button class="toolbar-btn" title="视频通话" @click="startVideoCall">📹</button>
        </div>
      </div>

      <!-- 输入行：多行输入框 + 发送按钮 -->
      <div class="input-row">
        <textarea
          v-model="inputText"
          @keyup.enter="sendMessage"
          placeholder="输入消息..."
          rows="3"
          class="message-input"
        ></textarea>
        <button class="send-btn" @click="sendMessage" :disabled="sending">发送</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'

import { useMessageStore } from '@/stores/message'
import { useAuthStore } from '@/stores/auth'
import { useCallStore } from '@/stores/call'

import { getSocket } from '@/utils/socket'

const route = useRoute()
const authStore = useAuthStore()
const messageStore = useMessageStore()

const { messagesBySession, loadingMoreBySession, hasMoreBySession } = storeToRefs(messageStore)
const { userInfo } = storeToRefs(authStore)

const currentUserId = userInfo.value.id
const targetId = computed(() => parseInt(route.params.targetId)) // 对方的用户ID
const sessionId = computed(() => {
  const userId = currentUserId
  if (!userId || !targetId.value) return null
  return [userId, targetId.value].sort().join('_')
})

const messages = computed(() => {
  if (!sessionId.value) return []
  return messageStore.getMessages(sessionId.value)
})
const loadingMore = computed(() => loadingMoreBySession.value[sessionId.value])
const hasMore = computed(() => hasMoreBySession.value[sessionId.value] !== false) // 默认true

const messageListRef = ref(null)
const inputText = ref('')
const sending = ref(false)

// 初始化消息：首次加载最新的30条
const loadInitialMessages = async () => {
  if (!sessionId.value) return
  await messageStore.loadMoreMessages(sessionId.value) // 因为loadMore内部处理了首次加载（beforeId=null）
}

const SCROLL_TOP_THRESHOLD = 20 // 显示提示的阈值（像素）
const showLoadMore = ref(false)
let lastScrollTop = 0 // 记录上一次滚动位置，用于判断方向

// 滚动到底部
const scrollToBottom = () => {
  const container = messageListRef.value
  if (!container) return
  nextTick(() => {
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

// 滚动监听，判断是否接近顶部（阈值可调）
const handleScroll = () => {
  const container = messageListRef.value
  if (!container) return

  const scrollTop = container.scrollTop
  const direction = scrollTop < lastScrollTop ? 'up' : 'down'
  lastScrollTop = scrollTop

  // 1. 控制提示显示：当接近顶部且还有更多消息且不在加载中时，显示提示
  if (scrollTop < SCROLL_TOP_THRESHOLD && hasMore.value && !loadingMore.value) {
    showLoadMore.value = true
  } else {
    showLoadMore.value = false
  }
  if (scrollTop <= 0 && direction === 'up' && hasMore.value && !loadingMore.value) {
    loadMoreMessages()
  }
}

const loadMoreMessages = async () => {
  if (loadingMore.value || !hasMore.value) return

  const container = messageListRef.value
  if (!container) return

  // 记录加载前的第一个消息元素及其偏移量
  const firstMsgEl = container.querySelector('.message')
  let oldOffsetTop = 0
  let oldScrollTop = 0
  if (firstMsgEl) {
    oldOffsetTop = firstMsgEl.offsetTop
    oldScrollTop = container.scrollTop
  }

  // 执行加载
  await messageStore.loadMoreMessages(sessionId.value)
  await nextTick()

  // 如果之前有记录，且元素仍然存在，调整滚动位置
  if (firstMsgEl && document.contains(firstMsgEl)) {
    const newOffsetTop = firstMsgEl.offsetTop
    container.scrollTop = oldScrollTop + (newOffsetTop - oldOffsetTop) - 30
  }
}

// 收到新消息时的处理
const socket = getSocket()
const handleNewMessage = (msg) => {
  messageStore.addMessage(sessionId.value, msg)
  if (msg.session_id === sessionId.value && msg.sender_id === currentUserId) {
    scrollToBottom()
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputText.value.trim() || sending.value) return
  sending.value = true
  socket.emit('private message', {
    to: parseInt(targetId.value),
    content: inputText.value
  })
  inputText.value = ''
  sending.value = false
}

// 监听路由参数变化（切换会话）
watch([sessionId, targetId], async ([newSession, newTarget], [oldSession]) => {
  if (newSession && newTarget) {
    // 先清空当前会话的消息？可以选择保留缓存，这里不清空，因为已经按session存储了
    await loadInitialMessages()
    scrollToBottom()
  }
}, { immediate: true })

onMounted(() => {
  socket?.on('private message', handleNewMessage)
})

onUnmounted(() => {
  socket?.off('private message', handleNewMessage)
})

const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

const handleEmoji = () => {
  console.log('表情功能待实现');
};

const handleFile = () => {
  console.log('文件发送待实现');
};

const callStore = useCallStore()
const startAudioCall = () => {
  console.log('开始音频通话:', targetId.value);
  callStore.startCall('audio', targetId.value)
};

const startVideoCall = () => {
  console.log('开始视频通话:', targetId.value);
  callStore.startCall('video', targetId.value)
};

</script>

<style scoped>
.chat-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.message {
  display: flex;
  align-items: flex-end; /* 底部对齐，常见设计 */
  margin-bottom: 10px;
  gap: 8px;
}
.message.self {
  flex-direction: row-reverse; /* 自己消息头像在右侧 */
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.bubble-wrapper {
  max-width: 60%;
  display: flex;
  flex-direction: column;
}
.bubble {
  background-color: #f0f0f0;
  padding: 8px 12px;
  border-radius: 8px;
  word-wrap: break-word;
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
.input-area {
  border-top: 1px solid #e5e5e5;
  background-color: #fafafa;
  padding: 8px 16px;
}

.input-area input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 8px;
}
.input-area button {
  padding: 8px 16px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.loading-more, .no-more {
  text-align: center;
  padding: 10px;
  color: #999;
  font-size: 12px;
}
.load-more-tip {
  text-align: center;
  padding: 8px;
  color: #999;
  font-size: 12px;
  cursor: default; /* 非点击，所以不需要 pointer */
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  height: 36px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
}

.toolbar-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.toolbar-btn:hover {
  background-color: #e5e5e5;
}

/* 输入行 */
.input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end; /* 让按钮与 textarea 底部对齐 */
}

.message-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: none; /* 禁止调整大小，或允许垂直调整，自行决定 */
  min-height: 60px;
  max-height: 120px;
  overflow-y: auto;
}

.message-input:focus {
  outline: none;
  border-color: #07c160;
}

.send-btn {
  padding: 10px 20px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  height: fit-content; /* 高度自适应内容，与 textarea 底部对齐 */
}

.send-btn:hover:not(:disabled) {
  background-color: #06b156;
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>