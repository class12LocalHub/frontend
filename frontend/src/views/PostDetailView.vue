<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deletePost, getPostById } from '../services/postService.js'
import { getLocationById } from '../services/locationsService.js'

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
const deleting = ref(false)

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

    // Initialize location data
    let locationData = result.location || null
    
    // If location object is not in response but location_id exists, fetch it
    if (!locationData && result.location_id) {
      try {
        locationData = await getLocationById(result.location_id)
      } catch (locationError) {
        console.warn('Failed to load location details:', locationError)
        // Continue without location data - don't break the whole post view
      }
    }

    // Set post with all data
    post.value = {
      ...result,
      custom_tags: result.custom_tags ?? [],
      location: locationData,
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

const handleDeleteSubmit = async () => {
  if (deleting.value) return

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

  deleting.value = true

  try {
    await deletePost(postId.value, trimmed)
    closeDeleteModal()
    router.push('/board')
  } catch (error) {
    const status = error?.response?.status
    if (status === 403) {
      deleteError.value = '비밀번호가 일치하지 않습니다.'
    } else if (status === 404) {
      deleteError.value = '게시글을 찾을 수 없습니다.'
    } else if (status === 422) {
      deleteError.value = '입력 내용을 다시 확인해주세요.'
    } else {
      deleteError.value = '게시글을 삭제하지 못했습니다.'
    }
  } finally {
    deleting.value = false
  }
}

const goToBoard = () => {
  router.push('/board')
}

const goToEdit = () => {
  router.push(`/posts/${postId.value}/edit`)
}

const goToLocation = () => {
  // Try to find location ID from multiple sources
  const locationId = post.value?.location_id || post.value?.location?.id
  
  if (!locationId) {
    return
  }
  
  router.push({
    path: '/map',
    query: { locationId: String(locationId) }
  })
}

const hasLocation = computed(() => {
  return Boolean(post.value?.location_id || post.value?.location?.id)
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const displayCategory = (category) => {
  if (category === '축제공연행사') return '축제/공연행사'
  return category || '기타'
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
                <span class="badge">{{ displayCategory(post.category) }}</span>
                <button 
                  v-if="hasLocation"
                  type="button"
                  class="location-badge" 
                  @click="goToLocation"
                >
                  📍 {{ post.location?.name || '장소 정보' }}
                </button>
                <span>· {{ formatDate(post.created_at) }}</span>
                <span>· 조회수 {{ post.view_count }}</span>
              </div>
            </div>
          </div>

          <div class="tag-row">
            <button v-for="tag in post.custom_tags" :key="tag" type="button" class="tag-pill">
              #{{ tag }}
            </button>
          </div>

          <div class="post-content">{{ formattedContent }}</div>

          <div class="detail-actions">
            <button type="button" class="button-list" @click="goToBoard">목록</button>
            <div class="action-buttons-group">
              <button type="button" class="button-edit" @click="goToEdit">수정</button>
              <button type="button" class="button-delete" @click="openDeleteModal">삭제</button>
            </div>
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
            <button type="button" class="button-secondary" @click="closeDeleteModal" :disabled="deleting">취소</button>
            <button type="button" class="button-danger" @click="handleDeleteSubmit" :disabled="deleting">
              {{ deleting ? '삭제 중...' : '삭제' }}
            </button>
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
  align-items: center;
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

.location-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  height: 28px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
  border: 1px solid transparent;
}

.location-badge:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.location-badge:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
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
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.action-buttons-group {
  display: flex;
  gap: 0.5rem;
}

.button-list,
.button-edit,
.button-delete {
  height: 38px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
  border: 1px solid transparent;
}

.button-list,
.button-edit {
  background: #fff;
  color: var(--color-text);
  border-color: var(--color-border);
}

.button-list:hover,
.button-edit:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.button-list:focus,
.button-edit:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.button-delete {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
  border-color: #fecaca;
}

.button-delete:hover {
  background: rgba(220, 38, 38, 0.15);
  border-color: #fca5a5;
}

.button-delete:focus {
  outline: 2px solid #dc2626;
  outline-offset: 2px;
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
    flex-wrap: wrap;
    justify-content: stretch;
    gap: 0.5rem;
  }

  .button-list {
    flex: 1;
    min-width: 80px;
  }

  .action-buttons-group {
    display: flex;
    gap: 0.5rem;
    flex: 1;
  }

  .button-edit,
  .button-delete {
    flex: 1;
    min-width: 70px;
  }
}
</style>
