<script setup>

import { ref } from 'vue'
import ChatWindow from './ChatWindow.vue'


const isOpen = ref(false)

</script>


<template>

  <ChatWindow 
    v-if="isOpen"
  />


  <button 
    class="chat-button"
    @click="isOpen = !isOpen"
  >
    💬
  </button>

</template>