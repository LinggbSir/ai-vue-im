<template>
  <el-dialog
    v-model="dialogVisible"
    title="通知设置"
    width="500px"
    :close-on-click-modal="false"
  >
    <div class="settings-container">
      <div class="setting-item">
        <span class="setting-label">新消息通知声音</span>
        <el-switch v-model="settings.newMessageSound" @change="saveSettings" />
      </div>
      <div class="setting-item">
        <span class="setting-label">语音和视频通话通知声音</span>
        <el-switch v-model="settings.callSound" @change="saveSettings" />
      </div>
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  visible: Boolean,
})
const emit = defineEmits(['update:visible'])
const dialogVisible = ref(props.visible)
watch(() => props.visible, val => (dialogVisible.value = val))
watch(dialogVisible, val => emit('update:visible', val))

// 设置项
const settings = ref({
  newMessageSound: true,
  callSound: true,
})

// 保存到 localStorage
const saveSettings = () => {
  localStorage.setItem('notificationSettings', JSON.stringify(settings.value))
}

// 加载设置
const loadSettings = () => {
  const saved = localStorage.getItem('notificationSettings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      settings.value = { ...settings.value, ...parsed }
    } catch (e) {}
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-container {
  padding: 20px;
}
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e5e5;
}
.setting-item:last-child {
  border-bottom: none;
}
.setting-label {
  font-size: 14px;
  color: #333;
}
</style>