import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

export const useContactStore = defineStore('contact', () => {
  const contactList = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  const friendCount = computed(() => contactList.value.length)
  const getContactList = async () => {
    loading.value = true
    if (loaded.value) {
      return
    }
    const res = await request.get('users/contacts')
    if (res.success) {
      contactList.value = res.contactList || []
      loaded.value = true
      console.log(' store contactList:', contactList.value)
    } else {
      throw new Error(res.error || '获取联系人列表失败')
      ElMessage.error(res.error || '获取联系人列表失败')
    }
    loading.value = false
    loaded.value = true
  }
  const clearContactList = () => {
    contactList.value = []
    loaded.value = false
  }

  const onlineStatus = ref({}); // { userId: true/false }
  
  const updateOnlineStatus = (userId, online) => {
    onlineStatus.value[userId] = online;
  };
  
  const setBatchOnlineStatus = (statusMap) => {
    onlineStatus.value = { ...onlineStatus.value, ...statusMap };
  };

  const fetchFriendsOnlineStatus = async () => {
    const friendIds = contactList.value.map(f => f.id);
    if (friendIds.length === 0) return;
    const res = await request.post('/users/contacts/online', { friendIds });
    if (res.success) {
      setBatchOnlineStatus(res.onlineStatus || {});
    }
  };

  return {
    contactList,
    loading,
    friendCount,
    getContactList,
    clearContactList,
    onlineStatus,
    updateOnlineStatus,
    setBatchOnlineStatus,
    fetchFriendsOnlineStatus
  }
})
