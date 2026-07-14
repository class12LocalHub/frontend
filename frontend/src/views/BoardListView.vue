<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import CategoryFilter from '../components/board/CategoryFilter.vue'
import PostSearchBar from '../components/board/PostSearchBar.vue'
import PostTable from '../components/board/PostTable.vue'
import PaginationBar from '../components/board/PaginationBar.vue'
import { posts } from '../data/mockPosts.js'

const router = useRouter()
const categories = ['전체', '관광지', '레포츠', '문화시설', '쇼핑', '숙박', '여행코스', '축제/공연행사']
const selectedCategory = ref('전체')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 7

const filteredPosts = computed(() => {
  let filtered = posts

  if (selectedCategory.value !== '전체') {
    filtered = filtered.filter((post) => post.category === selectedCategory.value)
  }

  if (searchQuery.value.trim()) {
    const keyword = searchQuery.value.trim().toLowerCase()
    filtered = filtered.filter((post) => post.title.toLowerCase().includes(keyword))
  }

  return filtered
})

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredPosts.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.ceil(filteredPosts.value.length / pageSize))

const handleSearch = () => {
  currentPage.value = 1
}

const handleCategoryChange = (category) => {
  selectedCategory.value = category
  currentPage.value = 1
}

const handlePageChange = (page) => {
  currentPage.value = page
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
            :searchQuery="searchQuery"
            @update:search="(value) => (searchQuery.value = value)"
            @search="handleSearch"
          />
        </div>
      </div>
    </div>

    <div class="board-list">
      <template v-if="paginatedPosts.length">
        <PostTable :posts="paginatedPosts" />
      </template>
      <template v-else>
        <div class="empty-state">조건에 맞는 게시글이 없습니다.</div>
      </template>
    </div>

    <PaginationBar v-if="totalPages > 1" :currentPage="currentPage" :totalPages="totalPages" @change:page="handlePageChange" />
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
