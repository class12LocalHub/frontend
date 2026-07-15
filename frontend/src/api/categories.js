import apiClient from './client'

export function getCategories() {
  return apiClient.get('/api/categories')
}
