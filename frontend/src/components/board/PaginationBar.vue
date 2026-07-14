<script setup>
import { computed } from 'vue'
const props = defineProps({
  currentPage: Number,
  totalPages: Number,
})

const emit = defineEmits(['change:page'])

const pages = computed(() => Array.from({ length: Math.max(0, props.totalPages) }, (_, i) => i + 1))

const changePage = (page) => {
  if (page < 1 || page > props.totalPages) return
  emit('change:page', page)
}
</script>

<template>
  <div class="pagination-bar">
    <button type="button" :disabled="props.currentPage === 1" @click="changePage(props.currentPage - 1)">
      ◀
    </button>

    <div class="pagination-pages">
      <button
        v-for="page in pages"
        :key="page"
        type="button"
        :class="['pagination-page', { active: page === props.currentPage }]"
        @click="changePage(page)"
      >
        {{ page }}
      </button>
    </div>

    <button type="button" :disabled="props.currentPage === props.totalPages" @click="changePage(props.currentPage + 1)">
      ▶
    </button>
  </div>
</template>

<style scoped>
.pagination-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 1.2rem;
}

.pagination-bar button {
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: #fff;
  color: var(--color-text);
  padding: 0.55rem 0.75rem;
  font-size: 0.92rem;
  cursor: pointer;
  min-width: 2.4rem;
}

.pagination-bar button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pagination-page.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
</style>
