<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PostForm from '../components/post/PostForm.vue'
import { getPostById, updatePost } from '../services/postService.js'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const errorMessage = ref('')
const loading = ref(false)

const postId = ref(Number(route.params.id ?? 0))
const post = ref(null)

const loadPost = async () => {
  loading.value = true
  errorMessage.value = ''
  post.value = null

  try {
    const result = await getPostById(postId.value)
    post.value = {
      ...result,
      custom_tags: result.custom_tags ?? [],
      location_id: result.location_id ?? null,
    }
  } catch (error) {
    if (error?.response?.status === 404) {
      errorMessage.value = '게시글을 찾을 수 없습니다.'
    } else {
      errorMessage.value = '게시글을 불러오지 못했습니다.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPost()
})

const handleSubmit = async (postData) => {
  if (submitting.value) return

  submitting.value = true
  errorMessage.value = ''

  try {
    await updatePost(postId.value, postData)
    router.push(`/posts/${postId.value}`)
  } catch (error) {
    const status = error?.response?.status
    if (status === 403) {
      errorMessage.value = '비밀번호가 일치하지 않습니다.'
    } else if (status === 404) {
      errorMessage.value = '게시글을 찾을 수 없습니다.'
    } else if (status === 422) {
      errorMessage.value = '입력 내용을 다시 확인해주세요.'
    } else {
      errorMessage.value = '게시글을 수정하지 못했습니다.'
    }
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.push(post.value ? `/posts/${postId.value}` : '/board')
}
</script>

<template>
  <section class="page post-form-view">
    <div class="form-page-container">
      <nav class="breadcrumb">
        <router-link to="/">홈</router-link>
        <span>›</span>
        <router-link to="/board">게시판</router-link>
        <span>›</span>
        <span>게시글 수정</span>
      </nav>

      <div class="page-title-row">
        <h1>게시글 수정</h1>
      </div>

      <template v-if="loading">
        <div class="empty-card">
          <p>게시글을 불러오는 중입니다.</p>
        </div>
      </template>

      <template v-else-if="post">
        <PostForm
          mode="edit"
          :initialPost="post"
          :submitting="submitting"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
        <p v-if="errorMessage" class="submission-error">{{ errorMessage }}</p>
      </template>

      <template v-else>
        <div class="empty-card">
          <p>{{ errorMessage || '게시글을 찾을 수 없습니다.' }}</p>
          <button type="button" class="button-secondary" @click="handleCancel">
            게시판으로 돌아가기
          </button>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.post-form-view {
  display: flex;
  justify-content: center;
  padding: 1.5rem 1rem;
}

.form-page-container {
  width: 100%;
  max-width: 980px;
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.88rem;
  margin-bottom: 0.95rem;
}

.breadcrumb a {
  color: var(--color-primary);
  text-decoration: none;
}

.breadcrumb a:hover {
  color: var(--color-primary-hover);
}

.page-title-row {
  margin-bottom: 1.15rem;
}

.page-title-row h1 {
  margin: 0;
  color: #111827;
  font-size: clamp(1.7rem, 2.8vw, 2rem);
  font-weight: 700;
}

.submission-error {
  margin-top: 1rem;
  color: #d14343;
  font-weight: 700;
}

.empty-card {
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.empty-card p {
  margin: 0 0 1rem;
  color: var(--color-text);
}

.button-secondary {
  min-width: 120px;
  height: 44px;
  padding: 0 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 11px;
  background: #fff;
  color: var(--color-text);
  cursor: pointer;
}

.button-secondary:hover {
  background: #fff7ed;
}
</style>
