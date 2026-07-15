import apiClient from './client'

export function getHealth() {
  return apiClient.get('/api/health')
}
