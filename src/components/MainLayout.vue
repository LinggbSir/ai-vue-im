<!-- src/layouts/MainLayout.vue -->
<template>
  <div class="layout">
    <!-- 左侧导航 -->
    <SideNav />
    
    <!-- 中间列表区 -->
    <div class="list-area">
      <router-view name="list" />
    </div>
    
    <!-- 右侧内容区 -->
    <div class="content-area">
      <router-view />
    </div>
  </div>
  <!-- 放置弹窗组件，但控制权交给 SideNav 通过 provide/inject -->
  <SettingsDialog ref="settingsDialogRef" />
  <Call />
  <FileTransfer />
</template>

<script setup>
import SideNav from '@/components/SideNav.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import { useWebRTCCall } from '@/components/webrtc/webrtc.js'
import FileTransfer from '@/components/webrtc/FileTransfer.vue'
import Call from '@/components/webrtc/Call.vue'
import { ref, provide, onMounted, onUnmounted } from 'vue'
import { getSocket } from '@/utils/socket'

const socket = getSocket()

const settingsDialogRef = ref(null)
provide('settingsDialog', {
  open: () => settingsDialogRef.value?.open()
})

const remoteStream = ref(null)
const callConnected = ref(false)
provide('remoteStream', remoteStream)
provide('callConnected', callConnected)


// WebRTC 实例
const webrtc = useWebRTCCall({
  onRemoteStream: (stream) => {
    remoteStream.value = stream
    console.log('收到远程流，视频轨道数:', stream.getVideoTracks().length);
  },
  onCallConnected: () => {
    callConnected.value = true
    console.log('通话连接成功')
  }
})
provide('webrtc', webrtc)

onMounted(() => {
  socket?.on('webrtc-answer', webrtc.handleAnswer)
  socket?.on('webrtc-candidate', webrtc.handleCandidate)
})
onUnmounted(() => {
  socket?.off('webrtc-answer', webrtc.handleAnswer)
  socket?.off('webrtc-candidate', webrtc.handleCandidate)
})

window.webrtc = webrtc
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.list-area {
  width: 330px;  /* 原来280px，适当加宽 */
  border-right: 1px solid #e5e5e5;
  background-color: #f8f9fa;
  overflow-y: auto;
}
.content-area {
  flex: 1;
  background-color: #ffffff;
  overflow-y: auto;
}
</style>