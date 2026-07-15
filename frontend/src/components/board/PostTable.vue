<script setup>
import { RouterLink } from 'vue-router'
import { toDisplayCategory } from '../../utils/categoryConverter.js'

const props = defineProps({
  posts: Array,
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}
</script>

<template>
  <div class="post-table-wrapper">
    <table class="post-table">
      <colgroup>
        <col class="col-number" />
        <col class="col-title" />
        <col class="col-category" />
        <col class="col-date" />
        <col class="col-views" />
      </colgroup>
      <thead>
        <tr>
          <th>번호</th>
          <th>제목</th>
          <th>카테고리</th>
          <th>작성일</th>
          <th>조회수</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="post in posts" :key="post.id">
          <td data-label="번호">{{ post.id }}</td>
          <td data-label="제목">
            <RouterLink :to="`/posts/${post.id}`" class="post-link">
              {{ post.title }}
            </RouterLink>
          </td>
          <td data-label="카테고리">{{ toDisplayCategory(post.category) }}</td>
          <td data-label="작성일">{{ formatDate(post.created_at) }}</td>
          <td data-label="조회수">{{ post.view_count }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.post-table-wrapper {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
}

.post-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  min-width: 760px;
}

.post-table col.col-number {
  width: 8%;
}

.post-table col.col-title {
  width: 42%;
}

.post-table col.col-category {
  width: 18%;
}

.post-table col.col-date {
  width: 20%;
}

.post-table col.col-views {
  width: 12%;
}

.post-table th,
.post-table td {
  padding: 0.85rem 0.75rem;
  box-sizing: border-box;
  vertical-align: middle;
}

.post-table th {
  font-weight: 700;
  color: var(--color-muted);
  background: #f8fafc;
}

.post-table th:not(:nth-child(2)),
.post-table td:not(:nth-child(2)) {
  text-align: center;
}

.post-table th:nth-child(2),
.post-table td:nth-child(2) {
  text-align: left;
}

.post-link {
  color: var(--color-text);
  text-decoration: none;
}

.post-link:hover {
  color: var(--color-primary);
}
</style>
