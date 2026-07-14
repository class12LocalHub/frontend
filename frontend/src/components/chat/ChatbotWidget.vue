<script setup>
import { computed, nextTick, ref } from 'vue'
import { sendChatMessage } from '../../services/chatService.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const inputValue = ref('')
const messages = ref([
  {
    id: Date.now(),
    role: 'assistant',
    content:
      '안녕하세요! LocalHub 챗봇입니다. 서울의 관광지, 레포츠, 문화시설, 쇼핑, 숙박, 여행코스, 축제/공연행사에 대해 물어보세요.',
  },
])
const loading = ref(false)
const errorMessage = ref('')
const showSuggestions = ref(true)
const suggestions = [
  '서울 피크닉 장소 추천해줘',
  '문화시설을 알려줘',
  '주말 여행코스 추천해줘',
]

const scrollAnchor = ref(null)
const textareaRef = ref(null)

const addMessage = (role, content) => {
  messages.value.push({
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  })
}

const resizeTextarea = () => {
  const textarea = textareaRef.value
  if (!textarea) return
  textarea.style.height = 'auto'
  const nextHeight = Math.min(textarea.scrollHeight, 100)
  textarea.style.height = `${nextHeight}px`
  textarea.style.overflowY = textarea.scrollHeight > 100 ? 'auto' : 'hidden'
}

const submitMessage = async (content) => {
  const trimmed = content.replace(/\s+/g, ' ').trim()
  if (!trimmed || loading.value) {
    return
  }

  errorMessage.value = ''
  addMessage('user', trimmed)
  inputValue.value = ''
  showSuggestions.value = false

  loading.value = true
  addMessage('assistant', '답변을 작성하고 있어요…')

  try {
    const response = await sendChatMessage(trimmed, messages.value)
    const assistantIndex = messages.value.findIndex(
      (item) => item.role === 'assistant' && item.content === '답변을 작성하고 있어요…'
    )
    if (assistantIndex !== -1) {
      messages.value[assistantIndex].content = response.answer
    }
  } catch (error) {
    errorMessage.value = '답변을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    const assistantIndex = messages.value.findIndex(
      (item) => item.role === 'assistant' && item.content === '답변을 작성하고 있어요…'
    )
    if (assistantIndex !== -1) {
      messages.value[assistantIndex].content = errorMessage.value
    }
  } finally {
    loading.value = false
    await nextTick()
    resizeTextarea()
    scrollToBottom()
  }
}

const handleSend = async () => {
  await submitMessage(inputValue.value)
}

const handleInput = () => {
  resizeTextarea()
}

const handleKeydown = async (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    await handleSend()
  }
}

const scrollToBottom = () => {
  if (scrollAnchor.value) {
    scrollAnchor.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

const handleSuggestion = async (text) => {
  await submitMessage(text)
}

const closeChat = () => {
  isOpen.value = false
}
</script>

<template>
  <div v-if="isOpen" class="chatbot-widget" role="dialog" aria-modal="true" aria-label="LocalHub 챗봇">
    <div class="chatbot-header">
      <div>
        <p class="chatbot-title">LocalHub 챗봇</p>
        <p class="chatbot-subtitle">서울 여행 정보를 물어보세요.</p>
      </div>
      <button class="chatbot-close" type="button" @click="closeChat" aria-label="챗봇 닫기">
        ×
      </button>
    </div>

    <div class="chatbot-body">
      <div class="message-list" aria-live="polite">
        <div v-for="message in messages" :key="message.id" :class="['message-item', message.role === 'user' ? 'message-user' : 'message-assistant']">
          <div class="message-bubble">
            <p>{{ message.content }}</p>
          </div>
        </div>
        <div ref="scrollAnchor"></div>
      </div>

      <div v-if="showSuggestions" class="suggestion-panel">
        <p class="suggestion-label">추천 질문</p>
        <div class="suggestion-list">
          <button type="button" class="suggestion-chip" v-for="suggestion in suggestions" :key="suggestion" @click="handleSuggestion(suggestion)">
            {{ suggestion }}
          </button>
        </div>
      </div>
    </div>

    <div class="chatbot-input-area">
      <div class="chatbot-input-row">
        <textarea
          ref="textareaRef"
          class="chatbot-input"
          v-model="inputValue"
          @input="handleInput"
          @keydown="handleKeydown"
          placeholder="메시지를 입력하세요"
          aria-label="챗봇 메시지 입력"
          rows="1"
        ></textarea>
        <button
          class="chatbot-send"
          type="button"
          @click="handleSend"
          :disabled="!inputValue.trim() || loading"
          aria-label="메시지 전송"
        >
          전송
        </button>
      </div>
      <p class="input-hint">Shift + Enter로 줄바꿈</p>
    </div>
  </div>
</template>

<style scoped>
.chatbot-widget {
  position: fixed;
  right: 1.25rem;
  bottom: 5.5rem;
  width: min(400px, calc(100vw - 1.5rem));
  max-height: min(560px, calc(100vh - 2rem));
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 1.25rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  overflow: hidden;
  z-index: 40;
}

.chatbot-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1rem 0.85rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.chatbot-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-primary);
}

.chatbot-subtitle {
  margin: 0.35rem 0 0;
  font-size: 0.92rem;
  color: var(--color-muted);
  line-height: 1.4;
}

.chatbot-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.04);
  color: var(--color-text);
  font-size: 1.2rem;
  cursor: pointer;
}

.chatbot-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 1rem;
  gap: 0.75rem;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  padding-right: 0.25rem;
  min-height: 0;
}

.message-item {
  display: flex;
}

.message-user {
  justify-content: flex-end;
}

.message-assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: #f8fafc;
  color: var(--color-text);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
  word-break: keep-all;
  white-space: pre-wrap;
}

.message-user .message-bubble {
  background: rgba(14, 118, 255, 0.95);
  color: #fff;
}

.suggestion-panel {
  border-top: 1px solid rgba(148, 163, 184, 0.16);
  padding-top: 0.85rem;
}

.suggestion-label {
  margin: 0 0 0.65rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.suggestion-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.suggestion-chip {
  border: 1px solid rgba(14, 118, 255, 0.25);
  background: rgba(14, 118, 255, 0.08);
  color: var(--color-primary);
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  font-size: 0.88rem;
  cursor: pointer;
}

.chatbot-input-area {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 1rem 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
  background: #f8fafc;
}

.chatbot-input-row {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.chatbot-input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  max-height: 100px;
  padding: 11px 12px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 0.95rem;
  resize: none;
  overflow-x: hidden;
  overflow-y: auto;
  line-height: 1.4;
  font-size: 0.96rem;
  color: var(--color-text);
  box-sizing: border-box;
  min-height: 44px;
}

.input-hint {
  margin: 0;
  color: rgba(100, 116, 139, 0.9);
  font-size: 0.82rem;
}

.chatbot-send {
  width: 68px;
  height: 44px;
  border: none;
  border-radius: 0.95rem;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.chatbot-send:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .chatbot-widget {
    right: 1rem;
    bottom: 5rem;
    width: min(360px, calc(100vw - 1.5rem));
    max-height: min(560px, calc(100vh - 2rem));
  }
}

@media (max-width: 660px) {
  .chatbot-widget {
    right: 0.5rem;
    bottom: 0.5rem;
    width: calc(100vw - 1rem);
    height: calc(100vh - 1rem);
    max-height: calc(100vh - 1rem);
    border-radius: 1rem;
  }

  .chatbot-body {
    padding: 0.85rem;
  }

  .chatbot-input-row {
    padding: 0.85rem;
  }
}
</style>
