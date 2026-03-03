<template>
  <div class="session-list">
    <div class="list-header">
      <h3>会话列表</h3>
    </div>
    <router-link
      v-for="session in sessionList"
      :key="session.id"
      :to="`/chat/session/chatArea/${session.target_id}`"
      custom
      v-slot="{ navigate, href, isActive }"
    >
      <div class="list-content" :class="{ active: isActive }" @click="navigate">
        <div class="session-item" v-for="session in sessionList" :key="session.id">
          <img :src="session.avatar" alt="avatar" />
          <div class="info">
            <div class="name">{{ session.username }}</div>
            <div class="last-msg">{{ session.last_msg_time }}</div>
          </div>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

import request from '@/utils/request'

const sessionList = ref([])

onMounted(async () => {
  const res = await request.get('/sessions')
  if (res.success) {
    sessionList.value = res.sessions || []
  } else {
    ElMessage.error(res.error || '获取会话列表失败')
  }
})

</script>

<style scoped>
.session-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.list-header {
  padding: 16px;
  border-bottom: 1px solid #e5e5e5;
}
.list-content {
  flex: 1;
  overflow-y: auto;
}
.session-item {
  display: flex;
  padding: 12px 16px;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.session-item:hover {
  background-color: #f0f0f0;
}
.session-item img {
  border-radius: 50%;
}
.info {
  flex: 1;
}
.name {
  font-weight: 500;
}
.last-msg {
  font-size: 12px;
  color: #999;
}
</style>