<template>
  <div class="contact-list">
    <!-- 顶部区域 -->
    <div class="header">
      <!-- 模式切换按钮组 -->
      <div class="mode-switch">
        <button
          :class="['mode-btn', { active: mode === 'friend' }]"
          @click="switchMode('friend')"
        >
          好友
        </button>
        <button
          :class="['mode-btn', { active: mode === 'stranger' }]"
          @click="switchMode('stranger')"
        >
          陌生人
        </button>
        <button
          :class="['mode-btn', { active: mode === 'request' }]"
          @click="switchMode('request')"
        >
          申请
          <span v-if="requestCount > 0" class="badge">{{ requestCount }}</span>
        </button>
      </div>

      <!-- 搜索栏（仅在好友/陌生人模式显示） -->
      <div v-if="mode !== 'request'" class="search-wrapper">
        <input
          type="text"
          v-model="searchText"
          :placeholder="mode === 'friend' ? '搜索好友...' : '搜索陌生人...'"
          @focus="handleFocus"
          @blur="handleBlur"
          class="search-input"
        />
        <!-- 陌生人模式下的搜索按钮 -->
        <button
          v-if="mode === 'stranger'"
          class="search-btn"
          :disabled="searching"
          @click="handleSearchStranger"
        >
          🔍
        </button>
      </div>

      <!-- 陌生人模式下的“取消”按钮（切换回好友模式） -->
      <button
        v-if="mode === 'stranger'"
        class="mode-btn"
        @click="switchToFriendMode"
      >
        取消
      </button>
    </div>

    <!-- 列表区域 -->
    <div class="list">
      <!-- 好友模式 -->
      <template v-if="mode === 'friend'">
        <router-link
          v-for="friend in filteredFriends"
          :key="friend.id"
          :to="`/chat/contacts/profile/${friend.id}`"
          custom
          v-slot="{ navigate, href, isActive }"
        >
          <div
            class="contact-item"
            :class="{ active: isActive }"
            @click="navigate"
          >
            <img :src="friend.avatar || 'https://via.placeholder.com/40'" class="avatar" />
            <span class="username">{{ friend.name }}</span>
          </div>
        </router-link>
        <div v-if="filteredFriends.length === 0" class="empty-tip">
          {{ searchText && isFocus ? '无匹配好友' : '暂无好友' }}
        </div>
      </template>

      <!-- 陌生人模式 -->
      <template v-else-if="mode === 'stranger'">
        <div
          v-for="stranger in strangerList"
          :key="stranger.id"
          class="contact-item"
        >
          <img
            :src="stranger.avatar || 'https://via.placeholder.com/40'"
            class="avatar"
          />
          <span class="username">{{ stranger.username }}</span>
          <button class="add-btn" @click="addFriend(stranger.id)">添加</button>
        </div>
        <div v-if="strangerList.length === 0" class="empty-tip">
          {{ searching ? '搜索中...' : '输入关键词并点击搜索' }}
        </div>
      </template>

      <!-- 申请模式 -->
      <template v-else-if="mode === 'request'">
        <div
          v-for="req in requestList"
          :key="req.id"
          class="contact-item"
        >
          <img
            :src="req.avatar || 'https://via.placeholder.com/40'"
            class="avatar"
          />
          <span class="username">{{ req.username }}</span>
          <div class="actions">
            <button class="accept-btn" @click="acceptRequest(req.id)">同意</button>
            <button class="reject-btn" @click="rejectRequest(req.id)">拒绝</button>
          </div>
        </div>
        <div v-if="requestList.length === 0" class="empty-tip">
          暂无好友申请
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'

// ---------- 状态 ----------
const mode = ref('friend')                // 'friend', 'stranger', 'request'
const searchText = ref('')
const isFocus = ref(false)                // 输入框是否聚焦
const searching = ref(false)              // 陌生人搜索中
const strangerList = ref([])              // 陌生人搜索结果
const requestList = ref([])               // 好友申请列表
const friendList = ref([])                // 好友列表
const requestCount = computed(() => requestList.value.length)

// 过滤后的好友列表
const filteredFriends = computed(() => {
  // if (!searchText.value) {
  //   // 聚焦时显示空，否则显示全部好友
  //   return isFocus.value ? [] : friendList.value
  // }
  // return friendList.value.filter(f => f.name.includes(searchText.value))
  console.log(friendList.value.length)
  return friendList.value
})

onMounted(() => {
  fetchFriends()
})

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
  const res = await request.post('/users/friends/add', { friendId: userId })
  if (res.success) {
    ElMessage.success('好友申请发送成功')
    // 刷新好友列表（需全局状态管理）
  } else {
    ElMessage.error(res.error || '好友申请发送失败')
  }
}

// 获取好友列表
const fetchFriends = async () => {
  const res = await request.get('/users/friends')
  if (res.success) {
    friendList.value = res.friendList
  } else {
    ElMessage.error(res.error || '获取好友列表失败')
  }
}

// 获取好友申请列表
const fetchRequests = async () => {
  const res = await request.get('/users/friends/requests')
  if (res.success) {
    requestList.value = res.friendRequests || []
  } else {
    ElMessage.error(res.error || '获取好友申请列表失败')
  }
}

// 同意申请
const acceptRequest = async (requestId) => {
  const res = await request.post('/users/friends/accept', { requestId })
  console.log(res) 
  if (res.success) {
    ElMessage.success('好友申请已同意')
    // 刷新好友列表（需全局状态管理）
  } else {
    ElMessage.error(res.error || '好友申请同意失败')
  }
}

// 拒绝申请
const rejectRequest = async (requestId) => {
  const res = await request.post('/users/friends/reject', { requestId })
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
  flex-wrap: wrap; /* 防止空间不足换行 */
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
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.2s;
}

.contact-item:hover {
  background-color: #f9f9f9;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
}

.username {
  flex: 1;
  font-size: 14px;
  color: #333;
}

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

.contact-item.active {
  background-color: #e6f7ff;
  border-left: 3px solid #07c160;
}
</style>