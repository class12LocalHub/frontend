<script setup>
const props = defineProps({
  searchQuery: String,
})

const emit = defineEmits(['update:search', 'search'])

const handleSearch = () => {
  emit('search')
}
</script>

<template>
  <form class="search-bar" @submit.prevent="handleSearch">
    <input
      type="text"
      :value="searchQuery"
      @input="$emit('update:search', $event.target.value)"
      @keydown.enter.prevent="handleSearch"
      placeholder="제목 또는 내용을 검색하세요."
    />
    <button type="submit">검색</button>
  </form>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  align-items: center;
  flex-wrap: nowrap;
  min-width: 0;
}

.search-bar input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 0.95rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
  font-size: 0.95rem;
}

.search-bar button {
  width: 68px;
  min-width: 68px;
  flex-shrink: 0;
  height: 40px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 640px) {
  .search-bar {
    width: 100%;
  }
}
</style>
