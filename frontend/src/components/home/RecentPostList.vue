<script setup>
import { RouterLink } from 'vue-router'

const posts = [
  { id: 1, category: '축제/공연행사', title: '여의도한강공원 야간 축제 일정 공유', createdAt: '2026-07-14', views: 128 },
  { id: 2, category: '관광지', title: '강남역 근처 숨은 맛집 추천합니다', createdAt: '2026-07-13', views: 96 },
  { id: 3, category: '숙박', title: '성수동 반려동물 동반 가능 숙소 후기', createdAt: '2026-07-12', views: 84 },
  { id: 4, category: '문화시설', title: '홍대 전시 공간 운영시간 안내', createdAt: '2026-07-11', views: 71 },
  { id: 5, category: '레포츠', title: '한강 자전거 코스 추천 포인트', createdAt: '2026-07-10', views: 63 },
]
</script>

<template>
  <section class="recent-posts">
    <div class="recent-posts__header">
      <h2>최근 게시글</h2>
      <RouterLink to="/board">더보기</RouterLink>
    </div>

    <ul class="post-list">
      <li v-for="post in posts" :key="post.id" class="post-item">
        <div class="post-item__meta">
          <span class="post-item__category">{{ post.category }}</span>
          <RouterLink :to="`/posts/${post.id}`" class="post-item__title">{{ post.title }}</RouterLink>
        </div>
        <div class="post-item__info">
          <span>{{ post.createdAt }}</span>
          <span>조회 {{ post.views }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.recent-posts {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.recent-posts__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.recent-posts__header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.recent-posts__header a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.post-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 0;
  border-bottom: 1px solid #f3f4f6;
  gap: 1rem;
}

.post-item__meta {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.post-item__category {
  display: inline-block;
  font-size: 0.8rem;
  color: var(--color-primary);
  font-weight: 700;
}

.post-item__title {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 600;
}

.post-item__info {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--color-muted);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .post-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .post-item__info {
    gap: 0.5rem;
    flex-wrap: wrap;
  }
}
</style>
