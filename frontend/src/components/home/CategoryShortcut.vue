<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { RouterLink } from 'vue-router'

const categories = [
  { id: 'tourist', name: '관광지', icon: '🏛️' },
  { id: 'leisure', name: '레포츠', icon: '🚴' },
  { id: 'culture', name: '문화시설', icon: '🎨' },
  { id: 'shopping', name: '쇼핑', icon: '🛍️'  },
  { id: 'accommodation', name: '숙박', icon: '🏨' },
  { id: 'course', name: '여행코스', icon: '🗺️'  },
  { id: 'festival', name: '축제/공연행사', icon: '🎭'  },
]

const categoryImageMap = {
  tourist: '/categories/attraction.png',
  leisure: '/categories/leports.png',
  culture: '/categories/culture.png',
  shopping: '/categories/shopping.png',
  accommodation: '/categories/accommodation.png',
  course: '/categories/travel-course.png',
  festival: '/categories/festival.png',
}

const clonedCategories = computed(() => {
  return [...categories, ...categories, ...categories]
})

const cardsToShow = ref(4)
const sliderContainer = ref(null)

// 롤링 및 애니메이션 제어 상태 변수
let requestAnimationFrameId = null
const isHovering = ref(false)
const scrollSpeed = 0.8 // 자동 롤링 속도

// 버튼 클릭 시 목표 스크롤 지점을 추적하기 위한 변수들
let targetScrollLeft = null
const btnMoveSpeed = 0.15 // 버튼 클릭 시 부드럽게 미끄러지는 감도 (0에 가까울수록 부드럽고 천천히 멈춤)

const getCardsToShow = () => {
  if (typeof window === 'undefined') return 4
  if (window.innerWidth <= 640) return 1.2
  if (window.innerWidth <= 900) return 2.2
  return 4
}

const updateCardsToShow = () => {
  cardsToShow.value = getCardsToShow()
}

// 🔄 매 프레임마다 스크롤을 계산하고 렌더링하는 핵심 함수
const animateScroll = () => {
  const container = sliderContainer.value
  if (!container) return

  const originalWidth = container.scrollWidth / 3

  // 1. 버튼 클릭으로 인한 강제 스크롤 목적지(targetScrollLeft)가 있는 경우
  if (targetScrollLeft !== null) {
    // 감속 공식을 활용한 부드러운 목적지 스크롤 이동 (Lerp 기법)
    const diff = targetScrollLeft - container.scrollLeft
    if (Math.abs(diff) > 1) {
      container.scrollLeft += diff * btnMoveSpeed
    } else {
      container.scrollLeft = targetScrollLeft
      targetScrollLeft = null // 목적지에 완전히 도달하면 제어권을 다시 자동 롤링으로 인계
    }
  } 
  // 2. 평상시 자동 무한 롤링 상태 (마우스 호버가 아닐 때만 작동)
  else if (!isHovering.value) {
    container.scrollLeft += scrollSpeed
  }

  // 3. 무한 루프 워프 구간 설계
  // 3번째 세트로 넘어가면 2번째 세트의 원래 자리로 조용히 당겨옴
  if (container.scrollLeft >= originalWidth * 2) {
    container.scrollLeft -= originalWidth
    if (targetScrollLeft !== null) targetScrollLeft -= originalWidth
  } 
  // 1번째 세트의 시작점 밑으로 내려가면 다시 2번째 세트로 밀어줌
  else if (container.scrollLeft <= 0) {
    container.scrollLeft += originalWidth
    if (targetScrollLeft !== null) targetScrollLeft += originalWidth
  }

  // 다음 프레임 예약
  requestAnimationFrameId = requestAnimationFrame(animateScroll)
}

// ◀ 왼쪽 버튼 클릭: 현재 화면 크기에 비례해 좌측 카드 1칸 크기만큼 목적지 지정
const prevSlide = () => {
  const container = sliderContainer.value
  if (container) {
    const cardWidth = container.clientWidth / cardsToShow.value
    // 현재 스크롤 위치 기준으로 소수점 버그를 방지하며 목적지 계산
    const currentTarget = targetScrollLeft !== null ? targetScrollLeft : container.scrollLeft
    targetScrollLeft = currentTarget - cardWidth
  }
}

