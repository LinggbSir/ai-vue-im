<template>
  <div class="call-global-container">
    <IncomingCallDialog
      :visible="showIncoming"
      :caller-name="callerInfo?.nick_name || '未知'"
      :caller-avatar="callerInfo?.avatar || '/default-avatar.jpg'"
      :caller-id="callerInfo?.id || 'unknown'"
      @accept="acceptAudioCall"
      @reject="rejectAudioCall"
    />

    <CallDialog
      v-model:visible="showCall"
      :avatar="targetAvatar"
      :nickname="targetName"
      :connected="callConnected"
      :mic-enabled="micEnabled"
      :speaker-enabled="speakerEnabled"
      @toggle-mic="handleToggleMic"
      @toggle-speaker="handleToggleSpeaker"
      @cancel="rejectAudioCall"
    />
    
    <audio ref="remoteAudioRef" autoplay style="display: none"></audio>
    <video ref="remoteVideoRef" autoplay playsinline></video>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'

import { useCallStore } from '@/stores/call'
import { useContactStore } from '@/stores/contact'
import { getSocket } from '@/utils/socket'
import { useWebRTC } from '@/components/webrtc/webrtc.js'
import CallDialog from '@/components/webrtc/CallDialog.vue'
import IncomingCallDialog from '@/components/webrtc/IncomingCallDialog.vue'

const route = useRoute()
const contactStore = useContactStore()
const callStore = useCallStore()

const { contactList } = storeToRefs(contactStore)

const socket = getSocket()
const targetId = computed(() => parseInt(route.params.targetId))

// 音频相关
const remoteAudioRef = ref(null)
const speakerEnabled = ref(true) // 扬声器默认开启
const micEnabled = ref(true)     // 麦克风默认开启

// 来电/通话状态
const showIncoming = ref(false)
const callerInfo = ref({ id: null, name: '', avatar: '' })
const incomingCallData = ref(null)

const showCall = ref(false)
const targetName = ref('')
const targetAvatar = ref('')
const callConnected = ref(false)

// 远程流
const remoteStream = ref(null)
const remoteVideoRef = ref(null)

// WebRTC 实例
const webrtc = useWebRTC({
  onRemoteStream: (stream) => {
    remoteStream.value = stream
  },
  onCallEnd: () => {
    showCall.value = false
    callConnected.value = false
  },

})

// 当远程流变化时，绑定到 audio 元素
watch(() => remoteStream.value, (stream) => {
  if (remoteAudioRef.value && stream) {
    console.log('音频流变化', stream)
    console.log('音频轨道数量:', stream.getAudioTracks())
    remoteAudioRef.value.srcObject = stream
    remoteAudioRef.value.play().catch(e => {
      console.warn('音频自动播放失败，可能需要用户手势', e)
    })
  }
}, { immediate: true })

// 扬声器开关控制静音
watch(speakerEnabled, (enabled) => {
  if (remoteAudioRef.value) {
    remoteAudioRef.value.muted = !enabled
  }
}, { immediate: true })

// 麦克风开关控制本地音频轨道
watch(micEnabled, (enabled) => {
  if (webrtc.localStream?.value) {
    webrtc.localStream.value.getAudioTracks().forEach(track => {
      track.enabled = enabled
    })
  }
}, { immediate: true })

// 处理麦克风开关事件
const handleToggleMic = (val) => {
  micEnabled.value = val
}

// 处理扬声器开关事件
const handleToggleSpeaker = (val) => {
  speakerEnabled.value = val
}

// 请求通知权限
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('浏览器不支持通知')
    return
  }
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    await Notification.requestPermission()
  }
}

// 发起通话
const startAudioCall = () => {
  console.log('发起语音通话, targetId', targetId.value)
  callerInfo.value = contactList.value.find(c => c.id === targetId.value)
  console.log('callerInfo.value', callerInfo.value)
  showCall.value = true
  webrtc.startCall(targetId.value)
}

// 处理来电
const handleIncomingCall = (data) => {
  incomingCallData.value = data
  callerInfo.value = contactList.value.find(c => c.id === data.from)

  console.log('来电数据:', data)
  console.log('callerInfo.value', callerInfo.value)

  if (document.visibilityState === 'visible') {
    showIncoming.value = true
  } else {
    showSystemNotification(callerInfo.value)
  }
}

// 显示系统通知
const showSystemNotification = (callerInfo) => {
  if (Notification.permission !== 'granted') return

  const notification = new Notification('来电提醒', {
    body: `${callerInfo.nick_name} 邀请你语音通话`,
    icon: callerInfo.avatar,
    tag: `call-${callerInfo.id}`,
    requireInteraction: true,
    data: { userId: callerInfo.id }
  })

  notification.onclick = (event) => {
    event.preventDefault()
    window.focus()
    if (incomingCallData.value) {
      console.log('系统通知')
      showIncoming.value = true
    }
    notification.close()
  }
}

// 监听页面可见性变化
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible' && incomingCallData.value && !showCall.value) {
    showIncoming.value = true
  }
}

// 接通来电
const acceptAudioCall = () => {
  showIncoming.value = false
  targetName.value = callerInfo.value.nick_name
  targetAvatar.value = callerInfo.value.avatar
  showCall.value = true
  webrtc.acceptCall(callerInfo.value.id, incomingCallData.value.offer)
}

// 被动结束通话
const endAudioCall = () => {
  showCall.value = false
  showIncoming.value = false
  incomingCallData.value = null
  callStore.clearCall()
  webrtc.endCall()
  if (remoteAudioRef.value) {
    remoteAudioRef.value.srcObject = null
  }
}

// 主动结束通话
const rejectAudioCall = () => {
  showCall.value = false
  showIncoming.value = false
  incomingCallData.value = null
  webrtc.endCall()
  callStore.clearCall()
  socket?.emit('call-end', { to: callerInfo.value.id })
  if (remoteAudioRef.value) {
    remoteAudioRef.value.srcObject = null
  }
}

onMounted(() => {
  requestNotificationPermission()
  document.addEventListener('visibilitychange', handleVisibilityChange)

  socket?.on('webrtc-offer', handleIncomingCall)
  socket?.on('webrtc-answer', webrtc.handleAnswer)
  socket?.on('webrtc-candidate', webrtc.handleCandidate)
  socket?.on('call-end', endAudioCall)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  socket?.off('webrtc-offer', handleIncomingCall)
  socket?.off('webrtc-answer', webrtc.handleAnswer)
  socket?.off('webrtc-candidate', webrtc.handleCandidate)
  socket?.off('call-end', endAudioCall)
})

watch(() => callStore.callType, (newType) => {
  if (newType === 'audio') {
    startAudioCall(callStore.targetId.value)
  }
})

const handleVideoCall = () => {
  console.log('视频通话待实现')
}
</script>

<style scoped>
.call-global-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}
</style>