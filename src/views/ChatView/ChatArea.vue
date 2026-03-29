<template>
  <div v-if="route.params.targetId" class="chat-area" ref="chatAreaRef">
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
          :src="msg.sender_avatar || '/default_avatar.png'"
          class="avatar"
          alt="avatar"
        />
        <div class="bubble-wrapper">
          <!-- 文本消息 -->
          <div v-if="msg.msg_type === 0" class="bubble">{{ msg.content }}</div>

          <!-- 文件消息 -->
          <div v-else-if="msg.msg_type === 1" class="file-bubble">
            <!-- 图片消息 -->
            <div v-if="msg.fileInfo?.mimeType.startsWith('image/')" class="image-preview" @click="previewImage(msg.fileInfo.url)">
              <img :src="msg.fileInfo.thumbnailUrl || msg.fileInfo.url" alt="图片" loading="lazy" />
            </div>
            <!-- 视频消息 -->
            <div v-else-if="msg.fileInfo?.mimeType.startsWith('video/')" class="video-preview" @click="playVideo(msg.fileInfo.url)">
              <video :src="msg.fileInfo.url" preload="metadata" style="display: none;"></video>
              <img :src="msg.fileInfo.thumbnailUrl || '/video-placeholder.png'" alt="视频" />
              <span class="play-icon">▶</span>
            </div>
            <!-- 其他文件 -->
            <div v-else class="generic-file" @click="downloadFile(msg.fileInfo)">
              <span class="file-icon">📎</span>
              <div class="file-info">
                <div class="file-name">{{ msg.fileInfo?.name || msg.content }}</div>
                <div class="file-size">{{ formatSize(msg.fileInfo?.size) }}</div>
                <a :href="msg.fileInfo?.url" target="_blank" download @click.stop>下载</a>
              </div>
            </div>
          </div>

          <div class="time">{{ formatTime(msg.created_at) }}</div>
        </div>
        <!-- 自己消息的头像放在右侧 -->
        <img
          v-if="msg.sender_id === currentUserId"
          :src="userInfo.avatar || '/default_avatar.png'"
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
          <button class="toolbar-btn" title="表情" @click="handleEmoji"><Smile /></button>
          <button class="toolbar-btn" title="文件" @click="triggerFileSelect(false)"><FolderClosed /></button>
        </div>
        <div class="toolbar-right">
          <button class="toolbar-btn" title="在线快传" @click="triggerFileSelect(true)"><Zap /></button>
          <button class="toolbar-btn" title="音频通话" @click="startAudioCall"><Phone /></button>
          <button class="toolbar-btn" title="视频通话" @click="startVideoCall"><Video /></button>
        </div>
      </div>

      <!-- 输入行：多行输入框 + 发送按钮 -->
      <div class="input-row">
        <textarea
          v-model="inputText"
          ref="inputRef"
          @keyup.enter="sendMessage"
          rows="3"
          class="message-input"
        ></textarea>
        <button class="send-btn" @click="sendMessage" :disabled="sending">发送</button>
      </div>
      <input
        ref="fileInput"
        type="file"
        style="display: none"
        @change="handleFileSelected"
      />
    </div>
      <div v-if="previewVisible" class="image-preview-modal" @click.self="previewVisible = false">
        <img :src="previewUrl" />
        <span class="close" @click="previewVisible = false">✕</span>
      </div>
      <div v-if="videoVisible" class="video-modal" @click.self="videoVisible = false">
        <video :src="videoUrl" controls autoplay style="width: 80%; height: auto;"></video>
        <span class="close" @click="videoVisible = false">✕</span>
      </div>
  </div>
  <div v-else class="loading">请选择聊天对象</div>
</template>
<script setup>
import { ref, computed, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import { Smile, FolderClosed, Zap, Phone, Video } from '@lucide/vue'

import { useMessageStore } from '@/stores/message'
import { useAuthStore } from '@/stores/auth'
import { useWebRTCStore } from '@/stores/webrtc'


import { getSocket } from '@/utils/socket'
import request from '@/utils/request'

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
const inputRef = ref(null)
const fileTransferType = ref(false)

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

const socket = getSocket()
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

// 监听当前会话的消息列表变化，当有新消息且发送者是当前用户时滚动到底部
watch(() => messages.value.length, (newLen, oldLen) => {
  if (newLen > oldLen) {
    const lastMsg = messages.value[newLen - 1]
    if (lastMsg.sender_id === currentUserId) {
      scrollToBottom()
    }
  }
})

// 监听路由参数变化（切换会话）
watch([sessionId, targetId], async ([newSession, newTarget], [oldSession]) => {
  if (newSession && newTarget) {
    // 首次加载消息时
    if (!messagesBySession.value[newSession] || messagesBySession.value[newSession].length === 0) {
      await loadInitialMessages()
    }
    scrollToBottom()
  }
}, { immediate: true })


const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

const handleEmoji = () => {
  console.log('表情功能待实现');
};

const fileInput = ref(null)

const triggerFileSelect = (type) => {
  fileTransferType.value = type
  fileInput.value.click()
}

const handleFileSelected = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (fileTransferType.value) {
    fileTransferType.value = false
    webRTCStore.startSendingFile(file, targetId.value)
    event.target.value = ''
    return;
  }

  // 生成临时ID
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // 构造临时消息对象（用于立即显示）
  const tempMsg = {
    id: tempId,
    sender_id: currentUserId,
    receiver_id: targetId.value,
    content: file.name,           // 显示文件名
    msg_type: 1,
    file_name: file.name,
    file_size: file.size,
    file_mime: file.type,
    temp: true,
    createdAt: new Date().toISOString()
  };
  console.log('tempMsg', tempMsg);

  // 添加到 store
  messageStore.addTempMessage(sessionId.value, tempId, tempMsg);

  await sendFileByHttp(file, tempId)
  event.target.value = ''
};
const sendFileByHttp = async (file, tempId) => {
  // 上传文件
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await request.post('/file/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res.success) {
      const { fileId, url, name, size, mimeType } = res.data;
      // 通过 WebSocket 发送文件消息，带上 tempId
      socket.emit('private message', {
        to: targetId.value,
        content: name,           // 文件名
        fileId,
        msgType: 1,
        tempId                   // 让服务端原样返回
      });
    } else {
      // 上传失败，移除临时消息（或显示失败）
      messageStore.removeTempMessage(sessionId.value, tempId);
      alert('上传失败：' + (res.error || '未知错误'));
    }
  } catch (err) {
    console.error('上传错误', err);
    messageStore.removeTempMessage(sessionId.value, tempId);
    alert('网络错误，请稍后重试');
  } finally {
    event.target.value = '';
  }
};

