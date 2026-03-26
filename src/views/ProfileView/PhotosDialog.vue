<template>
  <el-dialog
    v-model="dialogVisible"
    title="我的相册"
    width="800px"
    :close-on-click-modal="false"
    custom-class="media-dialog"
  >
    <div class="media-grid" v-loading="loading">
      <div v-for="item in mediaList" :key="item.id" class="media-item">
        <!-- 图片 -->
        <template v-if="item.mime_type?.startsWith('image/')">
          <img :src="item.url" @click="previewImage(item.url)" />
        </template>
        <!-- 视频 -->
        <template v-else-if="item.mime_type?.startsWith('video/')">
          <div class="video-thumb" @click="playVideo(item.url)">
            <img :src="item.thumbnail_url || defaultVideoThumb" />
            <div class="play-icon">▶</div>
          </div>
        </template>
      </div>
      <div v-if="mediaList.length === 0 && !loading" class="empty">暂无媒体文件</div>
    </div>

    <!-- 视频播放弹框（可复用或单独） -->
    <el-dialog v-model="videoVisible" title="视频播放" width="800px" :close-on-click-modal="false">
      <video :src="currentVideoUrl" controls autoplay style="width: 100%; height: auto;"></video>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: Boolean
})
const emit = defineEmits(['update:visible'])
const dialogVisible = ref(props.visible)
watch(() => props.visible, val => (dialogVisible.value = val))
watch(dialogVisible, val => emit('update:visible', val))

const loading = ref(false)
const mediaList = ref([])
const videoVisible = ref(false)
const currentVideoUrl = ref('')
const defaultVideoThumb = '/video-placeholder.png' // 默认视频占位图

const fetchMedia = async () => {
  loading.value = true
  try {
    const res = await request.get('/user/photos') // 建议修改接口为统一媒体接口
    if (res.success) {
      mediaList.value = res.data
    } else {
      ElMessage.error(res.error || '获取媒体失败')
    }
  } catch (err) {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

watch(dialogVisible, val => {
  if (val) fetchMedia()
})

const previewImage = (url) => {
  window.open(url, '_blank')
}

const playVideo = (url) => {
  currentVideoUrl.value = url
  videoVisible.value = true
}
</script>

<style scoped>
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 4px;
}
.media-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  position: relative;
}
.media-item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  transition: transform 0.2s;
}
.media-item img:hover {
  transform: scale(1.05);
}
.video-thumb {
  position: relative;
  cursor: pointer;
}
.video-thumb img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}
.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  backdrop-filter: blur(4px);
}
.empty {
  text-align: center;
  color: #999;
  padding: 40px;
}
</style>