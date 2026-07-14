import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MapView from '../views/MapView.vue'
import BoardListView from '../views/BoardListView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import PostCreateView from '../views/PostCreateView.vue'
import PostEditView from '../views/PostEditView.vue'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/map', name: 'map', component: MapView },
    { path: '/board', name: 'board', component: BoardListView },
    { path: '/post/:id', alias: '/posts/:id', name: 'post-detail', component: PostDetailView },
    { path: '/posts/create', alias: '/post/create', name: 'post-create', component: PostCreateView },
    { path: '/posts/:id/edit', alias: '/post/edit/:id', name: 'post-edit', component: PostEditView },
    { path: '/dashboard', name: 'dashboard', component: DashboardView },
  ],
})

export default router
