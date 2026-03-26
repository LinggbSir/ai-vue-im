<template>
  <div class="session-list">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="sessionList.length === 0" class="empty">暂无会话</div>
    <div v-else class="list-content">
      <router-link
        v-for="session in sessionList"
        :key="session.id"
        :to="`/chat/session/chatArea/${session.target_id}`"
        custom
        v-slot="{ navigate, isActive }"
      >
        <div
          class="session-item"
          :class="{ active: isActive }"
          @click="navigate"
        >
          <img
            :src="session.target_avatar || '/default_avatar.png'"
            alt="avatar"
            class="avatar"
            :class="{ 'avatar-offline': session.type === 0 && !isOnline(session.target_id) }"
          />
          <div class="info">
            <div class="info-header">
              <div class="name-wrapper">
                <span class="name">{{ session.target_name }}</span>
                <span v-if="session.type === 0" class="online-status" :class="{ online: isOnline(session.target_id) }">
                  <span v-if="isOnline(session.target_id)" class="online-dot"></span>
                  {{ isOnline(session.target_id) ? '在线' : '' }}
                </span>
              </div>
              <span class="time">{{ formatTime(session.last_msg_time) }}</span>
            </div>
            <div class="last-msg-wrapper">
              <span class="last-msg">{{ session.last_msg_content || '暂无消息' }}</span>
              <span v-if="session.unread_count" class="unread-badge">{{ session.unread_count }}</span>
            </div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import { useAuthStore, useSessionStore, useContactStore } from '@/stores/index'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const sessionStore = useSessionStore()
const contactStore = useContactStore()

const { userInfo } = storeToRefs(authStore)
const { sessionList, loading } = storeToRefs(sessionStore)
const { onlineStatus } = storeToRefs(contactStore)

// 对方是否在线（仅对私聊有效）
const isOnline = (targetId) => onlineStatus.value[targetId] === true

const selectedSessionId = ref('')
const targetSessionId = computed(() => {
  const userId = userInfo.value.id
  const targetId = route.params.targetId
  if (!targetId) return null
  return [userId, targetId].sort().join('_')
})
watch(targetSessionId, (newSessionId) => {
  selectedSessionId.value = newSessionId
}, { immediate: true })

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = dayjs(timestamp)
  const now = dayjs()
  if (date.isSame(now, 'day')) {
    return date.format('HH:mm')
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天'
  } else if (date.isSame(now, 'year')) {
    return date.format('M/D')
  } else {
    return date.format('YYYY/M/D')
  }
}
</script>

<style scoped>
.session-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  backdrop-filter: blur(2px);
}

.session-item {
  display: flex;
  padding: 12px 16px;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid transparent;
  background-color: transparent;
}

.session-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.session-item.active {
  background-color: #e9f7e9;
  border-left: 3px solid #07c160;
}

.session-item .avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: opacity 0.2s;
}

.avatar-offline {
  opacity: 0.6;
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.name-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.name {
  font-weight: 600;
  font-size: 15px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
}

.online-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}
.online-status.online {
  color: #07c160;
}
.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #07c160;
  display: inline-block;
}

.time {
  font-size: 11px;
  color: #999;
  flex-shrink: 0;
  margin-left: 8px;
}

.last-msg-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.last-msg {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
}

.unread-badge {
  background-color: #fa5151;
  color: white;
  font-size: 10px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  font-weight: 500;
  flex-shrink: 0;
}

@media (prefers-color-scheme: dark) {
  .session-list {
    background-color: #2a2a2a;
  }
  .name {
    color: #e5e5e5;
  }
  .last-msg {
    color: #aaa;
  }
  .time {
    color: #888;
  }
  .session-item.active {
    background-color: #1a3a1a;
    border-left-color: #07c160;
  }
}
</style>