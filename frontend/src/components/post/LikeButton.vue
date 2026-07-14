<script setup>
import { ref, onMounted } from 'vue'
import { getLikeStatus, toggleLike } from '../../services/likeService'

const props = defineProps({
  postId: {
    type: [Number, String],
    required: true,
  },
  initialCount: {
    type: Number,
    default: 0,
  },
  initialLiked: {
    type: Boolean,
    default: false,
  },
})

const liked = ref(props.initialLiked)
const likeCount = ref(props.initialCount)
const loading = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const status = await getLikeStatus(props.postId, props.initialCount, props.initialLiked)
    liked.value = status.liked
    likeCount.value = status.like_count
  } catch (error) {
    console.warn(error)
  }
})

const handleToggle = async () => {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''

  try {
    const result = await toggleLike(props.postId, liked.value, likeCount.value)
    liked.value = result.liked
    likeCount.value = result.like_count
  } catch (error) {
    console.error(error)
    errorMessage.value = '좋아요 처리를 할 수 없습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="like-button-wrapper">
    <button type="button" class="like-button" :class="{ active: liked }" @click="handleToggle" :disabled="loading">
      <span class="heart">{{ liked ? '♥' : '♡' }}</span>
      <span class="count">{{ likeCount }}</span>
    </button>
    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.like-button-wrapper {
  display: inline-flex;
  flex-direction: column;
  gap: 0.35rem;
}

.like-button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: #fff;
  color: var(--color-text);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.like-button.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.like-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.heart {
  font-size: 1rem;
  line-height: 1;
}

.count {
  font-size: 0.95rem;
}

.error-text {
  margin: 0;
  color: #d14343;
  font-size: 0.82rem;
}
</style>
