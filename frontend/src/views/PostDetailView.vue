<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LikeButton from '../components/post/LikeButton.vue'
import { getPostById } from '../services/postService.js'

const route = useRoute()
const router = useRouter()
const postId = computed(() => Number(route.params.id ?? 0))

const post = ref(null)
const status = ref('loading')
const errorMessage = ref('')
const isModalOpen = ref(false)
const deletePassword = ref('')
const deleteError = ref('')
const deleteInfo = ref('')

const formattedContent = computed(() => post.value?.content ?? '')

const loadPost = async () => {
  status.value = 'loading'
  errorMessage.value = ''
  post.value = null

  try {
    const result = await getPostById(postId.value)

    if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
      status.value = 'not-found'
      errorMessage.value = '게시글을 찾을 수 없습니다.'
      return
    }

    post.value = {
      ...result,
      custom_tags: result.custom_tags ?? [],
      like_count: result.like_count ?? 0,
      liked: result.liked ?? false,
    }
    status.value = 'ready'
  } catch (error) {
    if (error?.response?.status === 404) {
      status.value = 'not-found'
      errorMessage.value = '게시글을 찾을 수 없습니다.'
    } else {
      status.value = 'error'
      errorMessage.value = '게시글을 불러오지 못했습니다.'
    }
    post.value = null
  }
}

onMounted(() => {
  loadPost()
})

const openDeleteModal = () => {
  deletePassword.value = ''
  deleteError.value = ''
  deleteInfo.value = ''
  isModalOpen.value = true
}

const closeDeleteModal = () => {
  isModalOpen.value = false
  deletePassword.value = ''
  deleteError.value = ''
  deleteInfo.value = ''
}

const handleDeleteSubmit = () => {
  deleteError.value = ''
  deleteInfo.value = ''
  const trimmed = deletePassword.value.trim()
  if (trimmed.length < 4) {
    deleteError.value = '비밀번호는 4자 이상 입력해주세요.'
    return
  }
  if (trimmed.length > 20) {
    deleteError.value = '비밀번호는 20자 이내로 입력해주세요.'
    return
  }
  deleteInfo.value = '백엔드 연결 후 삭제됩니다.'
}

const goToBoard = () => {
  router.push('/board')
}

const goToEdit = () => {
  router.push(`/posts/${postId.value}/edit`)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}
</script>

<template>
  <section class="page post-detail-view">
    <div class="detail-container">
      <nav class="breadcrumb">
        <router-link to="/">홈</router-link>
        <span>›</span>
        <router-link to="/board">게시판</router-link>
        <span>›</span>
        <span>게시글 상세</span>
      </nav>

      <template v-if="status === 'loading'">
        <div class="empty-card">
          <p>게시글을 불러오는 중입니다.</p>
        </div>
      </template>

      <template v-else-if="status === 'error'">
        <div class="empty-card">
          <p>{{ errorMessage }}</p>
          <button type="button" class="button-secondary" @click="goToBoard">게시판으로 돌아가기</button>
        </div>
      </template>

      <template v-else-if="status === 'ready' && post">
        <article class="post-card">
          <div class="post-header">
            <div>
              <h1>{{ post.title }}</h1>
              <div class="meta-row">
                <span class="badge">{{ post.category }}</span>
                <span>· {{ formatDate(post.created_at) }}</span>
                <span>· 조회수 {{ post.view_count }}</span>
              </div>
            </div>
            <LikeButton
              :post-id="post.id"
              :initial-count="post.like_count"
              :initial-liked="post.liked"
            />
          </div>

          <div class="tag-row">
            <button v-for="tag in post.custom_tags" :key="tag" type="button" class="tag-pill">
              #{{ tag }}
            </button>
          </div>

          <div class="post-content">{{ formattedContent }}</div>

          <div class="detail-actions">
            <button type="button" class="button-secondary" @click="goToBoard">목록</button>
            <button type="button" class="button-secondary" @click="goToEdit">수정</button>
            <button type="button" class="button-danger" @click="openDeleteModal">삭제</button>
          </div>
        </article>
      </template>

      <template v-else>
        <div class="empty-card">
          <p>게시글을 찾을 수 없습니다.</p>
          <button type="button" class="button-secondary" @click="goToBoard">게시판으로 돌아가기</button>
        </div>
      </template>

      <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeDeleteModal">
        <div class="modal-card">
          <h2>게시글 삭제</h2>
          <p>게시글 작성 시 설정한 비밀번호를 입력해주세요.</p>
          <input
            type="password"
            v-model="deletePassword"
            placeholder="비밀번호 입력"
            maxlength="20"
          />
          <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
          <p v-if="deleteInfo" class="modal-info">{{ deleteInfo }}</p>
          <div class="modal-actions">
            <button type="button" class="button-secondary" @click="closeDeleteModal">취소</button>
            <button type="button" class="button-danger" @click="handleDeleteSubmit">삭제</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.post-detail-view {
  display: flex;
  justify-content: center;
  padding: 1.5rem 1rem;
}

.detail-container {
  width: 100%;
  max-width: 980px;
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-muted);
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.breadcrumb a {
  color: var(--color-primary);
  text-decoration: none;
}

.post-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.post-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

.post-header h1 {
  margin: 0;
  font-size: 1.8rem;
  line-height: 1.3;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.85rem;
  color: var(--color-muted);
  font-size: 0.95rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: rgba(14, 118, 255, 0.12);
  color: var(--color-primary);
  font-size: 0.88rem;
  font-weight: 700;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1.25rem 0 1rem;
}

.tag-pill {
  border: none;
  background: rgba(14, 118, 255, 0.12);
  color: var(--color-primary);
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  font-size: 0.9rem;
  cursor: default;
}

.post-content {
  white-space: pre-wrap;
  line-height: 1.9;
  color: var(--color-text);
  font-size: 1rem;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.button-secondary,
.button-danger {
  border: 1px solid transparent;
  border-radius: 0.75rem;
  padding: 0.85rem 1.2rem;
  font-weight: 700;
  cursor: pointer;
}

.button-secondary {
  background: #fff;
  color: var(--color-text);
  border-color: var(--color-border);
}

.button-secondary:hover {
  background: #f8fafc;
}

.button-danger {
  background: #ff5c5c;
  color: #fff;
}

.button-danger:hover {
  background: #e04747;
}

.empty-card {
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  background: #fff;
}

.empty-card p {
  margin: 0 0 1rem;
  font-size: 1rem;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 20;
}

.modal-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.16);
}

.modal-card h2 {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
}

.modal-card p {
  margin: 0 0 1rem;
  color: var(--color-muted);
  line-height: 1.6;
}

.modal-card input {
  width: 100%;
  height: 44px;
  padding: 0 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  margin-bottom: 0.75rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modal-error {
  margin: 0 0 0.75rem;
  color: #d14343;
  font-size: 0.9rem;
}

.modal-info {
  margin: 0 0 0.75rem;
  color: var(--color-muted);
  font-size: 0.92rem;
}

@media (max-width: 720px) {
  .post-card {
    padding: 1.2rem;
  }

  .post-header {
    flex-direction: column;
  }

  .detail-actions {
    justify-content: stretch;
  }

  .button-secondary,
  .button-danger {
    width: 100%;
  }
}
</style>
