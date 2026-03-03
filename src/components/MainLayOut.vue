<!-- src/layouts/MainLayout.vue -->
<template>
  <div class="layout">
    <!-- 左侧导航 -->
    <SideNav />
    
    <!-- 中间列表区 -->
    <div class="list-area">
      <router-view name="list" />
    </div>
    
    <!-- 右侧内容区 -->
    <div class="content-area">
      <router-view />
    </div>
  </div>
  <!-- 放置弹窗组件，但控制权交给 SideNav 通过 provide/inject -->
  <SettingsDialog ref="settingsDialogRef" />
</template>

<script setup>
import SideNav from '@/components/SideNav.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import { ref, provide } from 'vue'

const settingsDialogRef = ref(null)

// 提供一个对象，包含 open 方法，该方法实际调用弹窗组件的 open
provide('settingsDialog', {
  open: () => settingsDialogRef.value?.open()
})
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
.list-area {
  width: 330px;  /* 原来280px，适当加宽 */
  border-right: 1px solid #e5e5e5;
  background-color: #f8f9fa;
  overflow-y: auto;
}
.content-area {
  flex: 1;
  background-color: #ffffff;
  overflow-y: auto;
}
</style>