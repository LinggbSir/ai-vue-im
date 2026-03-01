<template>
  <router-view />
</template>

<script setup>
// 全局初始化逻辑可以放在这里（如检查登录状态、加载用户信息等）
// 但现在可以留空，后续根据需要添加
</script>

<style>
/* 全局样式重置或基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 其他全局样式 */
</style>