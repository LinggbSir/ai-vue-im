<template>
  <Teleport to="body">
    <div v-if="visible" class="video-dialog-overlay" @click.self="close">
      <div class="video-dialog" :class="{ connected: connected }">
        <!-- 关闭按钮（始终显示） -->
        <button class="close-btn" @click="close">✕</button>

        <!-- 未接通时显示：头像、昵称、状态提示 -->
        <template v-if="!connected">
          <div class="avatar-container">
            <img :src="avatar" alt="avatar" class="avatar" />
          </div>
          <h2 class="nickname">{{ nickname }}</h2>
          <p class="status">等待对方接受邀请...</p>
        </template>

        <!-- 视频区域（未接通时显示占位符，接通后铺满弹框） -->
        <div class="video-container" v-if="connected">
          <video
            ref="remoteVideoRef"
            autoplay
            playsinline
            class="remote-video"
          ></video>
          <!-- <div v-else class="no-video-placeholder">
            <span class="camera-icon">📹</span>
            <p>对方未接通</p>
          </div> -->
        </div>

        <!-- 底部控制栏（始终显示，接通后悬浮） -->
        <div class="controls">
          <div class="row first-row">
            <div class="control-item" @click="toggleMic">
              <div class="icon" :class="{ 'icon-off': !micEnabled }">
                <Mic v-if="micEnabled" />
                <MicOff v-else />
              </div>
              <span class="label">麦克风{{ micEnabled ? '开' : '关' }}</span>
            </div>

            <div class="control-item" @click="toggleCamera">
              <div class="icon" :class="{ 'icon-off': !cameraEnabled }">
                <Video v-if="cameraEnabled" />
                <VideoOff v-else />
              </div>
              <span class="label">摄像头{{ cameraEnabled ? '开' : '关' }}</span>
            </div>

            <div class="control-item" @click="toggleSpeaker">
              <div class="icon" :class="{ 'icon-off': !speakerEnabled }">
                <Volume2 v-if="speakerEnabled" />
                <VolumeOff v-else />
              </div>
              <span class="label">扬声器{{ speakerEnabled ? '开' : '关' }}</span>
            </div>
          </div>

          <div class="row second-row">
            <div class="control-item cancel" @click="hangup">
              <div class="icon">
                <Phone />
              </div>
              <span class="label">取消</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { Mic, MicOff, Phone, Volume2, VolumeOff, Video, VideoOff } from '@lucide/vue'

const props = defineProps({
  visible: Boolean,
  remoteStream: MediaStream,
  connected: Boolean,
  avatar: String,
  nickname: String,
  micEnabled: { type: Boolean, default: true },
  cameraEnabled: { type: Boolean, default: true },
  speakerEnabled: { type: Boolean, default: true }
})

const emit = defineEmits([
  'update:visible',
  'toggleMic',
  'toggleCamera',
  'toggleSpeaker',
  'hangup'
])

const remoteVideoRef = ref(null)

const bindRemoteStream = () => {
  if (remoteVideoRef.value && props.remoteStream) {
    remoteVideoRef.value.srcObject = props.remoteStream
    remoteVideoRef.value.play().catch(e => {
      console.warn('视频自动播放失败', e)
    })
    return true
  }
  return false
}

watch(() => props.remoteStream, (stream) => {
  if (!bindRemoteStream()) {
    console.log('视频元素尚未准备好，等待 connected')
  }
}, { immediate: true })

watch(() => props.connected, (connected) => {
  if (connected) {
    nextTick(() => bindRemoteStream())
  }
})

watch(() => props.speakerEnabled, (enabled) => {
  if (remoteVideoRef.value) {
    remoteVideoRef.value.muted = !enabled
  }
}, { immediate: true })

const close = () => {
  emit('update:visible', false)
}

const toggleMic = () => emit('toggleMic', !props.micEnabled)
const toggleCamera = () => emit('toggleCamera', !props.cameraEnabled)
const toggleSpeaker = () => emit('toggleSpeaker', !props.speakerEnabled)

const hangup = () => {
  emit('hangup')
  if (remoteVideoRef.value) {
    remoteVideoRef.value.srcObject = null
  }
  close()
}
</script>

<style scoped>
.video-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.video-dialog {
  position: relative;
  width: 450px;
  height: 800px;
  background-color: #fff;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.video-dialog.connected .avatar-container,
.video-dialog.connected .nickname,
.video-dialog.connected .status {
  display: none;
}
.video-dialog.connected .video-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  z-index: 1;
}
.video-dialog.connected .close-btn {
  z-index: 3;
}
.video-dialog.connected .label {
  color: #fff;
}
.video-dialog.connected .icon {
  background-color: rgba(255, 255, 255, 0.2);
}
.video-dialog.connected .icon-off {
  background-color: rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  padding: 8px;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.avatar-container {
  margin-top: 60px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #07c160;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  align-self: center;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nickname {
  margin-top: 24px;
  font-size: 24px;
  font-weight: 500;
  color: #333;
  text-align: center;
}

.status {
  margin-top: 12px;
  font-size: 16px;
  color: #999;
  text-align: center;
}

.remote-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-video-placeholder {
  text-align: center;
  color: #999;
}
.camera-icon {
  font-size: 100px;
  display: block;
  margin-bottom: 10px;
}
.no-video-placeholder p {
  font-size: 16px;
  margin: 0;
}

.controls {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: #fff;
  transition: all 0.2s;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 2;
  border-radius: 0 0 24px 24px;
  backdrop-filter: blur(8px);
}

.row {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.first-row {
  justify-content: space-around;
}

.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.control-item:hover {
  opacity: 0.8;
}

.control-item.cancel .icon {
  background-color: #f44336;
  color: white;
  border: none;
}

.icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.icon-off {
  background-color: #e0e0e0;
  opacity: 0.7;
  border-color: #999;
}

.label {
  font-size: 14px;
  color: #666;
}
</style>