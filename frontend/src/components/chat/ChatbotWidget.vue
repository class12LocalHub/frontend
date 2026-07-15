<script setup>
import { nextTick, ref } from 'vue'
import { sendChatMessage } from '../../api/chat'
import { getApiErrorMessage } from '../../utils/api'
import { normalizeTourApiId } from '../../utils/normalize'

const isOpen = ref(false)
const input = ref('')
const messages = ref([])
const sending = ref(false)
const errorMessage = ref('')
const messageList = ref(null)

async function sendMessage() {
  const message = input.value.trim()
  if (!message || sending.value) return

  const history = messages.value.map(({ role, content }) => ({ role, content }))
  messages.value.push({ role: 'user', content: message, sources: [] })
  input.value = ''
  sending.value = true
  errorMessage.value = ''

  try {
    const response = await sendChatMessage(message, history)
    messages.value.push({
      role: 'assistant',
      content: response.data.answer,
      sources: response.data.sources || [],
    })
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, '챗봇 응답을 받지 못했습니다.')
  } finally {
    sending.value = false
    await nextTick()
    if (messageList.value) messageList.value.scrollTop = messageList.value.scrollHeight
  }
}

function sourceLink(source) {
  if (source.type === 'post') return `/posts/${Number(source.id)}`

  return {
    path: '/map',
    query: { poiId: normalizeTourApiId(source.id) },
  }
}
</script>

<template>
  <aside v-if="isOpen" class="chat-panel" aria-label="LocalHub 챗봇">
    <header>
      <div>
        <strong>LocalHub 챗봇</strong>
        <span>서울 지역정보 검색</span>
      </div>
      <button type="button" class="close-button" aria-label="챗봇 닫기" @click="isOpen = false">닫기</button>
    </header>

    <div ref="messageList" class="message-list" aria-live="polite">
      <div v-if="messages.length === 0" class="chat-empty">
        궁금한 지역정보나 게시글을 질문해 주세요.
      </div>
      <article v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
        <span>{{ message.role === 'user' ? '나' : 'LocalHub' }}</span>
        <p>{{ message.content }}</p>
        <div v-if="message.sources.length" class="sources">
          <RouterLink v-for="source in message.sources" :key="`${source.type}-${source.id}`" :to="sourceLink(source)">
            {{ source.name || source.title || `결과 ${source.id}` }}
          </RouterLink>
        </div>
      </article>
      <p v-if="sending" class="sending">응답을 기다리는 중입니다.</p>
      <p v-if="errorMessage" class="chat-error" role="alert">{{ errorMessage }}</p>
    </div>

    <form class="chat-form" @submit.prevent="sendMessage">
      <label class="visually-hidden" for="chat-input">질문</label>
      <input id="chat-input" v-model="input" maxlength="1000" placeholder="질문을 입력하세요" />
      <button class="primary-button" type="submit" :disabled="sending || !input.trim()">전송</button>
    </form>
  </aside>

  <button type="button" class="chat-launcher" :aria-expanded="isOpen" @click="isOpen = !isOpen">
    {{ isOpen ? '챗봇 닫기' : '챗봇' }}
  </button>
</template>

<style scoped>
.chat-launcher {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 40;
  min-width: 78px;
  min-height: 46px;
  border: 1px solid #176b4d;
  border-radius: 8px;
  background: #176b4d;
  color: #ffffff;
  font-weight: 800;
  box-shadow: 0 8px 20px rgba(23, 32, 51, 0.18);
}

.chat-panel {
  position: fixed;
  right: 24px;
  bottom: 82px;
  z-index: 40;
  width: min(380px, calc(100vw - 32px));
  height: min(560px, calc(100vh - 120px));
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  border: 1px solid #c8d0dc;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(23, 32, 51, 0.2);
}

header {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e1e6ed;
}

header div {
  display: grid;
  gap: 2px;
}

header span {
  color: #647085;
  font-size: 12px;
}

.close-button {
  padding: 6px;
  border: 0;
  background: transparent;
  color: #536074;
}

.message-list {
  padding: 16px;
  overflow-y: auto;
  background: #f7f9fb;
}

.chat-empty {
  height: 100%;
  display: grid;
  place-content: center;
  color: #748095;
  font-size: 14px;
  text-align: center;
}

.message {
  width: fit-content;
  max-width: 86%;
  margin-bottom: 14px;
}

.message > span {
  display: block;
  margin-bottom: 4px;
  color: #647085;
  font-size: 12px;
}

.message p {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
  line-height: 1.55;
  white-space: pre-wrap;
}

.message.user {
  margin-left: auto;
}

.message.user p {
  border-color: #176b4d;
  background: #176b4d;
  color: #ffffff;
}

.sources {
  margin-top: 6px;
  display: grid;
  gap: 4px;
}

.sources a {
  color: #176b4d;
  font-size: 13px;
  font-weight: 700;
}

.sending,
.chat-error {
  font-size: 13px;
}

.sending {
  color: #647085;
}

.chat-error {
  color: #a13d3d;
}

.chat-form {
  padding: 10px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  border-top: 1px solid #e1e6ed;
}

@media (max-width: 480px) {
  .chat-panel {
    right: 16px;
    bottom: 76px;
  }

  .chat-launcher {
    right: 16px;
    bottom: 16px;
  }
}
</style>
