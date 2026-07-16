<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CategoryFilter from '../components/board/CategoryFilter.vue'
import PostSearchBar from '../components/board/PostSearchBar.vue'
import PostTable from '../components/board/PostTable.vue'
import PaginationBar from '../components/board/PaginationBar.vue'
import { getPosts } from '../services/postService.js'
import { toApiCategory } from '../utils/categoryConverter.js'

const router = useRouter()
const route = useRoute()
const categories = ['전체', '관광지', '레포츠', '문화시설', '쇼핑', '숙박', '여행코스', '축제/공연행사']

const selectedCategory = ref('전체')
const searchQuery = ref('')
const currentPage = ref(1)

const posts = ref([])
const loading = ref(false)
const error = ref(null)
const pagination = ref({
  total: 0,
  page: 1,
  size: 10,
  total_pages: 0,
})

const totalPages = computed(() => pagination.value.total_pages || 0)

const normalizeCategoryQuery = (value) => {
  const category = String(value ?? '').trim()
  return categories.includes(category) ? category : '전체'
}

const loadPosts = async (page = 1) => {
  loading.value = true
  error.value = null

  try {
    const params = {
      page,
      size: 10,
      ...(selectedCategory.value !== '전체' ? { category: toApiCategory(selectedCategory.value) } : {}),
      ...(searchQuery.value.trim() ? { keyword: searchQuery.value.trim() } : {}),
    }

    const result = await getPosts(params)

    posts.value = result.items ?? []
    pagination.value = {
      total: result.total ?? 0,
      page: result.page ?? 1,
      size: result.size ?? 10,
      total_pages: result.total_pages ?? 0,
    }
    currentPage.value = result.page ?? page
  } catch (err) {
    console.error(err)
    error.value = '게시글을 불러오지 못했습니다.'
    posts.value = []
    pagination.value = {
      total: 0,
      page: 1,
      size: 10,
      total_pages: 0,
    }
  } finally {
    loading.value = false
  }
}

const handleSearchQueryUpdate = (value) => {
  searchQuery.value = value
}

const handleSearch = () => {
  currentPage.value = 1
  loadPosts(1)
}

const handleCategoryChange = (category) => {
  const nextCategory = normalizeCategoryQuery(category)
  router.push({
    path: '/board',
    query: nextCategory === '전체' ? {} : { category: nextCategory },
  })
}

const handlePageChange = (page) => {
  loadPosts(page)
}

const goToCreate = () => {
  router.push('/posts/create')
}

watch(
  () => route.query.category,
  (category) => {
    const nextCategory = normalizeCategoryQuery(category)
    selectedCategory.value = nextCategory
    currentPage.value = 1
    loadPosts(1)
  },
  { immediate: true },
)
</script>

<template>
  <section class="page board-list-view">
    <div class="board-controls">
      <header class="board-header">
        <div class="board-header-text">
          <h1 class="page-title">게시판</h1>
          <p class="page-description">서울 여행 정보와 꿀팁을 공유하고 편하게 찾아보세요.</p>
        </div>
      </header>

      <div class="board-action-row">
        <div class="filter-row">
          <CategoryFilter
            :categories="categories"
            :selectedCategory="selectedCategory"
            @update:selected="handleCategoryChange"
          />
        </div>

        <div class="search-row">
          <PostSearchBar
            :search-query="searchQuery"
            @update:search="handleSearchQueryUpdate"
            @search="handleSearch"
          />
        </div>
      </div>
    </div>

    <div class="board-list">
  <template v-if="loading">
    <div class="empty-state">게시글을 불러오는 중입니다...</div>
  </template>

  <template v-else-if="error">
    <div class="empty-state">{{ error }}</div>
  </template>

  <template v-else-if="posts.length">
    <PostTable :posts="posts" />
  </template>

  <template v-else>
    <div class="empty-state">등록된 게시글이 없습니다.</div>
  </template>
</div>

    <div class="board-footer">
      <PaginationBar
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @change:page="handlePageChange"
      />

      <button type="button" class="write-button" @click="goToCreate">글쓰기</button>
    </div>
  </section>
</template>

<style scoped>
.write-button {
  height: 40px;
  min-width: 84px;
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.92rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.write-button:hover {
  background: var(--color-primary-hover);
}

.board-controls {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex-wrap: wrap;
  box-sizing: border-box;
  margin-bottom: 20px;
}

.board-header-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  gap: 6px;
  flex: 1 1 auto;
}

.board-header-text .page-title {
  margin: 0;
}

.board-header-text .page-description {
  margin: 0;
}

.board-action-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  flex-wrap: wrap;
}

.filter-row {
  flex: 1 1 0;
  min-width: 0;
  width: 100%;
}

.search-row {
  flex: 0 1 320px;
  min-width: 0;
  width: 100%;
}

.board-list {
  min-height: 260px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.empty-state {
  padding: 1.5rem;
  text-align: center;
  color: var(--color-muted);
  background: #fff;
}

.board-footer {
  position: relative;
  margin-top: 1rem;
  min-height: 40px;
}

.board-footer :deep(.pagination-bar) {
  justify-content: center;
}

.board-footer .write-button {
  position: absolute;
  top: 0;
  right: 0;
}

@media (min-width: 1101px) {
  .board-action-row {
    flex-wrap: nowrap;
  }

  .filter-row {
    width: auto;
  }

  .search-row {
    flex: 0 0 320px;
    width: auto;
  }
}

@media (max-width: 1100px) {
  .board-header {
    align-items: flex-start;
  }

  .board-action-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-row,
  .search-row {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .board-controls {
    gap: 0.75rem;
  }

  .board-header {
    gap: 0.75rem;
  }

  .board-action-row {
    gap: 0.75rem;
  }

  .board-footer {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    min-height: 0;
  }

  .board-footer .write-button {
    position: static;
    align-self: flex-end;
  }
}

@media (max-width: 640px) {
  .board-header {
    gap: 0.75rem;
  }

  .board-footer .write-button {
    width: 100%;
    align-self: stretch;
  }
}
</style>
