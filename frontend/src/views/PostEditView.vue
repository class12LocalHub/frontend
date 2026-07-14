<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PostForm from '../components/post/PostForm.vue'
import { posts } from '../data/mockPosts.js'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const infoMessage = ref('')

const postId = Number(route.params.id ?? 0)
const post = computed(() => posts.find((item) => item.id === postId))

const handleSubmit = (postData) => {
  submitting.value = true
  infoMessage.value = '게시글 수정 API 연결 전입니다.'
  // TODO: 백엔드 연결 후 updatePost(postId, postData) 호출
  setTimeout(() => {
    submitting.value = false
  }, 500)
}

const handleCancel = () => {
  router.push(post.value ? `/posts/${postId}` : '/board')
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

      <template v-if="post">
        <PostForm
          mode="edit"
          :initialPost="post"
          :submitting="submitting"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
        <p v-if="infoMessage" class="submission-info">{{ infoMessage }}</p>
      </template>

      <template v-else>
        <div class="empty-card">
          <p>게시글을 찾을 수 없습니다.</p>
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

.empty-card {
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: #fff;
}

.empty-card p {
  margin: 0 0 1rem;
  color: var(--color-text);
}

.button-secondary {
  min-width: 120px;
  height: 44px;
  padding: 0 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.85rem;
  background: #fff;
  color: var(--color-text);
  cursor: pointer;
}
</style>
