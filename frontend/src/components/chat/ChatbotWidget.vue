<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { sendChatMessage } from '../../services/chatService.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
const router = useRouter()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const createMessageId = (role) =>
  `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const inputValue = ref('')
const messages = ref([
  {
    id: createMessageId('assistant'),
    role: 'assistant',
    content:
      '안녕하세요! LocalHub 챗봇입니다. 서울의 관광지, 레포츠, 문화시설, 쇼핑, 숙박, 여행코스, 축제/공연행사에 대해 물어보세요.',
    includeInHistory: false,
    sources: [],
  },
])
const loading = ref(false)
const inputError = ref('')
const showSuggestions = ref(true)
const suggestions = [
  '서울 피크닉 장소 추천해줘',
  '문화시설을 알려줘',
  '주말 여행코스 추천해줘',
]

const scrollAnchor = ref(null)
const textareaRef = ref(null)
let activeController = null
let isUnmounted = false

const addMessage = (message) => {
  const nextMessage = {
    id: createMessageId(message.role),
    sources: [],
    includeInHistory: false,
    ...message,
  }
  messages.value.push(nextMessage)
  return nextMessage.id
}

const updateMessage = (messageId, updates) => {
  const index = messages.value.findIndex((message) => message.id === messageId)
  if (index === -1) return
  messages.value[index] = { ...messages.value[index], ...updates }
}

const getApiHistory = () =>
  messages.value
    .filter((message) => message.includeInHistory)
    .slice(-20)
    .map(({ role, content }) => ({ role, content }))

const normalizeSources = (sources) => {
  if (!Array.isArray(sources)) return []

  return sources
    .filter(
      (source) =>
        source &&
        (source.type === 'post' || source.type === 'location') &&
        source.id !== null &&
        source.id !== undefined
    )
    .map((source) => ({
      type: source.type,
      id: String(source.id),
      name: source.name,
      title: source.title,
      category: source.category,
    }))
}

const getSourceLabel = (source) => {
  if (source.type === 'post') return source.title || '게시글 보기'
  return source.name || '장소 보기'
}

const getErrorMessage = (error) => {
  const status = error?.response?.status

  if (status === 400) return '요청 내용을 처리할 수 없습니다. 메시지를 확인해주세요.'
  if (status === 422) return '메시지 형식이 올바르지 않습니다. 내용을 확인해주세요.'
  if (status >= 500) return '서버에서 답변을 만들지 못했습니다. 잠시 후 다시 시도해주세요.'
  if (error?.code === 'ECONNABORTED') return '응답 시간이 초과되었습니다. 다시 시도해주세요.'
  if (!error?.response) return '네트워크 연결을 확인한 뒤 다시 시도해주세요.'
  return '답변을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
}

const resizeTextarea = () => {
  const textarea = textareaRef.value
  if (!textarea) return
  textarea.style.height = 'auto'
  const nextHeight = Math.min(textarea.scrollHeight, 100)
  textarea.style.height = `${nextHeight}px`
  textarea.style.overflowY = textarea.scrollHeight > 100 ? 'auto' : 'hidden'
}

const scrollToBottom = () => {
  if (scrollAnchor.value) {
    scrollAnchor.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

watch(
  [() => props.modelValue, () => messages.value.length],
  async ([open]) => {
    if (!open) return
    await nextTick()
    scrollToBottom()
  },
  { flush: 'post' }
)

const submitMessage = async (content) => {
  const trimmed = String(content || '').trim()
  if (!trimmed || loading.value) return

  if (trimmed.length > 1000) {
    inputError.value = '메시지는 1000자 이내로 입력해주세요.'
    return
  }

  const history = getApiHistory()
  inputError.value = ''
  
  // 1. 유저 메시지 추가
  const userMessageId = addMessage({
    role: 'user',
    content: trimmed,
    includeInHistory: true,
  })
  inputValue.value = ''
  showSuggestions.value = false
  loading.value = true

  // 2. AI 로딩 메시지 띄우기
  const loadingMessageId = addMessage({
    role: 'assistant',
    content: '답변을 작성하고 있어요…',
    kind: 'loading',
  })
  
  const controller = new AbortController()
  activeController = controller

  try {
    let isFirstChunk = true;

    // 💡 3. 변경된 부분: sendChatMessage에 콜백 함수 전달
    await sendChatMessage(
      trimmed, 
      history, 
      { signal: controller.signal },
      (chunk, fullText) => {
        if (isUnmounted) return;

        // 첫 번째 텍스트 조각이 도착하면 로딩 상태를 'answer'로 변경
        if (isFirstChunk) {
          updateMessage(loadingMessageId, {
            content: fullText,
            kind: 'answer',
            sources: [], // 초기화
          });
          isFirstChunk = false;
        } else {
          // 이후부터는 누적된 전체 텍스트(fullText)로 계속 덮어씌움
          updateMessage(loadingMessageId, {
            content: fullText,
          });
        }
        
        // 글자가 추가될 때마다 자연스럽게 아래로 스크롤
        scrollToBottom();
      }
    )

    if (isUnmounted) return

    // 💡 4. 스트리밍(답변 생성)이 완전히 끝났을 때의 최종 처리
    updateMessage(loadingMessageId, {
      includeInHistory: true,
    })

  } catch (error) {
    if (isUnmounted) return

    updateMessage(userMessageId, { includeInHistory: false })
    updateMessage(loadingMessageId, {
      content: getErrorMessage(error),
      kind: 'error',
      includeInHistory: false,
      sources: [],
    })
    if (!inputValue.value) inputValue.value = trimmed
  } finally {
    if (activeController === controller) activeController = null
    if (!isUnmounted) {
      loading.value = false
      await nextTick()
      resizeTextarea()
      scrollToBottom()
    }
  }
}
const handleSend = async () => {
  await submitMessage(inputValue.value)
}

const handleInput = () => {
  inputError.value = ''
  resizeTextarea()
}

const handleKeydown = async (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    await handleSend()
  }
}

const handleSuggestion = async (text) => {
  await submitMessage(text)
}

const handleSourceClick = async (source) => {
  if (source.type === 'post') {
    await router.push({ name: 'post-detail', params: { id: String(source.id) } })
  } else if (source.type === 'location') {
    await router.push({ name: 'map', query: { poiId: String(source.id) } })
  }
  isOpen.value = false
}

const closeChat = () => {
  isOpen.value = false
}

onBeforeUnmount(() => {
  isUnmounted = true
  activeController?.abort()
})
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
      <div class="message-list" aria-live="polite" :aria-busy="loading">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="[
            'message-item',
            message.role === 'user' ? 'message-user' : 'message-assistant',
            message.kind === 'error' ? 'message-error' : '',
          ]"
        >
          <div class="message-bubble" :class="{ 'message-bubble--loading': message.kind === 'loading' }">
            <p>{{ message.content }}</p>
            <div v-if="message.sources?.length" class="message-sources" aria-label="관련 정보">
              <button
                v-for="source in message.sources"
                :key="`${source.type}-${source.id}`"
                type="button"
                class="message-source"
                @click="handleSourceClick(source)"
              >
                <span class="message-source__type">
                  {{ source.type === 'post' ? '게시글' : '장소' }}
                </span>
                <span>{{ getSourceLabel(source) }}</span>
                <span v-if="source.category" class="message-source__category">
                  {{ source.category }}
                </span>
              </button>
            </div>
          </div>
        </div>
        <div ref="scrollAnchor"></div>
      </div>

      <div v-if="showSuggestions" class="suggestion-panel">
        <p class="suggestion-label">추천 질문</p>
        <div class="suggestion-list">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            type="button"
            class="suggestion-chip"
            :disabled="loading"
            @click="handleSuggestion(suggestion)"
          >
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
          maxlength="1000"
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
      <p v-if="inputError" class="input-error" role="alert">{{ inputError }}</p>
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
  z-index: 50;
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
  flex: 1;
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
  max-width: 85%;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  background: #f8fafc;
  color: var(--color-text);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
  word-break: keep-all;
  white-space: pre-wrap;
}

.message-bubble p {
  margin: 0;
}

.message-bubble--loading {
  color: var(--color-muted);
}

.message-user .message-bubble {
  background: rgba(14, 118, 255, 0.95);
  color: #fff;
}

.message-error .message-bubble {
  background: #fff7ed;
  color: #9a3412;
}

.message-sources {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.message-source {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  border: 1px solid rgba(21, 94, 239, 0.2);
  border-radius: 0.75rem;
  background: #fff;
  color: var(--color-text);
  padding: 0.65rem 0.75rem;
  text-align: left;
  cursor: pointer;
}

.message-source__type {
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 800;
}

.message-source__category {
  width: 100%;
  color: var(--color-muted);
  font-size: 0.8rem;
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

.suggestion-chip:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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

.input-error {
  margin: 0;
  color: #b42318;
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

  .message-bubble {
    max-width: 92%;
  }
}
</style>
