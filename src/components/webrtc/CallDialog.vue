<template>
  <Teleport to="body">
    <div v-if="visible" class="call-dialog-overlay" @click.self="close">
      <div class="call-dialog">
        <!-- 关闭按钮（可选） -->
        <button class="close-btn" @click="close">✕</button>

        <!-- 头像区域 -->
        <div class="avatar-container">
          <img :src="avatar" alt="avatar" class="avatar" />
        </div>

        <!-- 昵称 -->
        <h2 class="nickname">{{ nickname }}</h2>

        <!-- 状态提示 -->
        <p v-if="!connected" class="status">等待对方接受邀请...</p>

        <!-- 底部控制栏 -->
        <div class="controls">
          <!-- 麦克风开关 -->
          <div class="control-item" @click="toggleMic">
            <div class="icon" :class="{ 'icon-off': !micEnabled }">
              <span v-if="micEnabled">🎤</span>
              <span v-else>🎤❌</span>
            </div>
            <span class="label">麦克风</span>
          </div>

          <!-- 取消按钮 -->
          <div class="control-item cancel" @click="cancel">
            <div class="icon">📞❌</div>
            <span class="label">取消</span>
          </div>

          <!-- 扬声器开关 -->
          <div class="control-item" @click="toggleSpeaker">
            <div class="icon" :class="{ 'icon-off': !speakerEnabled }">
              <span v-if="speakerEnabled">🔊</span>
              <span v-else>🔇</span>
            </div>
            <span class="label">扬声器</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  // 控制弹框显示
  visible: {
    type: Boolean,
    default: false
  },
  // 对方头像 URL
  avatar: {
    type: String,
    default: ''
  },
  // 对方昵称
  nickname: {
    type: String,
    default: ''
  },
  // 通话是否已连接（接通）
  connected: {
    type: Boolean,
    default: false
  },
  // 麦克风开关状态（由父组件控制）
  micEnabled: {
    type: Boolean,
    default: true
  },
  // 扬声器开关状态（由父组件控制）
  speakerEnabled: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'update:visible',
  'toggle-mic',
  'toggle-speaker',
  'cancel'
])

// 关闭弹框（通知父组件）
const close = () => {
  emit('update:visible', false)
}

// 切换麦克风
const toggleMic = () => {
  emit('toggle-mic', !props.micEnabled)
}

// 切换扬声器
const toggleSpeaker = () => {
  emit('toggle-speaker', !props.speakerEnabled)
}

// 取消通话
const cancel = () => {
  emit('cancel')
  close()
}
</script>

<style scoped>
/* 样式保持不变 */
.call-dialog-overlay {
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

.call-dialog {
  position: relative;
  width: 450px;
  height: 800px;
  background-color: #fff;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px 30px;
  box-sizing: border-box;
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
}

.status {
  margin-top: 12px;
  font-size: 16px;
  color: #999;
}

.controls {
  margin-top: auto;
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px 0;
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