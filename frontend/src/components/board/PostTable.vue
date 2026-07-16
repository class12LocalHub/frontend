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
        <RouterLink
          v-for="post in posts"
          :key="post.id"
          :to="`/posts/${post.id}`"
          custom
          v-slot="{ navigate }"
        >
          <tr
            class="post-row"
            tabindex="0"
            role="link"
            @click="navigate"
            @keydown.enter.prevent="navigate"
          >
            <td data-label="번호" class="post-cell post-cell--number">{{ post.id }}</td>
            <td data-label="제목" class="post-cell post-cell--title">
              <span class="post-link">{{ post.title }}</span>
            </td>
            <td data-label="카테고리" class="post-cell post-cell--category">
              <span class="post-category-badge">{{ toDisplayCategory(post.category) }}</span>
            </td>
            <td data-label="작성일" class="post-cell post-cell--meta">{{ formatDate(post.created_at) }}</td>
            <td data-label="조회수" class="post-cell post-cell--meta">{{ post.view_count }}</td>
          </tr>
        </RouterLink>
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
  padding: 1rem 0.75rem;
  box-sizing: border-box;
  vertical-align: middle;
}

.post-table th {
  font-weight: 700;
  color: var(--color-muted);
  background: #fffaf5;
  font-size: 0.84rem;
  border-bottom: 1px solid #f3f4f6;
}

.post-table th:not(:nth-child(2)),
.post-table td:not(:nth-child(2)) {
  text-align: center;
}

.post-table th:nth-child(2),
.post-table td:nth-child(2) {
  text-align: left;
}

.post-row {
  cursor: pointer;
}

.post-row td {
  border-bottom: 1px solid #f3f4f6;
}

.post-row:hover td {
  background: #fff7ed;
}

.post-row:focus-visible {
  outline: 2px solid #fdba74;
  outline-offset: -2px;
}

.post-row:hover td:first-child,
.post-row:focus-visible td:first-child {
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.post-row:hover td:last-child,
.post-row:focus-visible td:last-child {
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

.post-link {
  color: var(--color-text);
  text-decoration: none;
  font-weight: 700;
}

.post-cell--number,
.post-cell--meta {
  color: #6b7280;
}

.post-category-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  padding: 3px 8px;
  border-radius: 9999px;
  background: #fff7ed;
  border: 1px solid #fdba74;
  color: #ea580c;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
