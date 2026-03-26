<template>
  <div class="contact-list">
    <!-- 顶部区域（保持不变） -->
    <div class="header">
      <div class="mode-switch">
        <button :class="['mode-btn', { active: mode === 'friend' }]" @click="switchMode('friend')">好友</button>
        <button :class="['mode-btn', { active: mode === 'stranger' }]" @click="switchMode('stranger')">陌生人</button>
        <button :class="['mode-btn', { active: mode === 'request' }]" @click="switchMode('request')">
          申请<span v-if="requestCount > 0" class="badge">{{ requestCount }}</span>
        </button>
      </div>

      <div v-if="mode !== 'request'" class="search-wrapper">
        <input type="text" v-model="searchText" :placeholder="mode === 'friend' ? '搜索好友...' : '搜索陌生人...'" @focus="handleFocus" @blur="handleBlur" class="search-input" />
        <button v-if="mode === 'stranger'" class="search-btn" :disabled="searching" @click="handleSearchStranger"><Search /></button>
      </div>

      <button v-if="mode === 'stranger'" class="mode-btn" @click="switchToFriendMode">取消</button>
    </div>

    <div class="list">
      <!-- 好友模式 -->
      <template v-if="mode === 'friend'">
        <router-link
          v-for="friend in filteredFriends"
          :key="friend.id"
          :to="`/chat/contacts/profile/${friend.id}`"
          custom
          v-slot="{ navigate, isActive }"
        >
          <div class="contact-item" :class="{ active: isActive }" @click="navigate">
            <div class="avatar-wrapper">
              <img :src="friend.avatar || '/default_avatar.png'" class="avatar" :class="{ offline: !isOnline(friend.id) }" />
            </div>
            <div class="info">
              <div class="name-row">
                <span class="name">{{ friend.nick_name }}</span>
                <span class="status" :class="{ online: isOnline(friend.id) }">
                  <span v-if="isOnline(friend.id)" class="online-dot"></span>
                  {{ isOnline(friend.id) ? '在线' : '' }}
                </span>
              </div>
              <div class="signature">{{ friend.signature || '' }}</div>
            </div>
          </div>
        </router-link>
        <div v-if="filteredFriends.length === 0" class="empty-tip">{{ searchText && isFocus ? '无匹配好友' : '暂无好友' }}</div>
      </template>

      <!-- 陌生人模式（保持原样） -->
      <template v-else-if="mode === 'stranger'">
        <div v-for="stranger in strangerList" :key="stranger.id" class="contact-item">
          <img :src="stranger.avatar || '/default_avatar.png'" class="avatar" />
          <span class="username">{{ stranger.echo_id }}</span>
          <button class="add-btn" @click="addFriend(stranger.id)">添加</button>
        </div>
        <div v-if="strangerList.length === 0" class="empty-tip">{{ searching ? '搜索中...' : '输入关键词并点击搜索' }}</div>
      </template>

      <!-- 申请模式（保持原样） -->
      <template v-else-if="mode === 'request'">
        <div v-for="req in requestList" :key="req.id" class="contact-item">
          <img :src="req.avatar || '/default_avatar.png'" class="avatar" />
          <span class="username">{{ req.echo_id }}</span>
          <div class="actions">
            <button class="accept-btn" @click="acceptRequest(req.friend_id)">同意</button>
            <button class="reject-btn" @click="rejectRequest(req.friend_id)">拒绝</button>
          </div>
        </div>
        <div v-if="requestList.length === 0" class="empty-tip">暂无好友申请</div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import request from '@/utils/request'
import { useContactStore } from '@/stores/index'
const contactStore = useContactStore()

const { contactList, onlineStatus } = storeToRefs(contactStore)



// ---------- 状态 ----------
const mode = ref('friend')                // 'friend', 'stranger', 'request'
const searchText = ref('')
const isFocus = ref(false)                // 输入框是否聚焦
const searching = ref(false)              // 陌生人搜索中
const strangerList = ref([])              // 陌生人搜索结果
const requestList = ref([])               // 好友申请列表
const requestCount = computed(() => requestList.value.length)

