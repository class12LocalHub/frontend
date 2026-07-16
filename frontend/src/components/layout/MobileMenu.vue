<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const isOpen = ref(false)

const menuItems = [
  { label: '홈', path: '/' },
  { label: '지도', path: '/map' },
  { label: '지역 이야기', path: '/board' },
  { label: '대시보드', path: '/dashboard' },
  { label: '게시글 작성', path: '/posts/create' },
]

const getScrollbarWidth = () => {
  const scrollDiv = document.createElement('div')
  scrollDiv.style.cssText = 'width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;'
  document.body.appendChild(scrollDiv)
  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
  document.body.removeChild(scrollDiv)
  return scrollbarWidth || 0
}

const preventBodyScroll = () => {
  const scrollbarWidth = getScrollbarWidth()
  document.body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`
  }
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
}

const restoreBodyScroll = () => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.body.style.position = ''
  document.body.style.width = ''
}

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const handleMenuItemClick = (path) => {
  router.push(path)
  closeMenu()
}

const handleBackdropClick = () => {
  closeMenu()
}

const handleEscapeKey = (event) => {
  if (event.key === 'Escape' && isOpen.value) {
    closeMenu()
  }
}

const handleResize = () => {
  if (window.innerWidth > 768 && isOpen.value) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  window.removeEventListener('resize', handleResize)
  // Ensure body scroll is restored when component unmounts
  if (isOpen.value) {
    restoreBodyScroll()
  }
})

// Watch isOpen and update body style
import { watch } from 'vue'
watch(isOpen, (newValue) => {
  if (newValue) {
    preventBodyScroll()
  } else {
    restoreBodyScroll()
  }
})
</script>

<template>
  <div class="mobile-menu-wrapper">
    <!-- 햄버거 버튼 -->
    <button class="mobile-menu-button" type="button" @click="toggleMenu" :aria-label="isOpen ? '메뉴 닫기' : '메뉴 열기'">
      <span class="hamburger" :class="{ active: isOpen }">
        <span class="line"></span>
        <span class="line"></span>
        <span class="line"></span>
      </span>
    </button>

    <!-- 메뉴 배경 (백드롭) -->
    <div v-if="isOpen" class="mobile-menu-backdrop" @click="handleBackdropClick"></div>

    <!-- 메뉴 패널 -->
    <nav v-if="isOpen" class="mobile-menu-panel" aria-label="모바일 메뉴">
      <div class="mobile-menu-header">
        <button class="mobile-menu-close" type="button" @click="closeMenu" aria-label="메뉴 닫기">
          ✕
        </button>
      </div>

      <ul class="mobile-menu-list">
        <li v-for="item in menuItems" :key="item.path" class="mobile-menu-item">
          <button
            type="button"
            class="mobile-menu-link"
            :class="{ active: route.path === item.path }"
            @click="handleMenuItemClick(item.path)"
          >
            {{ item.label }}
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.mobile-menu-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.mobile-menu-button {
  display: none;
  border: 1px solid var(--color-border);
  background: #fff;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.mobile-menu-button:hover {
  background: #f8fafc;
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 1.2rem;
  height: 1.2rem;
  justify-content: center;
}

.line {
  display: block;
  width: 100%;
  height: 2px;
  background: #0f172a;
  border-radius: 999px;
  transition: all 0.3s ease;
}

.hamburger.active .line:nth-child(1) {
  transform: rotate(45deg) translate(0.5rem, 0.5rem);
}

.hamburger.active .line:nth-child(2) {
  opacity: 0;
}

.hamburger.active .line:nth-child(3) {
  transform: rotate(-45deg) translate(0.4rem, -0.4rem);
}

.mobile-menu-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 1998;
}

.mobile-menu-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: min(100%, 280px);
  height: 100vh;
  background: #fff;
  box-shadow: -10px 0 30px rgba(15, 23, 42, 0.15);
  z-index: 1999;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease forwards;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.mobile-menu-header {
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.mobile-menu-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #0f172a;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.mobile-menu-close:hover {
  color: var(--color-primary);
}

.mobile-menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.mobile-menu-item {
  border-bottom: 1px solid #f3f4f6;
}

.mobile-menu-link {
  width: 100%;
  padding: 1rem 1.25rem;
  text-align: left;
  background: none;
  border: none;
  color: var(--color-muted);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.mobile-menu-link:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.mobile-menu-link.active {
  background: rgba(249, 115, 22, 0.1);
  color: var(--color-primary);
  border-left: 4px solid var(--color-primary);
  padding-left: calc(1.25rem - 4px);
}

@media (max-width: 768px) {
  .mobile-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .line,
  .mobile-menu-panel {
    transition: none;
  }

  .mobile-menu-panel {
    animation: none;
  }
}
</style>

