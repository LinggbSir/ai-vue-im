import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import MainLayout from '@/components/MainLayout.vue'
import SessionList from '@/views/ChatView/SessionList.vue'
import ChatArea from '@/views/ChatView/ChatArea.vue'
import ContactList from '@/views/ContactsView/ContactList.vue'
import ContactProfile from '@/views/ContactsView/ContactProfile.vue'
import UserProfile from '@/views/ProfileView/UserProfile.vue'
import EmptyPlaceholder from '@/components/EmptyPlaceholder.vue'

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
          children: {
            path: ':friendId',
            components: {
              list: SessionList,
              default: ChatArea
            }
          }
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
            list: EmptyPlaceholder,
            default: UserProfile
          }
        }
      ]
    }
  ]
})

console.log('注册的路由:', router.getRoutes().map(r => r.path))

router.beforeEach((to, from, next) => {
  console.log('当前导航目标:', to.path)
  next()
})

export default router