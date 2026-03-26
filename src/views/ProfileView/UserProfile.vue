<template>
  <div class="user-profile">
    <div class="profile-card">
      <!-- 查看模式 -->
      <template v-if="!editMode">
        <div class="profile-header">
          <div class="avatar-wrapper">
            <img :src="userInfo.avatar || '/default_avatar.png'" class="avatar" />
          </div>
          <div class="name-section">
            <h2 class="nickname">{{ userInfo.nick_name }}</h2>
            <p class="echo_id">Echo号：{{ userInfo.echo_id }}</p>
          </div>
        </div>
        <div class="info-list">
          <div class="info-item"><span class="label">昵称</span> <span class="value">{{ userInfo.nick_name }}</span></div>
          <div class="info-item"><span class="label">性别</span> <span class="value">{{ genderText }}</span></div>
          <div class="info-item"><span class="label">邮箱</span> <span class="value">{{ userInfo.email || '未绑定' }}</span></div>
          <div class="info-item"><span class="label">地区</span> <span class="value">{{ userInfo.region || '地球' }}</span></div>
        </div>
        <button class="edit-btn" @click="startEdit">编辑资料</button>
      </template>

      <!-- 编辑模式 -->
      <template v-else>
        <div class="edit-form">
          <h3>编辑资料</h3>

          <!-- 头像上传区域 -->
          <div class="avatar-upload">
            <img :src="previewAvatar || userInfo.avatar || '/default_avatar.png'" class="avatar-preview" />
            <div class="upload-actions">
              <button type="button" class="upload-btn" @click="triggerFileSelect">更换头像</button>
              <span v-if="uploading" class="upload-status">上传中...</span>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFileChange"
            />
          </div>

          <div class="form-item">
            <label>昵称</label>
            <input v-model="editForm.nick_name" type="text" placeholder="请输入昵称" />
          </div>
          <div class="form-item">
            <label>个性签名</label>
            <input v-model="editForm.signature" type="text" placeholder="请输入个性签名" />
          </div>
          <div class="form-item">
            <label>性别</label>
            <select v-model="editForm.gender">
              <option value="0">保密</option>
              <option value="1">男</option>
              <option value="2">女</option>
            </select>
          </div>
          <div class="form-item">
            <label>邮箱</label>
            <input v-model="editForm.email" type="email" placeholder="请输入邮箱" />
          </div>
          <div class="form-item">
            <label>地区</label>
            <input v-model="editForm.region" type="text" placeholder="请输入地区" />
          </div>
          <div class="form-actions">
            <button class="save-btn" @click="saveProfile" :disabled="saving || uploading">
              {{ saving ? '保存中...' : '保存' }}
            </button>
            <button class="cancel-btn" @click="cancelEdit">取消</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)

const defaultAvatar = 'https://via.placeholder.com/100'

// 性别文本映射
const genderText = computed(() => {
  const map = { 0: '保密', 1: '男', 2: '女' }
  return map[userInfo.value.gender] || '保密'
})

// 编辑模式状态
const editMode = ref(false)
const saving = ref(false)
const uploading = ref(false) // 头像上传中

// 编辑表单数据
const editForm = ref({
  nick_name: '',
  signature: '',
  gender: '0',
  email: '',
  region: ''
})

// 头像预览（临时存储新头像的URL）
const previewAvatar = ref('')
const fileInput = ref(null)

// 开始编辑
const startEdit = () => {
  editForm.value = {
    nick_name: userInfo.value.nick_name || '',
    signature: userInfo.value.signature || '',
    gender: String(userInfo.value.gender || '0'),
    email: userInfo.value.email || '',
    region: userInfo.value.region || ''
  }
  previewAvatar.value = '' // 清除预览
  editMode.value = true
}

// 取消编辑
const cancelEdit = () => {
  editMode.value = false
  previewAvatar.value = ''
}

// 触发文件选择
const triggerFileSelect = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 预览图片
  const reader = new FileReader()
  reader.onload = (e) => {
    previewAvatar.value = e.target.result
  }
  reader.readAsDataURL(file)

  // 上传图片
  uploadAvatar(file)
}

// 上传头像
const uploadAvatar = async (file) => {
  const formData = new FormData()
  formData.append('avatar', file)

  uploading.value = true
  try {
    const res = await request.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.success) {
      // 更新 store 中的头像
      authStore.updateUserInfo({ avatar: res.data.avatarUrl })
      console.log(res.data.avatarUrl)
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error(res.error || '头像上传失败')
      previewAvatar.value = '' // 清除预览
    }
  } catch (err) {
    ElMessage.error('网络错误')
    console.error(err)
    previewAvatar.value = ''
  } finally {
    uploading.value = false
    // 清空文件输入框，以便下次重新选择同一个文件
    fileInput.value.value = ''
  }
}

// 保存个人资料
const saveProfile = async () => {
  if (saving.value) return
  saving.value = true
  try {
    const res = await request.put('/user/profile', {
      nick_name: editForm.value.nick_name,
      signature: editForm.value.signature,
      gender: parseInt(editForm.value.gender),
      email: editForm.value.email,
      region: editForm.value.region
    })
    if (res.success) {
      // 更新 store 中的用户信息（注意：头像已在 uploadAvatar 中更新，此处不需要重复）
      authStore.updateUserInfo({
        nick_name: editForm.value.nick_name,
        signature: editForm.value.signature,
        gender: parseInt(editForm.value.gender),
        email: editForm.value.email,
        region: editForm.value.region
      })
      ElMessage.success('资料更新成功')
      editMode.value = false
    } else {
      ElMessage.error(res.error || '更新失败')
    }
  } catch (err) {
    ElMessage.error('网络错误')
    console.error(err)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.user-profile {
  height: 100%;
  background-color: #f5f5f5; /* 深灰色背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
  padding: 20px;
}

.profile-card {
  width: 100%;
  max-width: 800px;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 30px 24px;
}

/* 查看模式样式（与原样式一致，但移除原来 .user-profile 中的 padding 等） */
.profile-header {
  text-align: center;
  margin-bottom: 30px;
}
.avatar-wrapper {
  margin-bottom: 16px;
}
.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}
.name-section {
  margin-bottom: 8px;
}
.nickname {
  font-size: 24px;
  font-weight: 500;
  color: #333;
  margin: 0 0 8px;
}
.echo_id {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.info-list {
  width: 100%;
  background-color: #fff;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  margin: 16px 0;
}
.info-item {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;
}
.info-item:last-child {
  border-bottom: none;
}
.label {
  width: 80px;
  color: #8e8e93;
  flex-shrink: 0;
}
.value {
  flex: 1;
  color: #333;
  word-break: break-word;
}

.edit-btn {
  width: 100%;
  padding: 12px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 20px;
}
.edit-btn:hover {
  background-color: #06b156;
}

/* 编辑模式样式 */
.edit-form {
  width: 100%;
}
.edit-form h3 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 500;
}
.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}
.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
  border: 2px solid #ddd;
}
.upload-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.upload-btn {
  padding: 6px 12px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.upload-btn:hover {
  background-color: #e8e8e8;
}
.upload-status {
  color: #999;
  font-size: 14px;
}
.form-item {
  margin-bottom: 15px;
}
.form-item label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}
.form-item input,
.form-item select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.save-btn {
  flex: 1;
  padding: 10px;
  background-color: #07c160;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.cancel-btn {
  flex: 1;
  padding: 10px;
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}
</style>