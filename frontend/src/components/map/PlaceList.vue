<script setup>
import { RouterLink } from 'vue-router'
const props = defineProps({
  places: Array,
  selectedPlaceId: Number,
})

const emit = defineEmits(['select-place'])
</script>

<template>
  <aside class="place-list">
    <div class="place-list__header">
      <h3>장소 목록</h3>
    </div>

    <ul>
      <li
        v-for="place in places"
        :key="place.id"
        :class="['place-item', { active: place.id === selectedPlaceId }]"
      >
        <button type="button" class="place-item__button" @click="$emit('select-place', place)">
          <div>
            <strong>{{ place.name }}</strong>
            <p class="place-item__category">{{ place.category }}</p>
          </div>
          <p class="place-item__address">{{ place.address }}</p>
        </button>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.place-list {
  width: 100%;
  max-width: 100%;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  box-shadow: 0 15px 30px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
}

.place-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex: 0 0 auto;
}

.place-list__header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.place-list ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  flex: 1 1 auto;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.place-item {
  border: 1px solid #e5e7eb;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: #fff;
}

@media (max-width: 900px) {
  .place-list ul {
    grid-template-columns: 1fr;
  }
}

.place-item.active {
  border-color: #c2410c;
}

.place-item__button {
  width: 100%;
  padding: 0.9rem;
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
}

.place-item:hover {
  background: #fff7ed;
  border-color: #fdba74;
}

.place-item__button strong {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 1rem;
  color: #111827;
}

.place-item__button p {
  margin: 0;
  font-size: 0.94rem;
}

.place-item__category {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  border: 1px solid #fdba74;
  border-radius: 9999px;
  background: #fff7ed;
  color: #ea580c;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.2;
  padding: 0.15rem 0.5rem;
}

.place-item__address {
  margin-top: 0.65rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  .place-list {
    max-width: 100%;
  }
}
</style>
