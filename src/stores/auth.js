// stores/auth.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 聚合用户信息为一个对象
  const userInfo = ref({
    id: '',
    echo_id: '',
    nick_name: '',
    gender: 0,
    signature: '',
    avatar: '',
    email: '',
    region: '',
    token: ''
  })

  // 登录：设置用户信息
  const logIn = (user) => {
    console.log(user)
    userInfo.value = {
      id: user.id || '',
      echo_id: user.echo_id || '', 
      nick_name: user.nick_name || '',
      gender: user.gender || 0,
      signature: user.signature || '',
      avatar: user.avatar || '',
      email: user.email || '',
      region: user.region || '',
      token: user.token || ''
    }
    // 同步 token 到 localStorage
    if (userInfo.value.token) {
      localStorage.setItem('token', userInfo.value.token)
    }
  }

  // 登出：清空用户信息
  const logOut = () => {
    userInfo.value = {
      id: '',
      echo_id: '',
      nick_name: '',
      gender: 0,
      signature: '',
      avatar: '',
      email: '',
      region: '',
      token: ''
    }
    localStorage.removeItem('token')
  }

  // 单独设置 token（如刷新 token 时）
  const setToken = (newToken) => {
    userInfo.value.token = newToken
    localStorage.setItem('token', newToken)
  }

  const updateUserInfo = (user) => {
    userInfo.value = {
      ...userInfo.value,
      ...user
    }
  }

  return { userInfo, logIn, logOut, setToken, updateUserInfo }
})