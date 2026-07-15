<script setup>
defineProps({
  message: {
    type: String,
    default: '데이터를 불러오지 못했습니다.',
  },
  retryable: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['retry'])
</script>

<template>
  <div class="state" role="alert">
    <strong>요청 처리 실패</strong>
    <p>{{ message }}</p>
    <button v-if="retryable" type="button" @click="$emit('retry')">다시 시도</button>
  </div>
</template>

<style scoped>
.state {
  min-height: 180px;
  padding: 24px;
  display: grid;
  place-content: center;
  gap: 10px;
  border: 1px solid #e6b8b8;
  border-radius: 8px;
  background: #fffafa;
  color: #7a2929;
  text-align: center;
}

p {
  margin: 0;
}

button {
  justify-self: center;
}
</style>
