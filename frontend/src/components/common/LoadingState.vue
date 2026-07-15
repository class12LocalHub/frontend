<script setup>
defineProps({
  message: {
    type: String,
    default: '데이터를 불러오는 중입니다.',
  },
})
</script>

<template>
  <div class="state" role="status" aria-live="polite">
    <span class="loading-mark" aria-hidden="true">···</span>
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.state {
  min-height: 180px;
  display: grid;
  place-content: center;
  gap: 8px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  color: #647085;
  text-align: center;
}

.loading-mark {
  color: #176b4d;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0;
}

p {
  margin: 0;
}
</style>
