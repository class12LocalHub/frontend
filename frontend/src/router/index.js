import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '../views/DashboardView.vue'
import HomeView from '../views/HomeView.vue'
import MapView from '../views/MapView.vue'
import PostCreateView from '../views/PostCreateView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import PostEditView from '../views/PostEditView.vue'
import PostListView from '../views/PostListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/posts',
      name: 'posts',
      component: PostListView,
    },
    {
      path: '/posts/new',
      alias: '/posts/write',
      name: 'post-create',
      component: PostCreateView,
    },
    {
      path: '/posts/:id',
      name: 'post-detail',
      component: PostDetailView,
    },
    {
      path: '/posts/:id/edit',
      name: 'post-edit',
      component: PostEditView,
    },
    {
      path: '/map',
      name: 'map',
      component: MapView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
