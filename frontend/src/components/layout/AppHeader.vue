<template>
  <header class="app-header">
    <div class="header-inner">
      <RouterLink class="brand" to="/">LocalHub</RouterLink>

      <nav aria-label="주요 메뉴">
        <RouterLink to="/">홈</RouterLink>
        <RouterLink to="/posts">게시판</RouterLink>
        <RouterLink to="/map">지도</RouterLink>
        <RouterLink to="/dashboard">대시보드</RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid #d8dee8;
  background: #ffffff;
}

.header-inner {
  width: min(1180px, calc(100% - 40px));
  min-height: 64px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  color: #172033;
  font-size: 21px;
  font-weight: 800;
  text-decoration: none;
}

nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

nav a {
  padding: 9px 12px;
  border-radius: 6px;
  color: #4c566a;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

nav a.router-link-active {
  background: #e8f3ee;
  color: #176b4d;
}

nav a:first-child.router-link-active:not(.router-link-exact-active) {
  background: transparent;
  color: #4c566a;
}

@media (max-width: 640px) {
  .header-inner {
    width: min(100% - 24px, 1180px);
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    padding: 14px 0 10px;
  }

  nav {
    width: 100%;
    overflow-x: auto;
  }

  nav a {
    flex: 0 0 auto;
  }
}
</style>
