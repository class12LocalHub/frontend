const STORAGE_KEY = 'mock_like_statuses'
const useMockLikes = import.meta.env.VITE_USE_MOCK_LIKES !== 'false'

function loadMockStatuses() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    console.warn('Failed to load mock like statuses:', error)
    return {}
  }
}

function saveMockStatuses(statuses) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses))
  } catch (error) {
    console.warn('Failed to save mock like statuses:', error)
  }
}

export async function getLikeStatus(postId, initialCount = 0, initialLiked = false) {
  if (useMockLikes) {
    const statuses = loadMockStatuses()
    return statuses[postId] ?? { liked: initialLiked, like_count: initialCount }
  }

  // TODO: 백엔드 좋아요 상태 API 확정 후 연결
  // 예시: GET /api/posts/{postId}/likes/status
  throw new Error('Like status API is not implemented yet.')
}

export async function toggleLike(postId, currentLiked, currentCount = 0) {
  if (useMockLikes) {
    const statuses = loadMockStatuses()
    const existing = statuses[postId]
    const baseCount = existing?.like_count ?? currentCount
    const liked = !currentLiked
    const like_count = liked ? baseCount + 1 : Math.max(0, baseCount - 1)
    statuses[postId] = { liked, like_count }
    saveMockStatuses(statuses)
    return { liked, like_count }
  }

  // TODO: 백엔드 좋아요 API 확정 후 연결
  // if (!currentLiked) POST /api/posts/{postId}/likes
  // else DELETE /api/posts/{postId}/likes
  // return response.data
  throw new Error('Like API is not implemented yet.')
}
