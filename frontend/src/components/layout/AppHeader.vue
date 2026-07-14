<script setup>
import { RouterLink } from 'vue-router'
import AppLogo from './AppLogo.vue'
import MobileMenu from './MobileMenu.vue'
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <RouterLink to="/" class="app-header__brand">
        <AppLogo />
      </RouterLink>

      <nav class="app-header__nav" aria-label="메인 메뉴">
        <RouterLink to="/">홈</RouterLink>
        <RouterLink to="/map">지도</RouterLink>
        <RouterLink to="/board">게시판</RouterLink>
        <RouterLink to="/dashboard">대시보드</RouterLink>
      </nav>

      <MobileMenu />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 20;
}

.app-header__inner {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.app-header__brand {
  text-decoration: none;
}

.app-header__nav {
  display: flex;
  gap: 1.1rem;
}

.app-header__nav a {
  text-decoration: none;
  color: var(--color-muted);
  font-weight: 600;
  padding: 0.35rem 0.5rem;
  transition: color 0.2s ease;
}

.app-header__nav a:hover {
  color: var(--color-primary);
}

.app-header__nav a.router-link-active {
  color: var(--color-primary);
  position: relative;
}

.app-header__nav a.router-link-active::after {
  content: '';
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  bottom: -0.25rem;
  height: 2px;
  background: var(--color-primary);
  border-radius: 999px;
}

@media (max-width: 768px) {
  .app-header__nav {
    display: none;
  }
}
</style>
