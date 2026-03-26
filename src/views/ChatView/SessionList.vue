<template>
  <div class="session-list">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="sessionList.length === 0" class="empty">暂无会话</div>
    <div v-else class="list-content">
      <!-- 使用 router-link 包裹每个会话项，实现导航和高亮 -->
      <router-link
        v-for="session in sessionList"
        :key="session.id"
        :to="`/chat/session/chatArea/${session.target_id}`"
        custom
        v-slot="{ navigate, href, isActive }"
      >
        <div
          class="session-item"
          :class="{ active: isActive }"
          @click="navigate"
        >
          <img :src="session.target_avatar || '/default_avatar.png'" alt="avatar" class="avatar" />
          <div class="info">
            <div class="info-header">
              <span class="name">{{ session.target_name }}</span>
              <span class="time">{{ formatTime(session.last_msg_time) }}</span>
            </div>
            <div class="last-msg-wrapper">
              <span class="last-msg">{{ session.last_msg_content || '暂无消息' }}</span>
              <!-- 如果有未读消息，显示绿色角标（可选） -->
              <span v-if="session.unread_count" class="unread-badge">{{ session.unread_count }}</span>
            </div>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref,computed, watch } from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { storeToRefs } from 'pinia'    
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
import { useAuthStore, useSessionStore } from '@/stores/index'
const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)
const sessionStore = useSessionStore()

const { sessionList, loading } = storeToRefs(sessionStore)

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

// 时间格式化函数
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = dayjs(timestamp)
  const now = dayjs()
  if (date.isSame(now, 'day')) {
    return date.format('HH:mm')  // 今天显示 时:分
  } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天'
  } else if (date.isSame(now, 'year')) {
    return date.format('M/D')  // 今年显示 月/日
  } else {
    return date.format('YYYY/M/D')  // 跨年显示 年/月/日
  }
}

</script>

<style scoped>
.session-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;  /* 列表背景变灰 */
}

.list-content {
  flex: 1;
  overflow-y: auto;
  backdrop-filter: blur(2px);  /* 轻微毛玻璃效果 */
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

/* 选中状态 - 微信绿高亮 */
.session-item.active {
  background-color: #e9f7e9;  /* 浅绿色背景 */
  border-left: 3px solid #07c160;  /* 左侧绿色边框 */
}

.session-item .avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.info {
  flex: 1;
  min-width: 0;  /* 防止内容溢出 */
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

.name {
  font-weight: 600;  /* 加粗 */
  font-size: 15px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}

.time {
  font-size: 11px;
  color: #999;
  flex-shrink: 0;
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

/* 未读小红点 */
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

/* 深色模式适配 */
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