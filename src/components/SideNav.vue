<template>
  <div class="side-nav">
    <div class="nav-buttons">
      <router-link to="/chat/session" class="nav-item" active-class="active">
        <MessageCircle />
      </router-link>
      <router-link to="/chat/contacts" class="nav-item" active-class="active">
        <Users />
      </router-link>
      <router-link to="/chat/profile" class="nav-item" active-class="active">
        <User />
      </router-link>
    </div>
    <!-- 新增的设置按钮，放在导航按钮下方，通过 margin-top: auto 推到底部 -->
    <div class="settings-btn" @click="logout">
      <LogOut />
    </div>
  </div>
</template>

<script setup>
import { MessageCircle, Users, User, LogOut } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { closeSocket } from '@/utils/socket'
import { useAuthStore, useContactStore, useMessageStore, useWebRTCStore, useSessionStore} from '@/stores'

const router = useRouter()
const authStore = useAuthStore()
const contactStore = useContactStore()
const messageStore = useMessageStore()
const webRTCStore = useWebRTCStore()
const sessionStore = useSessionStore()
const logout = () => {
  router.push('/login')
  // 关闭 socket 连接
  closeSocket()
  // 清空所有状态
  authStore.logOut()
  contactStore.clearContactList()
  messageStore.clearSessionMessages()
  webRTCStore.clearWebRTCState()
  sessionStore.clearSessionList()
}
</script>

<style scoped>
.side-nav {
  width: 80px;
  background-color: #2c2c2c;
  color: white;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}
.nav-buttons {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}
.nav-item {
  color: #aaa;
  text-decoration: none;
  padding: 10px 0;
  text-align: center;
  transition: all 0.3s;
}
.nav-item:hover {
  color: white;
  background-color: #3c3c3c;
}
.nav-item.active {
  color: #07c160;
  border-left: 3px solid #07c160;
  background: linear-gradient(90deg, rgba(7,193,96,0.1) 0%, rgba(7,193,96,0) 100%);
}
.settings-btn {
  margin-top: auto; /* 推到底部 */
  width: 100%;
  padding: 10px 0;
  text-align: center;
  color: #aaa;
  cursor: pointer;
  transition: all 0.3s;
}
.settings-btn:hover {
  color: white;
  background-color: #3c3c3c;
}
</style>