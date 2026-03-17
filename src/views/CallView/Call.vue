<template>
  <div class="call-global-container">
    <IncomingCallDialog
      :visible="showIncoming"
      :caller-name="callerInfo?.nick_name || '未知'"
      :caller-avatar="callerInfo?.avatar || '/default-avatar.jpg'"
      :caller-id="callerInfo?.id || 'unknown'"
      :type="callType"
      @accept="acceptCall"
      @reject="rejectCall"
    />

    <AudioCallDialog
      v-model:visible="showAudioCall"

      :avatar="targetAvatar"
      :nickname="targetName"
      :connected="callConnected"
      :mic-enabled="micEnabled"
      :speaker-enabled="speakerEnabled"
      @toggle-mic="handleToggleMic"
      @toggle-speaker="handleToggleSpeaker"
      @hangup="rejectCall"
    />

    <VideoCallDialog
      v-model:visible="showVideoCall"
      :remote-stream="remoteStream"
      :connected="callConnected"
      :mic-enabled="micEnabled"
      :camera-enabled="cameraEnabled"
      :speaker-enabled="speakerEnabled"
      @toggle-mic="handleToggleMic"
      @toggle-camera="handleToggleCamera"
      @toggle-speaker="handleToggleSpeaker"
      @hangup="rejectCall"
    />
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
import AudioCallDialog from '@/components/webrtc/AudioCallDialog.vue'
import IncomingCallDialog from '@/components/webrtc/IncomingCallDialog.vue'
import VideoCallDialog from '@/components/webrtc/VideoCallDialog.vue'



const route = useRoute()
const contactStore = useContactStore()
const callStore = useCallStore()

const { contactList } = storeToRefs(contactStore)
const { callType, targetId } = storeToRefs(callStore)

const socket = getSocket()


const speakerEnabled = ref(true) // 扬声器默认开启
const micEnabled = ref(true)     // 麦克风默认开启
const cameraEnabled = ref(true)  // 摄像头默认开启

// 来电/通话状态
const showIncoming = ref(false)
const callerInfo = ref({ id: null, name: '', avatar: '' })
const incomingCallData = ref(null)

const showAudioCall = ref(false)
const showVideoCall = ref(false)
const targetName = ref('')
const targetAvatar = ref('')
const callConnected = ref(false)

// 远程流
const remoteStream = ref(null)

// WebRTC 实例
const webrtc = useWebRTC({
  onRemoteStream: (stream) => {
    remoteStream.value = stream
    console.log('收到远程流，视频轨道数:', stream.getVideoTracks().length);
  },
  onCallConnected: () => {
    callConnected.value = true
    console.log('通话连接成功')
  }
})

window.webrtc = webrtc



// 麦克风开关控制本地音频轨道
watch(micEnabled, (enabled) => {
  if (webrtc.localStream?.valu) {
    webrtc.localStream.value.getAudioTracks().forEach(track => {
      track.enabled = enabled
    })
  }
}, { immediate: true })

// 摄像头开关控制本地视频轨道
watch(cameraEnabled, (enabled) => {
  if (webrtc.localStream?.value) {
    webrtc.localStream.value.getVideoTracks().forEach(track => {
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

// 处理摄像头开关事件
const handleToggleCamera = (val) => {
  cameraEnabled.value = val
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
const initiateCall = (targetId, type = 'audio') => {
  console.log(targetId)
  callerInfo.value = contactList.value.find(c => c.id === targetId)
  console.log('callerInfo.value', callerInfo.value)
  if (type === 'audio') {
    showAudioCall.value = true
  } else if (type === 'video') {
    showVideoCall.value = true
  }
  webrtc.startCall(targetId, type)
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
  if (
    document.visibilityState === 'visible' && 
    incomingCallData.value && 
     !showAudioCall.value && 
     !showVideoCall.value
    ) {
    showIncoming.value = true
  }
}

// 接通来电
const acceptCall = () => {
  showIncoming.value = false
  targetName.value = callerInfo.value.nick_name
  targetAvatar.value = callerInfo.value.avatar
  console.log('incomingCallData.value.type', incomingCallData.value.type)
  if (incomingCallData.value.type === 'audio') {
    showAudioCall.value = true
  } else if (incomingCallData.value.type === 'video') {
    showVideoCall.value = true
    console.log('showVideoCall.value', showVideoCall.value)
  }
  webrtc.acceptCall(callerInfo.value.id, incomingCallData.value.offer, incomingCallData.value.type)
}

// 被动结束通话
const endCall = () => {
  console.log('被动结束通话')
  showAudioCall.value = false
  showVideoCall.value = false
  showIncoming.value = false
  incomingCallData.value = null
  callStore.clearCall()
  webrtc.endCall()
}

// 主动结束通话
const rejectCall = () => {
  console.log('主动结束通话')
  showAudioCall.value = false
  showVideoCall.value = false
  showIncoming.value = false
  incomingCallData.value = null
  webrtc.endCall()
  callStore.clearCall()
  socket?.emit('call-end', { to: callerInfo.value?.id })
}

onMounted(() => {
  requestNotificationPermission()
  document.addEventListener('visibilitychange', handleVisibilityChange)

  socket?.on('webrtc-offer', handleIncomingCall)
  socket?.on('webrtc-answer', webrtc.handleAnswer)
  socket?.on('webrtc-candidate', webrtc.handleCandidate)
  socket?.on('call-end', endCall)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  socket?.off('webrtc-offer', handleIncomingCall)
  socket?.off('webrtc-answer', webrtc.handleAnswer)
  socket?.off('webrtc-candidate', webrtc.handleCandidate)
  socket?.off('call-end', endCall)
})

watch(() => callStore.callType, (newType) => {
  console.log('callStore.callType', newType)
    if (newType !== null) {
      initiateCall(targetId.value, newType)
    }
})

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