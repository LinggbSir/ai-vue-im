<template>
  <Teleport to="body">
    <div v-if="visible" class="video-dialog-overlay" @click.self="close">
      <div class="video-dialog">
        <!-- 关闭按钮 -->
        <button class="close-btn" @click="close">✕</button>

        <!-- 视频区域（包含本地/远程？但根据你的设计，这里只展示对方视频，本地视频可能需要另外处理，暂不考虑） -->
        <div class="video-container">
          <video
            v-if="connected"
            ref="remoteVideoRef"
            autoplay
            playsinline
            class="remote-video"
          ></video>
          <div v-else class="no-video-placeholder">
            <span class="camera-icon">📹</span>
            <p>对方未接通</p>
          </div>
        </div>

        <!-- 底部控制栏（两行） -->
        <div class="controls">
          <!-- 第一行：麦克风、摄像头、扬声器 -->
          <div class="row first-row">
            <div class="control-item" @click="toggleMic">
              <div class="icon" :class="{ 'icon-off': !micEnabled }">
                <span v-if="micEnabled">🎤</span>
                <span v-else>🎤❌</span>
              </div>
              <span class="label">麦克风</span>
            </div>

            <div class="control-item" @click="toggleCamera">
              <div class="icon" :class="{ 'icon-off': !cameraEnabled }">
                <span v-if="cameraEnabled">📹</span>
                <span v-else>📹❌</span>
              </div>
              <span class="label">摄像头</span>
            </div>

            <div class="control-item" @click="toggleSpeaker">
              <div class="icon" :class="{ 'icon-off': !speakerEnabled }">
                <span v-if="speakerEnabled">🔊</span>
                <span v-else>🔇</span>
              </div>
              <span class="label">扬声器</span>
            </div>
          </div>

          <!-- 第二行：取消按钮（居中） -->
          <div class="row second-row">
            <div class="control-item cancel" @click="hangup">
              <div class="icon">📞❌</div>
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

const props = defineProps({
  visible: Boolean,
  remoteStream: MediaStream,
  connected: Boolean,
  micEnabled: { type: Boolean, default: true },
  cameraEnabled: { type: Boolean, default: true },
  speakerEnabled: { type: Boolean, default: true }
})

window.rm = props.remoteStream?.value

const emit = defineEmits([
  'update:visible',
  'toggleMic',
  'toggleCamera',
  'toggleSpeaker',
  'hangup'
])

const remoteVideoRef = ref(null)

// 将绑定逻辑提取为函数
const bindRemoteStream = () => {
  if (remoteVideoRef.value && props.remoteStream) {
    remoteVideoRef.value.srcObject = props.remoteStream;
    remoteVideoRef.value.play().catch(e => {
      console.warn('视频自动播放失败', e);
    });
    return true;
  }
  return false;
};

// 监听 remoteStream 变化
watch(() => props.remoteStream, (stream) => {
  console.log('remoteStream 新值', stream);
  if (!bindRemoteStream()) {
    console.log('视频元素尚未准备好，等待 connected');
  }
}, { immediate: true });

// 监听 connected 变化，一旦变为 true，立即尝试绑定
watch(() => props.connected, (connected) => {
  if (connected) {
    console.log('connected 变为 true，尝试绑定流');
    nextTick(() => bindRemoteStream());
  }
});

// 扬声器开关控制静音（视频元素也负责音频播放）
watch(() => props.speakerEnabled, (enabled) => {
  if (remoteVideoRef.value) {
    remoteVideoRef.value.muted = !enabled
  }
}, { immediate: true })

// 关闭弹框
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
/* 样式与之前相同，略 */
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
  width: 700px;
  height: 800px;
  background-color: #fff;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.video-container {
  flex: 1;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  position: relative;
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
}

.row {
  display: flex;
  justify-content: center;
  gap: 30px;
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

.second-row {
  margin-top: 0;
}
</style>