<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
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

// 자연스러운 무한 롤링을 위해 3세트를 연결합니다.
const clonedCategories = computed(() => {
  return [...categories, ...categories, ...categories]
})

const cardsToShow = ref(4)

const getCardsToShow = () => {
  if (typeof window === 'undefined') return 4
  if (window.innerWidth <= 640) return 1.2
  if (window.innerWidth <= 900) return 2.2
  return 4
}

const updateCardsToShow = () => {
  cardsToShow.value = getCardsToShow()
}

// ◀ 왼쪽 버튼 클릭 시 부드럽게 왼쪽으로 밀어주기
const prevSlide = () => {
  const container = document.querySelector('.slider-container')
  if (container) {
    container.scrollBy({
      left: -300,
      behavior: 'smooth'
    })
  }
}

// ▶ 오른쪽 버튼 클릭 시 부드럽게 오른쪽으로 밀어주기
const nextSlide = () => {
  const container = document.querySelector('.slider-container')
  if (container) {
    container.scrollBy({
      left: 300,
      behavior: 'smooth'
    })
  }
}

onMounted(() => {
  updateCardsToShow()
  window.addEventListener('resize', updateCardsToShow)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCardsToShow)
})
</script>

<template>
  <section class="category-section">
    <div class="section-header">
      <h2>카테고리 바로가기</h2>
      <div class="slider-controls">
        <button class="control-btn" @click="prevSlide" aria-label="이전 카테고리">◀</button>
        <button class="control-btn" @click="nextSlide" aria-label="다음 카테고리">▶</button>
      </div>
    </div>

    <div class="slider-container">
      <div 
        class="slider-track"
        :style="{
          '--orig-count': categories.length,
          '--cards-to-show': cardsToShow
        }"
      >
        <RouterLink
          v-for="(category, index) in clonedCategories"
          :key="`${category.id}-${index}`"
          :to="{ path: '/map', query: { category: category.id } }"
          class="category-card"
          :style="{ width: `${100 / (cardsToShow * 3)}%` }"
        >
          <div class="category-card__inner">
            <div class="category-card__icon">{{ category.icon }}</div>
            <h3>{{ category.name }}</h3>
            <p>{{ category.description }}</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.category-section {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.slider-controls {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  background: #fafafa;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 2.2rem;
  height: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--color-text);
  transition: background 200ms, transform 150ms;
}

.control-btn:hover {
  background: #f0f0f0;
  transform: scale(1.05);
}

.control-btn:active {
  transform: scale(0.95);
}

/* 스크롤바 감추고 수평 정렬을 유지하는 뷰포트 */
.slider-container {
  width: 100%;
  overflow-x: auto;
  position: relative;
  scroll-behavior: smooth;
  cursor: grab;
  scrollbar-width: none; /* Firefox 스크롤바 제거 */
  -ms-overflow-style: none; /* IE 스크롤바 제거 */
}

.slider-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera 스크롤바 제거 */
}

.slider-container:active {
  cursor: grabbing;
}

/* 💡 무한 롤링 핵심 레일 (Marquee)
  - linear 타이밍 함수를 활용하여 덜컹거림 없이 등속도로 끝없이 이동시킵니다.
  - width는 복제본을 감안해 300%로 지정합니다.
*/
.slider-track {
  display: flex;
  width: 300%; 
  /* 30초 동안 한 바퀴를 돕니다. 너무 빠르거나 느리다면 조절하세요. */
  animation: continuousScroll 30s linear infinite;
}

/* 💡 마우스를 슬라이더 위에 올렸을 때(Hover) 흐름을 일시 정지하는 세심한 기능 */
.slider-container:hover .slider-track {
  animation-play-state: paused;
}

.category-card {
  flex-shrink: 0;
  padding: 0 0.5rem;
  text-decoration: none;
  color: var(--color-text);
  box-sizing: border-box;
}

/* 이전 버전의 카드 크기와 스타일 비율을 완벽히 복원 */
.category-card__inner {
  display: block;
  padding: 1.2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fafafa;
  transition: transform 200ms ease, box-shadow 200ms ease;
  height: 100%;
}

.category-card:hover .category-card__inner {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
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

/* 💡 무한 롤링 루프 키프레임
  전체 트랙 넓이 300% 중, 정확히 원본 1세트 넓이(100% / 3 = -33.3333%)만큼 이동했을 때 
  0% 위치로 순식간에 루프하여 사용자 눈에는 끊임없이 이어지는 것처럼 보이게 합니다.
*/
@keyframes continuousScroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-33.3333%);
  }
}
</style>