<template>

  <div class="app">

    <Header />


    <main>

      <RouterView />

    </main>


    <ChatButton />

  </div>

</template>


<script setup>

import Header from './components/Header.vue'
import ChatButton from './components/ChatButton.vue'

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