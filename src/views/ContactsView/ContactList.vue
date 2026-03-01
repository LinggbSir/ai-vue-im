<template>
  <div class="contact-list">
    <div class="list-header">
      <h3>联系人</h3>
    </div>
    <div class="list-content">
      <div class="contact-item" v-for="i in 5" :key="i">
        <img src="https://via.placeholder.com/40" alt="avatar" />
        <div class="info">
          <div class="name">好友{{ i }}</div>
          <div class="status">在线</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-list {
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
.contact-item {
  display: flex;
  padding: 12px 16px;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.contact-item:hover {
  background-color: #f0f0f0;
}
.contact-item img {
  border-radius: 50%;
}
.info {
  flex: 1;
}
.name {
  font-weight: 500;
}
.status {
  font-size: 12px;
  color: #07c160;
}
</style>