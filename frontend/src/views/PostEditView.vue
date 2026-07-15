<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPost, updatePost } from '../api/posts'
import ErrorState from '../components/common/ErrorState.vue'
import LoadingState from '../components/common/LoadingState.vue'
import PageLayout from '../components/layout/PageLayout.vue'
import PostForm from '../components/posts/PostForm.vue'
import { getApiErrorMessage } from '../utils/api'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const loading = ref(true)
const submitting = ref(false)
const loadError = ref('')
const submitError = ref('')

async function loadPost() {
  const id = Number(route.params.id)
  if (!Number.isInteger(id) || id < 1) {
    loading.value = false
    loadError.value = '올바르지 않은 게시글 번호입니다.'
    return
  }

  loading.value = true
  loadError.value = ''

  try {
    const response = await getPost(id)
    post.value = response.data
  } catch (error) {
    loadError.value = getApiErrorMessage(error, '게시글을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

async function submitPost(payload) {
  submitting.value = true
  submitError.value = ''

  try {
    const response = await updatePost(route.params.id, payload)
    await router.push(`/posts/${response.data.post.id}`)
  } catch (error) {
    submitError.value = getApiErrorMessage(error, '게시글을 수정하지 못했습니다.')
  } finally {
    submitting.value = false
  }
}

watch(() => route.params.id, loadPost, { immediate: true })
</script>

<template>
  <PageLayout title="게시글 수정" description="비밀번호 확인 후 게시글을 수정합니다.">
    <LoadingState v-if="loading" message="게시글을 불러오는 중입니다." />
    <ErrorState v-else-if="loadError" :message="loadError" @retry="loadPost" />
    <PostForm
      v-else-if="post"
      :initial-post="post"
      submit-label="수정 완료"
      :submitting="submitting"
      :server-error="submitError"
      @submit="submitPost"
    />
  </PageLayout>
</template>
