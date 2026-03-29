<template>
  <div class="contact-profile">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="user" class="profile-content">
      <!-- 头像区域 -->
      <div class="avatar-wrapper">
        <img :src="user.avatar || defaultAvatar" class="avatar" />
      </div>
      
      <!-- 昵称和微信号 -->
      <div class="name-section">
        <h2 class="nickname">{{ user.nick_name }}</h2>
        <p class="echo_id">Echo号：{{ user.echo_id }}</p>
      </div>

      <!-- 个人信息列表 -->
      <div class="info-list">
        <div class="info-item">
          <span class="label">地区</span>
          <span class="value">{{ user.region }}</span>
        </div>
        <div class="info-item">
          <span class="label">备注</span>
          <span class="value remark" @click="editRemark">
            {{ user.remark || '点击添加备注' }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">个性签名</span>
          <span class="value">{{ user.signature }}</span>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="action-buttons">
        <button class="action-btn" @click="goToChat">
          <MessageCircle />
        </button>
        <button v-if="onlineStatus[user.id]" class="action-btn" title="语音通话" @click="startAudioCall">
          <Phone />
        </button>
        <button v-else :disabled title="语音通话, 该用户当前不在线" class="action-btn-disabled">
          <PhoneOff />
        </button>
        <button v-if="onlineStatus[user.id]" class="action-btn" title="视频通话" @click="startVideoCall">
          <Video />
        </button>
        <button v-else :disabled title="视频通话, 该用户当前不在线" class="action-btn-disabled">
          <VideoOff />
        </button>
      </div>
    </div>
    <div v-else class="empty-tip">
      选择一个联系人查看详情
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { useWebRTCStore } from '@/stores/webrtc'
import { useContactStore } from '@/stores/contact'
import { MessageCircle, Phone, Video, PhoneOff, VideoOff } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const userId = ref(null)
const user = ref(null)
const loading = ref(false)
const defaultAvatar = 'https://via.placeholder.com/100'

const callStore = useWebRTCStore()
const contactStore = useContactStore()
const { onlineStatus } = contactStore

const fetchUserInfo = async (id) => {
  if (!id) {
    user.value = null
    return
  }
  loading.value = true
  try {
    const res = await request.get(`/users/${id}`)
    if (res.success) {
      user.value = res.data
    } else {
      ElMessage.error(res.error || '获取用户信息失败')
    }
  } catch (err) {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

const goToChat = () => {
  router.push(`/chat/session/chatArea/${userId.value}`)
}

const startAudioCall = () => {
  callStore.startCall('audio', userId.value)
}

const startVideoCall = () => {
  callStore.startCall('video', userId.value)
}


const editRemark = () => {
  // TODO: 弹出输入框修改备注
  ElMessage.info('修改备注功能待实现')
}

watch(() => route.params.id, (newId) => {
  userId.value = newId
  fetchUserInfo(newId)
}, { immediate: true })
</script>

<style scoped>
.contact-profile {
  height: 100%;
  background-color: #fff;
  overflow-y: auto;
  padding: 20px 0 30px;
}

.loading, .empty-tip {
  text-align: center;
  color: #999;
  padding: 40px;
}

.profile-content {
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrapper {
  margin-top: 30px;
  margin-bottom: 20px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

.name-section {
  text-align: center;
  margin-bottom: 20px;
}

.nickname {
  font-size: 24px;
  font-weight: 500;
  color: #333;
  margin: 0 0 8px;
}

.echo_id {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.info-list {
  width: 100%;
  background-color: #fff;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  margin: 16px 0;
}

.info-item {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;
}
.info-item:last-child {
  border-bottom: none;
}

.label {
  width: 80px;
  color: #8e8e93;
  flex-shrink: 0;
}

.value {
  flex: 1;
  color: #333;
  word-break: break-word;
}

.value.remark {
  color: #07c160;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
  justify-content: center;
}

.action-btn, .action-btn-disabled {
  padding: 8px 20px;
  background-color: #f5f5f5;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #333;
}

.action-btn:hover {
  background-color: #e5e5e5;
}

.action-btn.add-btn {
  background-color: #07c160;
  color: white;
}

.action-btn.add-btn:hover {
  background-color: #06b156;
}
</style>