<script setup></script>

<template>
  <section class="hero">
    <div class="hero__content">
      <p class="hero__eyebrow enter-up" style="--d: 0ms">서울 지역 정보 공유 커뮤니티</p>
      <h1 class="enter-up" style="--d: 70ms">서울의 모든 지역 정보를 한곳에</h1>
      <p class="hero__description enter-up" style="--d: 170ms">
        관광지부터 축제, 맛집, 숙박까지 서울의 다양한 지역 정보를 확인하고 자유롭게 이야기를 나눠보세요.
      </p>
    </div>
  </section>
</template>

<style scoped>
.hero {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  color: #fff;
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  box-shadow: 0 20px 40px rgba(21, 94, 239, 0.16);
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
</style>
