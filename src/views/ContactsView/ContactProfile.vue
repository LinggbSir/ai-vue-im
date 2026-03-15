<template>
  <div class="contact-profile">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="user" class="profile-content">
      <img :src="user.avatar || 'https://via.placeholder.com/100'" class="avatar" />
      <h2>{{ user.echo_id }}</h2>
      <p class="signature">{{ user.signature || '暂无个性签名' }}</p>
      <p class="email">{{ user.email || '暂无邮箱' }}</p>
      <button v-if="user.isFriend" class="chat-btn" @click="goToChat">发消息</button>
      <button v-else class="add-btn" @click="addFriend">添加好友</button>
    </div>
    <div v-else class="empty-tip">
      选择一个联系人查看详情
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userId = ref(null)
const user = ref(null)
const loading = ref(false)

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
  // 跳转到聊天界面，需要创建或获取会话 ID
  // 这里可以跳转到 /chat/session?userId=xxx 或直接跳转到聊天页
  router.push(`/chat/session?friendId=${userId.value}`)
}

const addFriend = () => {
  // 发送好友申请
  // 可以调用之前写的发送申请接口
}

watch(() => route.params.id, (newId) => {
  userId.value = newId
  fetchUserInfo(newId)
}, { immediate: true })
</script>

<style scoped>
.contact-profile {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
}
.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 16px;
}
.loading, .empty-tip {
  text-align: center;
  color: #999;
  padding: 40px;
}
.profile-content {
  width: 100%;
  text-align: center;
}
.signature, .email {
  color: #666;
  margin: 8px 0;
}
button {
  margin-top: 20px;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}
.chat-btn {
  background-color: #07c160;
  color: white;
}
.add-btn {
  background-color: #f5f5f5;
  color: #333;
}
</style>