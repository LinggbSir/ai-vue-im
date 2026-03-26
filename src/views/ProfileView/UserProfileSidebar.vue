<template>
  <div class="profile-sidebar">
    <!-- 用户简略信息（可选） -->
    <div class="user-summary">
      <img :src="userInfo.avatar || defaultAvatar" class="avatar" />
      <div class="info">
        <div class="name">{{ userInfo.nick_name }}</div>
        <div class="echo-id">Echo号：{{ userInfo.echo_id }}</div>
      </div>
    </div>

    <!-- 统计数据 -->
    <div class="stats">
      <div class="stat-item">
        <span class="number">{{ friendCount }}</span>
        <span class="label">好友</span>
      </div>
      <div class="stat-item">
        <span class="number">{{ groupCount }}</span>
        <span class="label">群聊</span>
      </div>
      <div class="stat-item">
        <span class="number">{{ totalMessages }}</span>
        <span class="label">已发消息</span>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu">
      <div class="menu-item" @click="openDialog('photos')">
        <span class="icon"><Camera /></span>
        <span class="title">我的相册</span>
      </div>
      <div class="menu-item" @click="openDialog('files')">
        <span class="icon"><Files /></span>
        <span class="title">聊天文件</span>
      </div>
      <div class="menu-item" @click="openDialog('settings')">
        <span class="icon"><Settings /></span>
        <span class="title">通知设置</span>
      </div>
      <div class="menu-item" @click="openDialog('security')">
        <span class="icon"><Shield /></span>
        <span class="title">账号安全</span>
      </div>
    </div>
  </div>
  <PhotosDialog v-model:visible="dialogVisible.photos" />
  <FilesDialog v-model:visible="dialogVisible.files" />
  <SettingsDialog v-model:visible="dialogVisible.settings" />
  <SecurityDialog v-model:visible="dialogVisible.security" />
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useContactStore } from '@/stores/contact'
import request from '@/utils/request'
import { Camera, Files, Settings, Shield } from '@lucide/vue'
import PhotosDialog from './PhotosDialog.vue'
import FilesDialog from './FilesDialog.vue'
import SettingsDialog from './SettingsDialog.vue'
import SecurityDialog from './SecurityDialog.vue'

const dialogVisible = reactive({
  photos: false,
  files: false,
  settings: false,
  security: false
})

const openDialog = (type) => {
  dialogVisible[type] = true
}

const authStore = useAuthStore()
const contactStore = useContactStore()
const { userInfo } = storeToRefs(authStore)
const defaultAvatar = 'https://via.placeholder.com/40'

const friendCount = computed(() => contactStore.friendCount) // 可替换为真实数据
const groupCount = computed(() => 8)
const totalMessages = ref(null)

const fetchTotalMessages = async () => {
  try {
    const res = await request.get('/user/message-count');
    if (res.success) {
      totalMessages.value = res.data;
    }
  } catch (err) {
    console.error('获取消息数量失败', err);
  }
}

onMounted(() => {
  fetchTotalMessages()
})



</script>

<style scoped>
.profile-sidebar {
  padding: 20px;
  background-color: #fff;
  height: 100%;
  overflow-y: auto;
}

.user-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 16px;
}
.user-summary .avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}
.user-summary .info {
  flex: 1;
}
.user-summary .name {
  font-weight: 500;
  font-size: 16px;
  color: #333;
}
.user-summary .echo-id {
  font-size: 12px;
  color: #999;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
}
.stat-item {
  text-align: center;
}
.stat-item .number {
  display: block;
  font-size: 20px;
  font-weight: 500;
  color: #333;
}
.stat-item .label {
  font-size: 12px;
  color: #999;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.menu-item:hover {
  background-color: #f5f5f5;
}
.menu-item .icon {
  color: #333;
  font-size: 20px;
  width: 24px;
  text-align: center;
}
.menu-item .title {
  font-size: 14px;
  color: #333;
  padding-bottom: 6px !important;
}
</style>