// 过滤后的好友列表
const filteredFriends = computed(() => {
  if (!searchText.value) {
    // 聚焦时显示空，否则显示全部好友
    return isFocus.value ? [] : contactList.value
  }
  return contactList.value.filter(f => f.nick_name.includes(searchText.value))
})

const isOnline = (userId) => {
  return onlineStatus.value[userId] || false
}


// ---------- 方法 ----------
const handleFocus = () => {
  isFocus.value = true
}

const handleBlur = () => {
  isFocus.value = false
}

const switchMode = (newMode) => {
  mode.value = newMode
  searchText.value = ''
  if (newMode === 'request') {
    fetchRequests()
  } else if (newMode === 'stranger') {
    strangerList.value = []
  }
}

const switchToStrangerMode = () => {
  mode.value = 'stranger'
  searchText.value = ''
  strangerList.value = []
}

const switchToFriendMode = () => {
  mode.value = 'friend'
  searchText.value = ''
  strangerList.value = []
}

// 搜索陌生人
const handleSearchStranger = async () => {
  if (!searchText.value || searching.value) return
  searching.value = true
  try {
    const data = await request.get('/users/search', { params: { keyword: searchText.value } })
    if (data.users) {
      strangerList.value = data.users
    } else {
      // 处理业务错误（例如用户名不存在等）
      console.error('搜索失败', data.error || '未知错误')
      // 可给用户提示
    }
  } catch (error) {
    // 网络错误或服务器返回 5xx 等异常
    console.error('网络错误或服务器异常', error)
    // 可给用户提示
  } finally {
    searching.value = false
  }
}

// 添加好友请求
const addFriend = async (userId) => {
  const res = await request.post('/users/contacts/add', { friendId: userId })
  if (res.success) {
    ElMessage.success('好友申请发送成功')
    // 刷新好友列表（需全局状态管理）
  } else {
    ElMessage.error(res.error || '好友申请发送失败')
  }
}

// 获取好友申请列表
const fetchRequests = async () => {
  const res = await request.get('/users/contacts/requests')
  if (res.success) {
    requestList.value = res.friendRequests || []
  } else {
    ElMessage.error(res.error || '获取好友申请列表失败')
  }
}

// 同意申请
const acceptRequest = async (friendId) => {
  const res = await request.post('/users/contacts/accept', { friendId })
  console.log(res) 
  if (res.success) {
    ElMessage.success('好友申请已同意')
    // 刷新好友列表（需全局状态管理）
  } else {
    ElMessage.error(res.error || '好友申请同意失败')
  }
}

// 拒绝申请
const rejectRequest = async (friendId) => {
  const res = await request.post('/users/contacts/reject', { friendId })
  console.log(res)
  if (res.success) {
    ElMessage.success('好友申请已拒绝')
    // 刷新好友列表（需全局状态管理）
  } else {
    ElMessage.error(res.error || '好友申请拒绝失败')
  }
}
</script>

<style scoped>
.contact-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-right: 1px solid #e5e5e5;
}

.header {
  padding: 12px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.mode-switch {
  display: flex;
  gap: 4px;
}

.mode-btn {
  padding: 6px 12px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  position: relative;
}

.mode-btn.active {
  background-color: #07c160;
  color: white;
  border-color: #07c160;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #f44336;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 10px;
}

.search-wrapper {
  flex: 1;
  display: flex;
  gap: 4px;
  min-width: 150px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #07c160;
}

.search-btn {
  padding: 0 12px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: opacity 0.2s;
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.2s;
  cursor: pointer;
}

.contact-item:hover {
  background-color: #f9f9f9;
}

.contact-item.active {
  background-color: #e9f7e9;
  border-left: 3px solid #07c160;
}

.avatar-wrapper {
  margin-right: 12px;
  flex-shrink: 0;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar.offline {
  opacity: 0.6;
}

.info {
  flex: 1;
  min-width: 0; /* 防止溢出 */
}

.name-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}

.name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  word-break: break-word;
}

.status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.status.online {
  color: #07c160;
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #07c160;
  display: inline-block;
}

.signature {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 其他样式保持不变（陌生人、申请模式、按钮等） */
.add-btn {
  padding: 4px 10px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 8px;
}

.accept-btn {
  padding: 4px 8px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.reject-btn {
  padding: 4px 8px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 20px;
  font-size: 14px;
}
</style>