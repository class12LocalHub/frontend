<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CategoryFilter from '../components/board/CategoryFilter.vue'
import PostSearchBar from '../components/board/PostSearchBar.vue'
import PostTable from '../components/board/PostTable.vue'
import PaginationBar from '../components/board/PaginationBar.vue'
import { getPosts } from '../services/postService.js'

const router = useRouter()
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

const loadPosts = async (page = 1) => {
  loading.value = true
  error.value = null

  try {
    const params = {
      page,
      size: 10,
      ...(selectedCategory.value !== '전체' ? { category: selectedCategory.value } : {}),
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

onMounted(() => {
  loadPosts(1)
})

const handleSearchQueryUpdate = (value) => {
  searchQuery.value = value
}

const handleSearch = () => {
  currentPage.value = 1
  loadPosts(1)
}

const handleCategoryChange = (category) => {
  selectedCategory.value = category
  currentPage.value = 1
  loadPosts(1)
}

const handlePageChange = (page) => {
  loadPosts(page)
}

const goToCreate = () => {
  router.push('/posts/create')
}
</script>

<template>
  <section class="page board-list-view">
    <div class="board-controls">
      <div class="board-header-row">
        <div class="board-title-group">
          <h1>게시판</h1>
          <p class="board-description">서울 여행 정보와 꿀팁을 공유하고 편하게 찾아보세요.</p>
        </div>
        <button type="button" class="write-button" @click="goToCreate">글쓰기</button>
      </div>

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

<PaginationBar
  v-if="totalPages > 1"
  :current-page="currentPage"
  :total-pages="totalPages"
  @change:page="handlePageChange"
/>
  </section>
</template>

<style scoped>
.board-header {
  display: none;
}

.write-button {
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 0.75rem;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.92rem;
  flex-shrink: 0;
}

.board-controls {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.board-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex-wrap: wrap;
  box-sizing: border-box;
}

.board-title-group h1 {
  margin: 0 0 0.3rem;
  font-size: 1.4rem;
}

.board-description {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.95rem;
  line-height: 1.5;
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
}

.empty-state {
  padding: 1.5rem;
  text-align: center;
  color: var(--color-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: #f8fafc;
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

  .board-header-row {
    gap: 0.75rem;
  }

  .board-title-group h1 {
    font-size: 1.25rem;
  }

  .board-action-row {
    gap: 0.75rem;
  }
}
</style>