// 格式化文件大小
const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / 1048576).toFixed(1) + 'MB'
}

const webRTCStore = useWebRTCStore()
const isCallActive = computed(() => webRTCStore.isCallActive)
const startAudioCall = () => {
  console.log('开始音频通话:', targetId.value);
  webRTCStore.startCall('audio', targetId.value)
};

const startVideoCall = () => {
  console.log('开始视频通话:', targetId.value);
  webRTCStore.startCall('video', targetId.value)
};

const previewVisible = ref(false);
const previewUrl = ref('');

const previewImage = (url) => {
  previewUrl.value = url;
  previewVisible.value = true;
};

const videoVisible = ref(false);
const videoUrl = ref('');

const playVideo = (url) => {
  videoUrl.value = url;
  videoVisible.value = true;
};

const downloadFile = (fileInfo) => {
  if (!fileInfo?.url) return;
  const a = document.createElement('a');
  a.href = fileInfo.url;
  a.download = fileInfo.name; // 指定下载文件名
  a.click();
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
  flex-direction: row; /* 自己消息头像在右侧 */
  justify-content: flex-end;
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
  background-color: none;
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
  color: #818181;          /* 初始图标颜色，根据你的设计可调整 */
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  color: #3f3f3f;
}

.toolbar-btn:active {
  color: #07c160;          /* 点击时图标变为绿色 */
  background-color: #e5e5e5; /* 可选，保持悬浮背景，也可不加 */
}
/* 输入行 */
.input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end; /* 让按钮与 textarea 底部对齐 */
}

.message-input {
  flex: 1;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: none; /* 禁止调整大小，或允许垂直调整，自行决定 */
  height: 150px;
  overflow-y: auto;
  background-color: #fafafa;
}

.message-input:focus {
  outline: none;
}

.send-btn {
  padding: 10px 20px;
  background-color: #f0f0f0;
  color: #07c160;
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
/* 文件消息气泡 */
.file-bubble {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #f0f0f0;
  padding: 12px;
  border-radius: 8px;
  min-width: 200px;
}

.self .file-bubble {
  background-color: #07c160;
  color: white;
}

.file-icon {
  font-size: 24px;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: 500;
  word-break: break-word;
  color: #333;
}

.file-size {
  font-size: 12px;
  opacity: 0.7;
  color: #333;
}

.file-info a {
  color: #07c160;
  text-decoration: none;
  font-size: 12px;
}

.self .file-info a {
  color: white;
}

.file-info a:hover {
  text-decoration: underline;
}

.sending-indicator {
  display: inline-block;
  margin-right: 8px;
}
.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.image-preview-modal {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}
.image-preview-modal img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}
.image-preview {
  max-width: 100%;          /* 受父级气泡宽度限制 */
  max-height: 200px;        /* 限制最大高度，避免过高 */
  border-radius: 8px;
  overflow: hidden;         /* 防止内容溢出 */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0; /* 加载时的背景色 */
  cursor: pointer;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;      /* 保持比例，完整显示图片 */
}
.close {
  position: absolute;
  top: 20px; right: 30px;
  color: white;
  font-size: 40px;
  cursor: pointer;
}
.video-modal {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

/* 移除文件消息的气泡背景和内边距 */
.file-bubble {
  background: none !important;
  padding: 0 !important;
}

/* 可选：给预览容器增加一点圆角，让视觉效果更柔和 */
.image-preview {
  border-radius: 8px;
  overflow: hidden;
}

.video-preview {
  position: relative; /* 确保按钮相对该容器定位 */
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.video-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.video-preview .play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px; /* 稍大一些 */
  color: white;
  background: rgba(0, 0, 0, 0.5); /* 半透明黑色圆形背景 */
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* 点击穿透，由父容器处理 */
  z-index: 2;
  border: 2px solid rgba(255,255,255,0.3); /* 可选边框 */
  box-sizing: border-box;
}

/* 如果之前为 .self .file-bubble 设置了特殊背景，一并清除 */
.self .file-bubble {
  background: none;
}

.generic-file {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e0e0e0;    /* 淡灰色边框 */
  border-radius: 8px;            /* 圆角，与气泡风格统一 */
  padding: 8px 12px;             /* 内边距，避免内容紧贴边框 */
  background-color: transparent; /* 背景透明，如果之前没有背景 */
}

/* 可选：针对自己发送的文件消息，如果需要不同边框颜色，可以单独设置 */
.self .generic-file {
  border-color: #b0b0b0;         /* 自己消息的边框可以更深或更浅，根据喜好调整 */
}
</style>