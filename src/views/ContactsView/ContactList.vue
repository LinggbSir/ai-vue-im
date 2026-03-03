<template>
  <div class="contact-list">
    <!-- 顶部搜索栏 -->
    <div class="header">
      <div class="search-wrapper">
        <input
          type="text"
          v-model="searchText"
          placeholder="搜索..."
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
      <!-- 模式切换按钮 -->
      <button
        v-if="mode === 'friend'"
        class="mode-btn primary"
        @click="switchToStrangerMode"
      >
        添加好友
      </button>
      <button
        v-else
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
        <div
          v-for="friend in filteredFriends"
          :key="friend.id"
          class="contact-item"
        >
          <span>{{ friend.name }}</span>
        </div>
        <div v-if="filteredFriends.length === 0" class="empty-tip">
          {{ searchText && !isFocus ? '无匹配好友' : '暂无好友' }}
        </div>
      </template>

      <!-- 陌生人模式 -->
      <template v-else>
        <div
          v-for="stranger in strangerList"
          :key="stranger.id"
          class="contact-item"
        >
          <span>{{ stranger.name }}</span>
          <button class="add-btn" @click="addFriend(stranger.id)">添加</button>
        </div>
        <div v-if="strangerList.length === 0" class="empty-tip">
          {{ searching ? '搜索中...' : '输入关键词并点击搜索' }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// ---------- 模拟数据 ----------
const mockFriends = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' },
  { id: 4, name: '赵六' },
  { id: 5, name: '田七' },
]

// ---------- 状态 ----------
const mode = ref('friend')           // 'friend' 或 'stranger'
const searchText = ref('')
const isFocus = ref(false)           // 输入框是否聚焦
const searching = ref(false)         // 陌生人搜索中
const strangerList = ref([])         // 陌生人搜索结果

// 过滤后的好友列表
const filteredFriends = computed(() => {
  // 聚焦且搜索词为空 → 空列表
  if (isFocus.value && !searchText.value) return []
  // 无搜索词 → 显示全部好友
  if (!searchText.value) return mockFriends
  // 有搜索词 → 按名称过滤
  return mockFriends.filter(f => f.name.includes(searchText.value))
})

// ---------- 方法 ----------
const handleFocus = () => {
  isFocus.value = true
}

const handleBlur = () => {
  isFocus.value = false
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

// ContactList.vue
const handleSearchStranger = async () => {
  if (!searchText.value || searching.value) return;
  searching.value = true;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/users/search?keyword=${encodeURIComponent(searchText.value)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (res.ok) {
      strangerList.value = data.users || [];
    } else {
      console.error('搜索失败', data.error);
      // 可以添加错误提示，例如 alert 或弹窗
    }
  } catch (error) {
    console.error('网络错误', error);
  } finally {
    searching.value = false;
  }
};

const addFriend = (userId) => {
  alert(`添加好友请求已发送，用户ID：${userId}`)
  // 实际应调用添加好友接口，成功后切换回好友模式并刷新列表
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
}

.search-wrapper {
  flex: 1;
  display: flex;
  gap: 4px;
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

.mode-btn {
  padding: 8px 12px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.mode-btn.primary {
  background-color: #07c160;
  color: white;
  border: none;
}

.list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.contact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.2s;
}

.contact-item:hover {
  background-color: #f9f9f9;
}

.add-btn {
  padding: 4px 10px;
  background-color: #07c160;
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