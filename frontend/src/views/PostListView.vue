<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCategories } from '../api/categories'
import { getPosts } from '../api/posts'
import EmptyState from '../components/common/EmptyState.vue'
import ErrorState from '../components/common/ErrorState.vue'
import LoadingState from '../components/common/LoadingState.vue'
import PageLayout from '../components/layout/PageLayout.vue'
import { getApiErrorMessage } from '../utils/api'

const route = useRoute()
const router = useRouter()
const posts = ref([])
const categories = ref([])
const pagination = reactive({ total: 0, page: 1, size: 10, totalPages: 0 })
const filters = reactive({ keyword: '', category: '' })
const loading = ref(true)
const errorMessage = ref('')

function syncFilters() {
  filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  filters.category = typeof route.query.category === 'string' ? route.query.category : ''
}

async function loadPosts() {
  syncFilters()
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getPosts({
      keyword: route.query.keyword,
      category: route.query.category,
      location_id: route.query.location_id,
      page: route.query.page,
      size: 10,
    })
    posts.value = response.data.items
    pagination.total = response.data.total
    pagination.page = response.data.page
    pagination.size = response.data.size
    pagination.totalPages = response.data.total_pages
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, '게시글 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const response = await getCategories()
    categories.value = response.data.categories
  } catch {
    categories.value = []
  }
}

function searchPosts() {
  router.push({
    path: '/posts',
    query: {
      ...(filters.category && { category: filters.category }),
      ...(filters.keyword.trim() && { keyword: filters.keyword.trim() }),
      page: 1,
    },
  })
}

function changePage(page) {
  if (page < 1 || page > pagination.totalPages) return

  router.push({
    query: {
      ...route.query,
      page,
    },
  })
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value))
}

watch(
  () => [route.query.keyword, route.query.category, route.query.location_id, route.query.page],
  loadPosts,
  { immediate: true },
)

onMounted(loadCategories)
</script>

<template>
  <PageLayout title="지역 게시판" description="서울 지역의 장소와 경험을 공유합니다.">
    <template #actions>
      <RouterLink class="primary-button link-button" to="/posts/new">글쓰기</RouterLink>
    </template>

    <form class="filters" role="search" @submit.prevent="searchPosts">
      <label>
        <span>카테고리</span>
        <select v-model="filters.category">
          <option value="">전체</option>
          <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
        </select>
      </label>
      <label class="keyword-field">
        <span>검색어</span>
        <input v-model="filters.keyword" placeholder="제목 또는 내용 검색" />
      </label>
      <button class="secondary-button" type="submit">검색</button>
    </form>

    <LoadingState v-if="loading" message="게시글을 불러오는 중입니다." />
    <ErrorState v-else-if="errorMessage" :message="errorMessage" @retry="loadPosts" />
    <EmptyState
      v-else-if="posts.length === 0"
      title="게시글이 없습니다."
      description="첫 번째 지역 이야기를 작성해 보세요."
    >
      <RouterLink class="primary-button link-button empty-action" to="/posts/new">글쓰기</RouterLink>
    </EmptyState>
    <template v-else>
      <p class="result-count">총 {{ pagination.total.toLocaleString() }}개</p>
      <ul class="post-list">
        <li v-for="post in posts" :key="post.id">
          <RouterLink :to="`/posts/${post.id}`">
            <div class="post-meta">
              <span class="category">{{ post.category }}</span>
              <span>{{ formatDate(post.created_at) }}</span>
            </div>
            <h2>{{ post.title }}</h2>
            <div class="post-meta">
              <span>조회 {{ post.view_count.toLocaleString() }}</span>
              <span v-if="post.custom_tags.length">{{ post.custom_tags.join(' · ') }}</span>
            </div>
          </RouterLink>
        </li>
      </ul>

      <nav v-if="pagination.totalPages > 1" class="pagination" aria-label="게시글 페이지">
        <button class="secondary-button" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">
          이전
        </button>
        <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <button
          class="secondary-button"
          :disabled="pagination.page >= pagination.totalPages"
          @click="changePage(pagination.page + 1)"
        >
          다음
        </button>
      </nav>
    </template>
  </PageLayout>
</template>

<style scoped>
.filters {
  margin-bottom: 28px;
  padding: 18px;
  display: grid;
  grid-template-columns: minmax(150px, 220px) minmax(220px, 1fr) auto;
  align-items: end;
  gap: 12px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
}

.filters label {
  display: grid;
  gap: 6px;
}

.filters label span {
  color: #536074;
  font-size: 13px;
  font-weight: 700;
}

.result-count {
  margin: 0 0 12px;
  color: #647085;
  font-size: 14px;
}

.post-list {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
  list-style: none;
}

.post-list a {
  padding: 20px;
  display: grid;
  gap: 10px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
  color: #283347;
  text-decoration: none;
}

.post-list h2 {
  margin: 0;
  font-size: 18px;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #748095;
  font-size: 13px;
}

.category {
  color: #176b4d;
  font-weight: 800;
}

.pagination {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.empty-action {
  justify-self: center;
  margin-top: 10px;
}

@media (max-width: 700px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
