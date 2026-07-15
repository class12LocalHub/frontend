<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PostForm from '../components/post/PostForm.vue'
import { createPost } from '../services/postService.js'

const router = useRouter()
const submitting = ref(false)
const infoMessage = ref('')
const errorMessage = ref('')

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

      <PostForm mode="create" :submitting="submitting" @submit="handleSubmit" @cancel="handleCancel" />

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
  color: var(--color-muted);
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.breadcrumb a {
  color: var(--color-primary);
  text-decoration: none;
}

.page-title-row {
  margin-bottom: 1.25rem;
}

.page-title-row h1 {
  margin: 0;
  font-size: 1.8rem;
}

.submission-info {
  margin-top: 1rem;
  color: var(--color-primary);
  font-weight: 700;
}
</style>
