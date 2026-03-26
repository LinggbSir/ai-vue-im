import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import MainLayout from '@/components/MainLayout.vue'
import SessionList from '@/views/ChatView/SessionList.vue'
import ChatArea from '@/views/ChatView/ChatArea.vue'
import ContactList from '@/views/ContactsView/ContactList.vue'
import ContactProfile from '@/views/ContactsView/ContactProfile.vue'
import UserProfile from '@/views/ProfileView/UserProfile.vue'
import UserProfileSidebar from '@/views/ProfileView/UserProfileSidebar.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/chat',
      component: MainLayout,
      children: [
        {
          path: '',
          components: {
            list: SessionList,
            default: ChatArea
          }
        },
        {
          path: 'session',
          components: {
            list: SessionList,
            default: ChatArea
          },
          children: [
            {
              path: 'chatArea/:targetId',
              components: {
                list: SessionList,
                default: ChatArea
              }
            }
          ]
        },
        {
          path: 'contacts',
          components: {
            list: ContactList,
            default: ContactProfile
          },
          children: [
            {
              path: 'profile/:id',
              components: {
                list: ContactList,
                default: ContactProfile
              }
            }
          ]
        },
        {
          path: 'profile',
          components: {
            list: UserProfileSidebar,
            default: UserProfile
          }
        }
      ]
    }
  ]
})

export default router