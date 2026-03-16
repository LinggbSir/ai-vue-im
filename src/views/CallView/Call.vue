<template>
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
    @toggle-mic="() => {}"
    @toggle-speaker="() => {}"
    @cancel="rejectAudioCall"
  />

  <video ref="remoteVideoRef" autoplay playsinline></video>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
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
const targetId = computed(() => parseInt(route.params.targetId)) // 对方的用户ID

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
    startAudioCall( callStore.targetId.value)
  }
})
const remoteStream = ref(null)
const remoteVideoRef = ref(null)
const webrtc = useWebRTC({
  onRemoteStream: (stream) => {
    remoteStream.value = stream
  },
  onCallEnd: () => {
    showCall.value = false
  }
})

watch(remoteStream, (stream) => {
  if (remoteVideoRef.value && stream) {
    remoteVideoRef.value.srcObject = stream;
  }
});
// 来电状态
const showIncoming = ref(false)
// 通话对方信息
const callerInfo = ref({ id: null, name: '', avatar: '' })
const incomingCallData = ref(null) // 存储完整来电数据

// 通话弹框状态
const showCall = ref(false)
const targetName = ref('')
const targetAvatar = ref('')
const callConnected = ref(false)

// 请求通知权限（在页面加载时尝试）
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('浏览器不支持通知')
    return
  }
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    await Notification.requestPermission()
  }
}

const startAudioCall = () => {
  console.log('发起语音通话, targetId', targetId.value);
  callerInfo.value = contactList.value.find(c => c.id === targetId.value)
  console.log('callerInfo.value', callerInfo.value)
  showCall.value = true
  webrtc.startCall(targetId.value)
};
// 处理来电
const handleIncomingCall = (data) => {
  // 保存来电数据
  incomingCallData.value = data
  // 检查是否已存在该联系人
  callerInfo.value = contactList.value.find(c => c.id === data.from)
  
  console.log('来电数据:', data)
  console.log('callerInfo.value', callerInfo.value)
  // 如果页面可见，显示固定弹框
  if (document.visibilityState === 'visible') {
    showIncoming.value = true
  } else {
    // 页面不可见，显示系统通知
    showSystemNotification(callerInfo.value)
  }
}

// 显示系统通知
const showSystemNotification = (callerInfo) => {
  if (Notification.permission !== 'granted') return

  const notification = new Notification('来电提醒', {
    body: `${callerInfo.nick_name} 邀请你语音通话`,
    icon: callerInfo.avatar,
    tag: `call-${callerInfo.id}`, // 同一人只显示一个通知
    requireInteraction: true,    // 通知不自动消失
    data: { userId: callerInfo.id } // 携带数据
  })

  notification.onclick = (event) => {
    event.preventDefault()
    // 点击通知时，切换到当前标签页并打开通话弹框
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
    // 用户切回页面时，如果有未接来电，显示弹框
    showIncoming.value = true
  }
}

// 接通来电
const acceptAudioCall = () => {
  // 关闭来电弹框
  showIncoming.value = false
  // 设置通话对方信息
  targetName.value = callerInfo.value.nick_name
  targetAvatar.value = callerInfo.value.avatar
  // 打开通话弹框
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
}

// 主动结束通话
const rejectAudioCall = () => {
  showCall.value = false
  showIncoming.value = false
  incomingCallData.value = null
  webrtc.endCall()
  callStore.clearCall()
  // 发送拒绝信令
  socket?.emit('call-end', { to: callerInfo.value.id })
}

const handleVideoCall = () => {
  console.log('视频通话待实现');
};
</script>
