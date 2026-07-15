<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createPost } from '../api/posts'
import PageLayout from '../components/layout/PageLayout.vue'
import PostForm from '../components/posts/PostForm.vue'
import { getApiErrorMessage } from '../utils/api'

const router = useRouter()
const submitting = ref(false)
const errorMessage = ref('')

async function submitPost(payload) {
  submitting.value = true
  errorMessage.value = ''

  try {
    const response = await createPost(payload)
    await router.push(`/posts/${response.data.post.id}`)
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, '게시글을 등록하지 못했습니다.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <PageLayout title="게시글 작성" description="지역 경험과 장소 정보를 공유해 주세요.">
    <PostForm
      submit-label="등록"
      :submitting="submitting"
      :server-error="errorMessage"
      @submit="submitPost"
    />
  </PageLayout>
</template>
