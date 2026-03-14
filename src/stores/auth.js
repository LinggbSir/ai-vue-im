import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useAuthStore = defineStore('user', () => {
  const userId = ref('')
  const userName = ref('')
  const userAvatar = ref('')
  const userEmail = ref('')
  const token = ref('')
  const logIn = (user) => {
    userId.value = user.id
    userName.value = user.name
    userAvatar.value = user.avatar
    userEmail.value = user.email
    token.value = user.token
  }
  const logOut = () => {
    userId.value = ''
    userName.value = ''
    userAvatar.value = ''
    userEmail.value = ''
    token.value = ''
  }
  const setToken = (newToken) => {
    token.value = newToken
  }
    return { userId, userName, userAvatar, userEmail, token, logIn, logOut, setToken }
})