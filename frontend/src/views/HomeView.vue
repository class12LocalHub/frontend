<script setup>
import { onMounted, ref } from 'vue'
import HomeHero from '../components/home/HomeHero.vue'
import CategoryShortcut from '../components/home/CategoryShortcut.vue'
import RecentPostList from '../components/home/RecentPostList.vue'
import { getPosts } from '../services/postService.js'

const recentPosts = ref([])
const loading = ref(false)
const error = ref('')

const loadRecentPosts = async () => {
  loading.value = true
  error.value = ''

  try {
    const result = await getPosts({ page: 1, size: 5 })
    recentPosts.value = result.items ?? []
  } catch (err) {
    console.error(err)
    error.value = '최근 게시글을 불러오지 못했습니다.'
    recentPosts.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRecentPosts()
})
</script>

<template>
  <section class="home-view">
    <HomeHero />
    <CategoryShortcut />
    <RecentPostList :posts="recentPosts" :loading="loading" :error="error" />
  </section>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
