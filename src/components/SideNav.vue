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
    <div class="settings-btn" @click="openSettings">
      <Settings />
    </div>
  </div>
</template>

<script setup>
// 引入弹窗实例（通过父组件传递或者使用事件总线，这里使用最简单的：通过父组件引用）
// 我们将在 MainLayout 中管理弹窗，并通过 props 或 provide/inject 传递引用。
// 简单起见，我们使用事件总线（mitt）或 provide/inject。这里选用 provide/inject 方案。
import { inject } from 'vue'
import { MessageCircle, Users, User, Settings } from '@lucide/vue'
const settingsDialog = inject('settingsDialog')
const openSettings = () => {
  settingsDialog?.open()
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