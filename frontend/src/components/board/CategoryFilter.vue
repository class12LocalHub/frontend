<script setup>
const props = defineProps({
  categories: Array,
  selectedCategory: String,
})

const emit = defineEmits(['update:selected'])
</script>

<template>
  <div class="category-filter">
    <button
      v-for="category in categories"
      :key="category"
      type="button"
      :class="['category-filter__button', { active: category === selectedCategory }]"
      @click="$emit('update:selected', category)"
    >
      {{ category }}
    </button>
  </div>
</template>

<style scoped>
.category-filter {
  display: flex;
  gap: 0.35rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  min-width: 0;
  width: 100%;
  -webkit-overflow-scrolling: touch;
}

.category-filter__button {
  flex: 0 0 auto;
  height: 38px;
  padding: 0 0.9rem;
  font-size: 0.86rem;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  background: #fff;
  color: #374151;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@media (min-width: 1101px) {
  .category-filter {
    overflow-x: hidden;
  }

  .category-filter::-webkit-scrollbar {
    display: none;
  }
}

.category-filter__button.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.category-filter__button:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
