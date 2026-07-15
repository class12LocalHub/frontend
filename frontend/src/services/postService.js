import api from './api'

export async function getPosts(params = {}) {
  const response = await api.get('/api/posts', { params })
  return response.data
}

export async function getPostById(postId) {
  const response = await api.get(`/api/posts/${postId}`)
  return response.data
}

export async function createPost(postData) {
  const response = await api.post('/api/posts', postData)
  return response.data
}

export async function updatePost(postId, postData) {
  const response = await api.put(`/api/posts/${postId}`, postData)
  return response.data
}

export async function deletePost(postId, password) {
  const response = await api.delete(`/api/posts/${postId}`, {
    data: { password },
  })
  return response.data
}