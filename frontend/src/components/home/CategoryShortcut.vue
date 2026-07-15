<script setup>
import { RouterLink } from 'vue-router'

const categories = [
  { id: 'tourist', name: '관광지', icon: '🏛️', description: '인기 명소와 추천 여행지를 둘러보세요.' },
  { id: 'leisure', name: '레포츠', icon: '🚴', description: '야외 활동과 액티비티 정보를 확인하세요.' },
  { id: 'culture', name: '문화시설', icon: '🎨', description: '전시와 문화 공간을 빠르게 찾아보세요.' },
  { id: 'shopping', name: '쇼핑', icon: '🛍️', description: '핫플 상권과 쇼핑 포인트를 탐색해보세요.' },
  { id: 'accommodation', name: '숙박', icon: '🏨', description: '지역 숙소 정보를 한눈에 확인하세요.' },
  { id: 'course', name: '여행코스', icon: '🗺️', description: '효율적인 일정 코스를 만들어보세요.' },
  { id: 'festival', name: '축제/공연행사', icon: '🎭', description: '다가오는 행사를 미리 확인해보세요.' },
]
</script>

<template>
  <section class="category-section">
    <div class="section-title">
      <h2>카테고리 바로가기</h2>
    </div>

    <div class="category-grid">
      <RouterLink
        v-for="(category, index) in categories"
        :key="category.id"
        :to="{ path: '/map', query: { category: category.id } }"
        class="category-card enter-card"
        :style="{ '--ci': index }"
      >
        <div class="category-card__icon">{{ category.icon }}</div>
        <h3>{{ category.name }}</h3>
        <p>{{ category.description }}</p>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.category-section {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.section-title h2 {
  margin: 0 0 1rem;
  font-size: 1.2rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.category-card {
  display: block;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text);
  background: #fafafa;
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.category-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
}

.enter-card {
  animation: cardUp 480ms ease-out both;
  animation-delay: calc(var(--ci, 0) * 55ms);
}

@keyframes cardUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .enter-card {
    animation: none;
  }
}

.category-card__icon {
  font-size: 1.5rem;
  margin-bottom: 0.6rem;
}

.category-card h3 {
  margin: 0 0 0.3rem;
  font-size: 1rem;
}

.category-card p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-muted);
  line-height: 1.5;
}

@media (max-width: 900px) {
  .category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
}
</style>
