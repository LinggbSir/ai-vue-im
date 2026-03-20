<script setup>
import { inject, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useWebRTCStore } from '@/stores/webrtc'
import { getSocket } from '@/utils/socket'

const webrtc = inject('webrtc')
const socket = getSocket()
const webRTCStore = useWebRTCStore()

const { file, targetId, isFileSending } = storeToRefs(webRTCStore)  // 添加 isFileSending

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
    await webrtc.sendFile(targetId.value, file.value)
    webRTCStore.clearSendingFile()
  }
})

const handleOfferFile = (data) => {
  const { from, offer } = data
  webrtc.acceptFile(from, offer)
}
const handleFileTransferEnd = (data) => {
  webrtc.endFileTransfer()
}
</script>