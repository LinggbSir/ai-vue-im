<template>
  <div class="contact-profile">
    <div class="profile-header">
      <img src="https://via.placeholder.com/80" alt="avatar" />
      <h2>好友昵称</h2>
      <p>个性签名～</p>
    </div>
    <div class="profile-actions">
      <button>发消息</button>
      <button>更多</button>
    </div>
  </div>
</template>

<style scoped>
.contact-profile {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  text-align: center;
}
.profile-header img {
  border-radius: 50%;
  margin-bottom: 10px;
}
.profile-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
}
.profile-actions button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
}
.profile-actions button:first-child {
  background-color: #07c160;
  color: white;
  border: none;
}
</style>