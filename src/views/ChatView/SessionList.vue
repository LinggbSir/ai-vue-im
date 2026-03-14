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
        <div class="session-item" v-for="session in sessionList" :key="session.id" @click="selectSession(session)">
          <img :src="session.avatar" alt="avatar" />
          <div class="info">
            <div class="name">{{ session.target_name }}</div>
            <div class="last-msg">{{ session.last_msg_time }}</div>
          </div>
        </div>
      </div>
    </router-link>
  </div>
  <div class="session-list">
    <div v-if="loading">加载中...</div>
    <div v-else-if="sessionList.length === 0">暂无会话</div>
    <div v-else>
      <router-link
        v-for="session in sessionList"
        :key="session.id"
        :to="`/chat/session/chatArea/${session.target_id}`"
        custom
        v-slot="{ navigate, href, isActive }"
      >
        <div class="list-content" :class="{ active: isActive }" @click="navigate">
          <div class="session-item" v-for="session in sessionList" :key="session.id" @click="selectSession(session)">
            <img :src="session.avatar" alt="avatar" />
            <div class="info">
              <div class="name">{{ session.target_name }}</div>
              <div class="last-msg">{{ session.last_msg_time }}</div>
            </div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted,computed, watch } from 'vue'
import request from '@/utils/request'
import {useRoute, useRouter} from 'vue-router'
import { storeToRefs } from 'pinia'    

const router = useRouter()
const route = useRoute()
import { useUserStore, useSessionStore } from '@/stores/index'
const userStore = useUserStore()
const sessionStore = useSessionStore()

const { sessionList, loading } = storeToRefs(sessionStore)
onMounted(async () => {
  await sessionStore.getSessions()
})

const selectedSessionId = ref('')
const targetSessionId = computed(() => {
  const myId = userStore.myId
  const targetId = route.params.targetId
  if (!targetId) return null
  return [myId, targetId].sort().join('_')
})
watch(targetSessionId, (newSessionId) => {
  selectedSessionId.value = newSessionId
}, { immediate: true })

const selectSession = (session) => {
  // 假设 session 中包含对方用户ID（私聊）或群组ID（群聊）
  const friendId = session.targetId
  router.push(`/chat/session/${friendId}`)
}

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