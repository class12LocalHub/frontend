<script setup>
defineProps({
  title: {
    type: String,
    default: '표시할 데이터가 없습니다.',
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="state">
    <strong>{{ title }}</strong>
    <p v-if="description">{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.state {
  min-height: 180px;
  padding: 24px;
  display: grid;
  place-content: center;
  gap: 8px;
  border: 1px dashed #bdc6d4;
  border-radius: 8px;
  color: #536074;
  text-align: center;
}

p {
  margin: 0;
  color: #748095;
}
</style>
