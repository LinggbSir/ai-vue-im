<template>
  <div class="user-profile">
    <div class="profile-header">
      <img src="https://via.placeholder.com/100" alt="avatar" />
      <h2>我的昵称</h2>
      <p>这个人很懒，什么都没留下</p>
    </div>
    <div class="profile-detail">
      <div class="item"><span>账号</span> <span>user_123</span></div>
      <div class="item"><span>性别</span> <span>保密</span></div>
      <div class="item"><span>地区</span> <span>地球</span></div>
    </div>
    <button class="edit-btn">编辑资料</button>
  </div>
</template>

<style scoped>
.user-profile {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}
.profile-header {
  text-align: center;
  margin-bottom: 30px;
}
.profile-header img {
  border-radius: 50%;
}
.profile-detail {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}
.item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e5e5e5;
}
.item:last-child {
  border-bottom: none;
}
.edit-btn {
  width: 100%;
  padding: 12px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>