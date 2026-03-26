<template>
  <el-dialog
    v-model="dialogVisible"
    title="账号安全"
    width="500px"
    :close-on-click-modal="false"
  >
    <div class="placeholder">
      <p>功能开发中，敬请期待...</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
})
const emit = defineEmits(['update:visible'])
const dialogVisible = ref(props.visible)
watch(() => props.visible, val => (dialogVisible.value = val))
watch(dialogVisible, val => emit('update:visible', val))

</script>

<style scoped>
.placeholder {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>