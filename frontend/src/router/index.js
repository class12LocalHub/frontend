import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import PostListView from '../views/PostListView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import PostWriteView from '../views/PostWriteView.vue'
import DashboardView from '../views/DashboardView.vue'


const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },

    {
      path: '/posts',
      name: 'posts',
      component: PostListView
    },

    {
      path: '/posts/:id',
      name: 'post-detail',
      component: PostDetailView
    },

    {
      path: '/posts/write',
      name: 'post-write',
      component: PostWriteView
    },

    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView
    }
  ]
})


export default router