<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  posts: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const normalizedPosts = computed(() =>
  (props.posts || []).map((post) => ({
    id: post.id,
    category: post.category,
    title: post.title,
    createdAt: post.created_at ? post.created_at.slice(0, 10) : '',
    views: post.view_count ?? 0,
  }))
)
</script>

<template>
  <section class="recent-posts">
    <div class="recent-posts__header">
      <h2>최근 게시글</h2>
      <RouterLink to="/board">더보기</RouterLink>
    </div>

    <template v-if="loading">
      <p class="status-text">게시글을 불러오는 중입니다.</p>
    </template>

    <template v-else-if="error">
      <p class="status-text">{{ error }}</p>
    </template>

    <template v-else-if="normalizedPosts.length">
      <ul class="post-list">
        <li v-for="post in normalizedPosts" :key="post.id" class="post-item">
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
    </template>

    <template v-else>
      <p class="status-text">등록된 게시글이 없습니다.</p>
    </template>
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

.status-text {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.95rem;
}
</style>
