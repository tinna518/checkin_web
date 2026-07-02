import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('./views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('./views/Register.vue'),
    meta: { public: true }
  },
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


router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (!to.meta.public && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router
