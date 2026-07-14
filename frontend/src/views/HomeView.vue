<script setup>
import HomeHero from '../components/home/HomeHero.vue'
import CategoryShortcut from '../components/home/CategoryShortcut.vue'
import RecentPostList from '../components/home/RecentPostList.vue'
</script>

<template>
  <section class="home-view">
    <HomeHero />
    <CategoryShortcut />
    <RecentPostList />
  </section>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
