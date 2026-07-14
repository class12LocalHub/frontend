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
      :class="['category-filter__button', { active: category === selectedCategory } ]"
      @click="$emit('update:selected', category)"
    >
      {{ category }}
    </button>
  </div>
</template>

<style scoped>
.category-filter {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-filter__button {
  width: 100%;
  text-align: left;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.category-filter__button:hover {
  border-color: var(--color-primary);
}

.category-filter__button.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

@media (max-width: 768px) {
  .category-filter {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .category-filter__button {
    flex: 0 0 auto;
    min-width: max-content;
    white-space: nowrap;
  }
}
</style>
