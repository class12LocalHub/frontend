<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="hero">
    <div class="hero__content">
      <p class="hero__eyebrow enter-up" style="--d: 0ms">서울 지역 정보 공유 커뮤니티</p>
      <h1 class="enter-up" style="--d: 70ms">서울의 모든 지역 정보를 한곳에</h1>
      <p class="hero__description enter-up" style="--d: 170ms">
        관광지부터 축제, 맛집, 숙박까지 서울의 다양한 지역 정보를 확인하고 자유롭게 이야기를 나눠보세요.
      </p>
      <div class="hero__button-reveal enter-up" style="--d: 270ms">
        <RouterLink class="hero__button" to="/map">
          <span>지역 둘러보기</span>
          <span class="hero__button-arrow" aria-hidden="true">›</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  min-height: 320px;
  background:
    linear-gradient(96deg, rgba(15, 23, 42, 0.74) 0%, rgba(15, 23, 42, 0.58) 33%, rgba(15, 23, 42, 0.25) 62%, rgba(15, 23, 42, 0.08) 100%),
    url('/image.png') no-repeat 56% 44%;
  background-size: cover;
  
  color: #fff;
  border-radius: 20px;
  padding: 2.75rem;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
}

.hero__content {
  max-width: 720px;
}

.hero__eyebrow {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.9;
}

.hero h1 {
  margin: 0 0 0.75rem;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  line-height: 1.2;
}

.hero__description {
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.92);
}

.hero__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border: none;
  border-radius: 9999px;
  color: #ffffff;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  background: linear-gradient(135deg, #ff8a1f 0%, #f97316 55%, #ea580c 100%);
  box-shadow: 0 8px 20px rgba(234, 88, 12, 0.28);
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.hero__button:hover {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%);
  box-shadow: 0 10px 24px rgba(194, 65, 12, 0.32);
  transform: translateY(-1px);
}

.hero__button:active {
  transform: translateY(0);
  box-shadow: 0 6px 16px rgba(194, 65, 12, 0.25);
}

.hero__button-reveal {
  margin-top: 1.4rem;
}

.hero__button-arrow {
  font-size: 1.1em;
  line-height: 1;
  transition: transform 0.2s ease;
}

.hero__button:hover .hero__button-arrow {
  transform: translateX(2px);
}

.enter-up {
  animation: heroUp 500ms ease-out both;
  animation-delay: var(--d, 0ms);
}

@keyframes heroUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .enter-up {
    animation: none;
  }
}

@media (max-width: 768px) {
  .hero {
    min-height: 300px;
    padding: 2rem 1.25rem;
  }
}
</style>