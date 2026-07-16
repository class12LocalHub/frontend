<script setup>
import { ref } from 'vue'
import ChatbotWidget from '../../components/chat/ChatbotWidget.vue'

const isOpen = ref(false)
const toggleChatbot = () => {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <ChatbotWidget v-model:modelValue="isOpen" />
  <button
    class="floating-chat-button"
    type="button"
    @click="toggleChatbot"
    :aria-label="isOpen ? '챗봇 닫기' : '챗봇 열기'"
    :aria-expanded="isOpen"
  >
    <span class="floating-chat-button__icon">💬</span>
    <span class="floating-chat-button__label">챗봇</span>
  </button>
</template>

<style scoped>
.floating-chat-button {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: #fff;
  padding: 0.9rem 1.1rem;
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.24);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 700;
  z-index: 45;
}

.floating-chat-button:hover {
  background: #ea580c;
}

.floating-chat-button__icon {
  font-size: 1rem;
}

.floating-chat-button__label {
  font-size: 0.95rem;
}
</style>
