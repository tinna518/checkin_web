import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'TaskList',
    component: () => import('./views/TaskList.vue')
  },
  {
    path: '/record',
    name: 'Recorder',
    component: () => import('./views/Recorder.vue')
  },
  {
    path: '/edit/:id',
    name: 'ConfigEditor',
    component: () => import('./views/ConfigEditor.vue')
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('./views/Logs.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
