import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页概览', icon: 'HomeFilled' }
      },
      {
        path: 'plants',
        name: 'Plants',
        component: () => import('@/views/Plants.vue'),
        meta: { title: '植物档案', icon: 'Grape' }
      },
      {
        path: 'plant/:id',
        name: 'PlantDetail',
        component: () => import('@/views/PlantDetail.vue'),
        meta: { title: '植物详情', hidden: true }
      },
      {
        path: 'records',
        name: 'Records',
        component: () => import('@/views/Records.vue'),
        meta: { title: '养护记录', icon: 'Notebook' }
      },
      {
        path: 'gallery',
        name: 'Gallery',
        component: () => import('@/views/Gallery.vue'),
        meta: { title: '生长相册', icon: 'Picture' }
      },
      {
        path: 'reminders',
        name: 'Reminders',
        component: () => import('@/views/Reminders.vue'),
        meta: { title: '提醒事项', icon: 'AlarmClock' }
      },
      {
        path: 'knowledge',
        name: 'Knowledge',
        component: () => import('@/views/Knowledge.vue'),
        meta: { title: '养护知识', icon: 'Reading' }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
        meta: { title: '数据统计', icon: 'DataAnalysis' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '设置', icon: 'Setting' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
