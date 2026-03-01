<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="login-page">
    <!-- 背景图片层 -->
    <div class="background"></div>
    
    <!-- 内容层 -->
    <div class="content">
      <!-- 左侧标语区域 -->
      <div class="slogan">
        <h1>AI 即时通讯</h1>
        <p>智能 · 流畅 · 安全</p>
        <p class="sub">让每一次沟通都充满智慧</p>
      </div>
      
      <!-- 右侧登录窗口 -->
      <div class="login-card">
        <h2>欢迎回来</h2>
        <p class="tip">使用你的账号登录</p>
        <form @submit.prevent="handleLogin">
          <div class="form-item">
            <input 
              type="text" 
              v-model="username" 
              placeholder="用户名"
              required
            />
          </div>
          <div class="form-item">
            <input 
              type="password" 
              v-model="password" 
              placeholder="密码"
              required
            />
          </div>
          <div class="form-item remember">
            <label>
              <input type="checkbox" v-model="remember" /> 记住我
            </label>
            <a href="#">忘记密码？</a>
          </div>
          <button type="submit" class="login-btn">登 录</button>
        </form>
        <p class="register">
          还没有账号？<a href="#">立即注册</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// import { useUserStore } from '@/stores/user'  // 后续引入

const router = useRouter()
// const userStore = useUserStore()

const username = ref('')
const password = ref('')
const remember = ref(false)

const handleLogin = () => {
  // 模拟登录，实际应调用后端 API
  // 这里简单处理：只要输入了用户名和密码就跳转到聊天页
  if (username.value && password.value) {
    // 模拟存储 token 等
    localStorage.setItem('token', 'fake-token')
    // 跳转到主页（即 /，会重定向到 /chat）
    console.log('跳转到：', '/chat')
    router.push('/chat')
  } else {
    alert('请输入用户名和密码')
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Microsoft YaHei', sans-serif;
}

/* 背景图片层 */
.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80');
  background-size: cover;
  background-position: center;
  filter: brightness(0.7);
  z-index: 1;
}

/* 内容层 */
.content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  color: white;
  backdrop-filter: blur(2px);
}

/* 左侧标语 */
.slogan {
  flex: 1;
  text-align: center;
  padding: 0 40px;
  max-width: 600px;
}
.slogan h1 {
  font-size: 48px;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
.slogan p {
  font-size: 24px;
  margin: 8px 0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.slogan .sub {
  font-size: 18px;
  opacity: 0.9;
}

/* 右侧登录卡片 */
.login-card {
  width: 400px;
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  color: #333;
  margin-right: 10%;
}
.login-card h2 {
  font-size: 28px;
  margin-bottom: 8px;
  text-align: center;
}
.login-card .tip {
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  font-size: 14px;
}

.form-item {
  margin-bottom: 20px;
}
.form-item input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}
.form-item input:focus {
  outline: none;
  border-color: #07c160;
}

.remember {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}
.remember label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.remember a {
  color: #07c160;
  text-decoration: none;
}
.remember a:hover {
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: #07c160;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
  margin-bottom: 20px;
}
.login-btn:hover {
  background: #06b156;
}

.register {
  text-align: center;
  font-size: 14px;
  color: #666;
}
.register a {
  color: #07c160;
  text-decoration: none;
}
.register a:hover {
  text-decoration: underline;
}

/* 响应式处理：小屏幕时隐藏左侧 slogan */
@media (max-width: 768px) {
  .slogan {
    display: none;
  }
  .login-card {
    margin-right: 0;
    width: 90%;
    max-width: 400px;
  }
}
</style>