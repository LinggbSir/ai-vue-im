import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useUserStore = defineStore('user', () => {
  const myId = ref('')
  const userName = ref('')
  const userAvatar = ref('')
  const userEmail = ref('')
  const token = ref('')
  const logIn = (user) => {
    myId.value = user.id
    userName.value = user.name
    userAvatar.value = user.avatar
    userEmail.value = user.email
    token.value = user.token
  }
  const logOut = () => {
    myId.value = ''
    userName.value = ''
    userAvatar.value = ''
    userEmail.value = ''
    token.value = ''
  }
    return { myId, userName, userAvatar, userEmail, token, logIn, logOut }
})