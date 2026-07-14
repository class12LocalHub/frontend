<template>

  <div class="app">

    <Header />


    <main>

      <HomeSection />

      <PostSection />

      <DashboardSection />

    </main>


    <ChatButton />

  </div>

</template>


<script setup>

import Header from './components/Header.vue'
import ChatButton from './components/ChatButton.vue'

import HomeSection from './components/HomeSection.vue'
import PostSection from './components/PostSection.vue'
import DashboardSection from './components/DashboardSection.vue'

</script>


<style>

body {
  margin:0;
  font-family: Arial, sans-serif;
}


.app {
  min-height:100vh;
}

</style>