// ▶ 오른쪽 버튼 클릭: 우측 카드 1칸 크기만큼 목적지 지정
const nextSlide = () => {
  const container = sliderContainer.value
  if (container) {
    const cardWidth = container.clientWidth / cardsToShow.value
    const currentTarget = targetScrollLeft !== null ? targetScrollLeft : container.scrollLeft
    targetScrollLeft = currentTarget + cardWidth
  }
}

// 마우스 진입 시 자동 전진 일시정지
const onMouseEnter = () => {
  isHovering.value = true
}

// 마우스가 떠나면 자동 전진 다시 활성화 (진행 중이던 버튼 이동이 있다면 버튼 이동 완료 후 재개됨)
const onMouseLeave = () => {
  isHovering.value = false
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

onMounted(() => {
  updateCardsToShow()
  window.addEventListener('resize', updateCardsToShow)
  
  const container = sliderContainer.value
  if (container) {
    // 렌더링되자마자 중간 세트 영역으로 워프시킵니다.
    container.scrollLeft = container.scrollWidth / 3
    requestAnimationFrameId = requestAnimationFrame(animateScroll)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCardsToShow)
  if (requestAnimationFrameId) {
    cancelAnimationFrame(requestAnimationFrameId)
  }
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

    <div 
      ref="sliderContainer"
      class="slider-container"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <div class="slider-track">
        <RouterLink
          v-for="(category, index) in clonedCategories"
          :key="`${category.id}-${index}`"
          :to="{ path: '/map', query: { category: category.id } }"
          class="category-card"
          :style="{ width: `${100 / (cardsToShow * 3)}%` }"
        >
          <div class="category-card__inner">
            <div class="category-card__image-wrap">
              <img
                class="category-card__image"
                :src="categoryImageMap[category.id]"
                :alt="`${category.name} 대표 이미지`"
                loading="lazy"
                @error="handleImageError"
              />
            </div>
            <div class="category-card__meta">
              <div class="category-card__icon">{{ category.icon }}</div>
              <h3>{{ category.name }}</h3>
            </div>
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

.slider-container {
  width: 100%;
  overflow-x: auto;
  position: relative;
  /* ⚠️ 매우 중요: scroll-behavior를 절대 smooth로 주면 안 됩니다. 
     우리가 프레임 단위로 수동 보간 이동을 시키기 때문에 브라우저 자체 스크롤 관성과 무조건 충돌합니다. */
  scroll-behavior: auto; 
  cursor: grab;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.slider-container::-webkit-scrollbar {
  display: none;
}

.slider-container:active {
  cursor: grabbing;
}

.slider-track {
  display: flex;
  width: 300%; 
}

.category-card {
  flex-shrink: 0;
  padding: 0 0.5rem;
  text-decoration: none;
  color: var(--color-text);
  box-sizing: border-box;
}

.category-card__inner {
  display: flex;                  /* Flexbox 레이아웃 적용 */
  flex-direction: column;         /* 세로 방향으로 정렬 */
  align-items: center;            /* 가로축 중앙 정렬 */
  justify-content: flex-start;
  padding: 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.05);
  transition: transform 200ms ease, box-shadow 200ms ease;
  height: 100%;
  text-align: center;             /* 텍스트 중앙 정렬 보장 */
}

.category-card__image-wrap {
  width: 100%;
  height: 100px;
  border-radius: 0.6rem;
  overflow: hidden;
  background: #f3f4f6;
  margin-bottom: 0.65rem;
}

.category-card__image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.category-card__meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0 0.4rem 0.4rem;
}

.category-card:hover .category-card__inner {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
}

.category-card__icon {
  font-size: 1.15rem;
  margin-bottom: 0;
}

.category-card h3 {
  margin: 0;                     /* 불필요한 마진 제거 */
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
}
</style>