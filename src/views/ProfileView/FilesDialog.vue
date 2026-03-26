<template>
  <el-dialog
    v-model="dialogVisible"
    title="聊天文件"
    width="600px"
    :close-on-click-modal="false"
  >
    <div v-loading="loading" class="file-list">
      <div v-for="file in files" :key="file.id" class="file-item">
        <div class="file-icon">📄</div>
        <div class="details">
          <div class="name-row">
            <span class="name">{{ file.name }}</span>
            <span class="time">{{ formatTime(file.created_at) }}</span>
          </div>
          <div class="meta-row">
            <div class="info-left">
              <span class="sender">{{ file.sender_name }}</span>
              <span class="separator">|</span>
              <span class="chat-with">{{ file.chat_with }}</span>
              <span class="separator">|</span>
              <el-button type="primary" link @click="downloadFile(file.url, file.name)" class="download-link">下载</el-button>
            </div>
            <span class="size">{{ formatSize(file.size) }}</span>
          </div>
        </div>
      </div>
      <div v-if="files.length === 0 && !loading" class="empty">暂无文件</div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const props = defineProps({
  visible: Boolean
})
const emit = defineEmits(['update:visible'])
const dialogVisible = ref(props.visible)
watch(() => props.visible, val => (dialogVisible.value = val))
watch(dialogVisible, val => emit('update:visible', val))

const loading = ref(false)
const files = ref([])

const fetchFiles = async () => {
  loading.value = true
  try {
    const res = await request.get('/user/files')
    if (res.success) {
      files.value = res.data
    } else {
      ElMessage.error(res.error || '获取文件列表失败')
    }
  } catch (err) {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

watch(dialogVisible, val => {
  if (val) fetchFiles()
})

const formatSize = (bytes) => {
  if (!bytes) return '0B'
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / 1048576).toFixed(1) + 'MB'
}

const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm')
}

const downloadFile = (url, name) => {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
}
</script>

<style scoped>
.file-list {
  max-height: 60vh;
  min-height: 400px;
  overflow-y: auto;
}
.file-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.file-item:last-child {
  border-bottom: none;
}
.file-icon {
  font-size: 24px;
  margin-right: 12px;
  margin-top: 2px;
}
.details {
  flex: 1;
}
.name-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.name {
  font-weight: 500;
  word-break: break-word;
  max-width: 70%;
}
.time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}
.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}
.info-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.separator {
  color: #ddd;
}
.download-link {
  padding: 0;
  font-size: 12px;
}
.size {
  color: #999;
  white-space: nowrap;
}
.empty {
  text-align: center;
  color: #999;
  padding: 40px;
}
</style>