import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

export const useContactStore = defineStore('contact', () => {
  const contactList = ref([])
  const loading = ref(false)
  const getContacts = async () => {
    loading.value = true
    const res = await request.get('users/contacts')
    if (res.success) {
      contactList.value = res.contactList || []
      console.log(' store contactList:', contactList.value)
    } else {
      throw new Error(res.error || '获取联系人列表失败')
      ElMessage.error(res.error || '获取联系人列表失败')
    }
    loading.value = false
  }
  return {
    contactList,
    loading,
    getContacts
  }
})
