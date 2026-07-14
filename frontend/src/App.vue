<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import FloatingChatButton from './components/chatbot/FloatingChatButton.vue'
</script>

<template>
  <div class="app-shell">
    <AppHeader />

    <main class="app-main">
      <RouterView />
    </main>

    <FloatingChatButton />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f9fafb;
}

.app-main {
  max-width: 1120px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}
</style>
