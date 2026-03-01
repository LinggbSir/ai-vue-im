<template>
  <div class="session-list">
    <div class="list-header">
      <h3>会话列表</h3>
    </div>
    <div class="list-content">
      <div class="session-item" v-for="i in 5" :key="i">
        <img src="https://via.placeholder.com/40" alt="avatar" />
        <div class="info">
          <div class="name">用户{{ i }}</div>
          <div class="last-msg">最后一条消息...</div>
        </div>
      </div>
    </div>
  </div>
</template>

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