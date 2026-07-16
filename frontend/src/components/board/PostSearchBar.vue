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
  min-width: 200px;
  height: 40px;
  padding: 0 0.95rem;
  border: 1px solid #d1d5db;
  border-radius: 11px;
  background: #fff;
  font-size: 0.95rem;
}

.search-bar input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.15);
}

.search-bar button {
  width: 68px;
  min-width: 68px;
  flex-shrink: 0;
  height: 40px;
  border: none;
  border-radius: 11px;
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.search-bar button:hover {
  background: var(--color-primary-hover);
}

@media (max-width: 640px) {
  .search-bar {
    width: 100%;
  }
}
</style>
