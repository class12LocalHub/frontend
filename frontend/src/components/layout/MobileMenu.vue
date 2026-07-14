<script setup>
const openMenu = () => {
  alert('모바일 메뉴는 추후 구현됩니다.')
}
</script>

<template>
  <button class="mobile-menu" type="button" @click="openMenu">
    메뉴
  </button>
</template>

<style scoped>
.mobile-menu {
  display: none;
  border: 1px solid #d1d5db;
  background: #fff;
  padding: 0.45rem 0.75rem;
  border-radius: 0.5rem;
}

@media (max-width: 768px) {
  .mobile-menu {
    display: inline-block;
  }
}
</style>
