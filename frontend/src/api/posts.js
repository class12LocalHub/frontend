import apiClient from './client'
import { clampPageSize, normalizeLocationId } from '../utils/normalize'

export function getPosts(params = {}) {
  const query = {
    page: Math.max(1, Number(params.page) || 1),
    size: clampPageSize(params.size, 10),
  }

  if (params.category) query.category = params.category
  if (params.keyword) query.keyword = params.keyword

  if (params.location_id !== undefined && params.location_id !== null) {
    const locationId = normalizeLocationId(params.location_id)
    if (locationId !== null) query.location_id = locationId
  }

  return apiClient.get('/api/posts', { params: query })
}

export function getPost(id) {
  return apiClient.get(`/api/posts/${Number(id)}`)
}

export function createPost(post) {
  return apiClient.post('/api/posts', post)
}

export function updatePost(id, post) {
  return apiClient.put(`/api/posts/${Number(id)}`, post)
}

export function deletePost(id, password) {
  return apiClient.delete(`/api/posts/${Number(id)}`, {
    data: { password },
  })
}
