<template>
  <!-- 发送进度弹窗（自定义浮动窗） -->
  <div v-if="showProgressDialog" class="float-dialog" style="top: 20px; right: 20px;">
    <div class="dialog-header">
      <span>在线快传 发给 {{ targetName }}：</span>
      <!-- 可添加关闭按钮（但这里不需要，因为完成后有确认按钮） -->
    </div>
    <div class="dialog-body">
      <div class="file-info" v-if="transferFileBaseInfo">
        <div class="file-name">{{ transferFileBaseInfo?.name }}</div>
        <div class="file-size">{{ formatSize(transferFileBaseInfo?.size) }}</div>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: fileTransferProgress + '%' }"></div>
        </div>
        <div class="progress-text">{{ fileTransferProgress.toFixed(2) }}%</div>
        <button v-if="fileTransferProgress === 100" class="primary-btn" @click="showProgressDialog = false">确认</button>
      </div>
    </div>
  </div>

  <!-- 接收询问弹窗（自定义浮动窗） -->
  <div v-if="showConfirmDialog" class="float-dialog" style="top: 20px; right: 20px;">
    <div class="dialog-header">
      <span>在线快传 来自 {{ senderName }}：</span>
    </div>
    <div class="dialog-body">
      <div>
        <p class="file-name">{{ transferFileBaseInfo?.name }}</p>
        <p class="file-size">{{ formatSize(transferFileBaseInfo?.size) }}</p>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: fileTransferProgress.toFixed(2) + '%' }"></div>
        </div>
        <div class="progress-text">{{ fileTransferProgress }}%</div>
      </div>
      <div v-if="fileTransferProgress === 100" class="dialog-footer">
        <button class="reject-btn" @click="rejectFile">拒绝</button>
        <button class="primary-btn" @click="downloadFile">接收并下载</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import request from '@/utils/request'

import { useWebRTCStore } from '@/stores/webrtc'
import { getSocket } from '@/utils/socket'

const webrtc = inject('webrtc')
const socket = getSocket()
const webRTCStore = useWebRTCStore()

const { file, targetId, isFileSending } = storeToRefs(webRTCStore)

const showProgressDialog = ref(false)
const showConfirmDialog = ref(false)
const transferFileBaseInfo = ref(null)
const senderId = ref(null)
const senderName = ref('')
const targetName = ref('')
const fileTransferProgress = computed(() => webrtc.fileTransferProgress.value)
const downloadLink = computed(() => webrtc.downloadLink.value)

onMounted(() => {
  socket?.on('webrtc-offer-file', handleOfferFile)
  socket?.on('webrtc-file-transfer-end', handleFileTransferEnd)
})
onUnmounted(() => {
  socket?.off('webrtc-offer-file', handleOfferFile)
  socket?.off('webrtc-file-transfer-end', handleFileTransferEnd)
})

watch(isFileSending, async (newVal) => {
  if (newVal) {
    showProgressDialog.value = true
    transferFileBaseInfo.value = {
      name: file.value.name,
      size: file.value.size,
      type: file.value.type
    }
    const res = await request.get(`/users/${targetId.value}`)
    targetName.value = res.data.nick_name || res.data.remark || ''
    await webrtc.sendFile(targetId.value, file.value)
    webRTCStore.clearSendingFile()
  }
})

const handleOfferFile = async (data) => {
  const { from, offer, fileInfo } = data
  transferFileBaseInfo.value = fileInfo
  console.log('接收文件', fileInfo)
  const res = await request.get(`/users/${from}`)
  senderName.value = res.data.nick_name || res.data.remark || ''
  senderId.value = from
  showConfirmDialog.value = true
  webrtc.acceptFile(from, offer)
}

const downloadFile = () => {
  downloadLink.value.click()
  showConfirmDialog.value = false
  fileTransferProgress.value = 0
  setTimeout(() => {
    URL.revokeObjectURL(downloadLink.value.href)
    downloadLink.value.remove()
  }, 1000)
}

const rejectFile = () => {
  URL.revokeObjectURL(downloadLink.value.href)
  downloadLink.value.remove()
  showConfirmDialog.value = false
  fileTransferProgress.value = 0
}

const handleFileTransferEnd = (data) => {
  webrtc.endFileTransfer()
  transferFileBaseInfo.value = null
  fileTransferProgress.value = 0
}

const formatSize = (bytes) => {
  if (!bytes) return '0B'
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / 1048576).toFixed(1) + 'MB'
}
</script>
<style scoped>
.float-dialog {
  position: fixed;
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 2000;
  overflow: hidden;
}
.dialog-header {
  padding: 12px 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e5e5e5;
}
.dialog-body {
  padding: 16px;
}
.file-info {
  text-align: center;
  margin-bottom: 12px;
}
.file-name {
  font-weight: bold;
  word-break: break-all;
}
.file-size {
  font-size: 12px;
  color: #999;
}
.progress-container {
  text-align: center;
  margin-top: 12px;
}
.progress-bar {
  width: 100%;
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background-color: #07c160;
  width: 0%;
  transition: width 0.2s;
}
.progress-text {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}
.dialog-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.primary-btn {
  background-color: #07c160;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.primary-btn:hover {
  background-color: #06b156;
}
.reject-btn {
  background-color: #f56c6c;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.reject-btn:hover {
  background-color: #f54545;
}
</style>