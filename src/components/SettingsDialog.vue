<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <!-- 弹窗内容 -->
      <div class="modal-content">
        <div class="modal-header">
          <h3>设置</h3>
          <button class="close-btn" @click="close">✕</button>
        </div>
        <div class="modal-body">
          <!-- 这里放置后续的更多设置项 -->
          <p>其他设置项可以放在这里</p>
        </div>
        <div class="modal-footer">
          <button class="logout-btn" @click="handleLogout">退出登录</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { closeSocket } from '@/utils/socket'
// import { authStore } from '@/stores/user'

// 控制弹窗显示隐藏
const visible = ref(false)
const open = () => (visible.value = true)
const close = () => (visible.value = false)

// 退出登录逻辑
const router = useRouter()
// const userStore = authStore()
const handleLogout = () => {
  // userStore.logout()
  router.push('/login')
  // 关闭 socket 连接
  closeSocket()
  close()
}

// 暴露 open 方法给父组件调用
defineExpose({ open })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}
.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}
.close-btn:hover {
  color: #333;
}
.modal-body {
  padding: 20px;
  min-height: 100px;
}
.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e5e5e5;
  text-align: right;
}
.logout-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
.logout-btn:hover {
  background-color: #d32f2f;
}
</style>