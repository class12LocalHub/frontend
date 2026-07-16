<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PostForm from '../components/post/PostForm.vue'
import { createPost } from '../services/postService.js'

const router = useRouter()
const route = useRoute()
const submitting = ref(false)
const infoMessage = ref('')
const errorMessage = ref('')

const initialPost = computed(() => {
  const category = route.query.category
  return category ? { category } : {}
})

const handleSubmit = async (postData) => {
  if (submitting.value) return

  submitting.value = true
  infoMessage.value = ''
  errorMessage.value = ''

  try {
    const result = await createPost(postData)
    router.push(`/posts/${result.post.id}`)
  } catch (error) {
    const detailMessage = error?.response?.data?.detail?.message
    const status = error?.response?.status

    if (status === 422) {
      errorMessage.value = '입력 내용을 다시 확인해주세요.'
    } else if (detailMessage) {
      errorMessage.value = detailMessage
    } else {
      errorMessage.value = '게시글을 등록하지 못했습니다.'
    }
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.push('/board')
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
        <span>게시글 작성</span>
      </nav>

      <div class="page-title-row">
        <h1>게시글 작성</h1>
      </div>

      <PostForm mode="create" :initialPost="initialPost" :submitting="submitting" @submit="handleSubmit" @cancel="handleCancel" />

      <p v-if="errorMessage" class="submission-error">{{ errorMessage }}</p>
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

.submission-info {
  margin-top: 1rem;
  color: var(--color-primary);
  font-weight: 700;
}

.submission-error {
  margin-top: 1rem;
  color: #d14343;
  font-weight: 700;
}
</style>
