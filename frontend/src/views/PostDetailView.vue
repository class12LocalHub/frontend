<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getPost } from '../api/posts'
import ErrorState from '../components/common/ErrorState.vue'
import LoadingState from '../components/common/LoadingState.vue'
import PageLayout from '../components/layout/PageLayout.vue'
import { getApiErrorMessage } from '../utils/api'
import { normalizeTourApiId } from '../utils/normalize'

const route = useRoute()
const post = ref(null)
const loading = ref(true)
const errorMessage = ref('')

async function loadPost() {
  const id = Number(route.params.id)
  if (!Number.isInteger(id) || id < 1) {
    loading.value = false
    errorMessage.value = '올바르지 않은 게시글 번호입니다.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPost(id)
    post.value = response.data
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, '게시글을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value))
}

watch(() => route.params.id, loadPost, { immediate: true })
</script>

<template>
  <PageLayout :title="post?.title || '게시글 상세'">
    <template v-if="post" #actions>
      <RouterLink class="secondary-button link-button" :to="`/posts/${post.id}/edit`">수정</RouterLink>
    </template>

    <LoadingState v-if="loading" message="게시글을 불러오는 중입니다." />
    <ErrorState v-else-if="errorMessage" :message="errorMessage" @retry="loadPost" />
    <article v-else-if="post" class="post-detail">
      <div class="metadata">
        <span class="category">{{ post.category }}</span>
        <span>조회 {{ post.view_count.toLocaleString() }}</span>
        <time :datetime="post.created_at">{{ formatDate(post.created_at) }}</time>
      </div>

      <img v-if="post.image_url" class="post-image" :src="post.image_url" :alt="`${post.title} 첨부 이미지`" />
      <p class="content">{{ post.content }}</p>

      <div v-if="post.custom_tags.length" class="tags">
        <span v-for="tag in post.custom_tags" :key="tag">#{{ tag }}</span>
      </div>

      <RouterLink
        v-if="post.location"
        class="location"
        :to="{ path: '/map', query: { poiId: normalizeTourApiId(post.location.source_id) } }"
      >
        <strong>{{ post.location.name }}</strong>
        <span>{{ post.location.address || '주소 정보 없음' }}</span>
      </RouterLink>

      <div class="bottom-actions">
        <RouterLink class="secondary-button link-button" to="/posts">목록으로</RouterLink>
      </div>
    </article>
  </PageLayout>
</template>

<style scoped>
.post-detail {
  padding: 28px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
}

.metadata,
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #748095;
  font-size: 13px;
}

.category,
.tags span {
  color: #176b4d;
  font-weight: 800;
}

.post-image {
  width: 100%;
  max-height: 520px;
  margin-top: 24px;
  object-fit: contain;
  border-radius: 6px;
  background: #f1f3f6;
}

.content {
  min-height: 180px;
  margin: 32px 0;
  color: #283347;
  line-height: 1.8;
  white-space: pre-wrap;
}

.location {
  margin-top: 24px;
  padding: 16px;
  display: grid;
  gap: 4px;
  border: 1px solid #c9d7d1;
  border-radius: 6px;
  background: #f1f8f5;
  color: #174f3d;
  text-decoration: none;
}

.location span {
  color: #58677a;
  font-size: 13px;
}

.bottom-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
}
</style>
