<template>
  <Teleport to="body">
    <div v-if="visible" class="incoming-overlay" @click.self="reject">
      <div class="incoming-dialog">
        <div class="caller-info">
          <img :src="callerAvatar" alt="avatar" class="avatar" />
          <span class="caller-name">{{ callerName }}</span>
          <span class="call-type">邀请你语音通话</span>
        </div>
        <div class="actions">
          <button class="btn reject" @click="reject">挂断</button>
          <button class="btn accept" @click="accept">接通</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
  callerName: String,
  callerAvatar: String,
  callerId: [String, Number], // 用于识别对方
})

const emit = defineEmits(['accept', 'reject'])

const accept = () => {
  emit('accept')
}

const reject = () => {
  emit('reject')
}
</script>

<style scoped>
.incoming-overlay {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.incoming-dialog {
  position: fixed;
  left: 20px;
  bottom: 20px;
  width: 250px;
  height: 100px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  box-sizing: border-box;
  pointer-events: auto;
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.caller-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.caller-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.call-type {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 6px 0;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn.reject {
  background-color: #f44336;
  color: white;
}

.btn.reject:hover {
  background-color: #d32f2f;
}

.btn.accept {
  background-color: #07c160;
  color: white;
}

.btn.accept:hover {
  background-color: #06b156;
}
</style>