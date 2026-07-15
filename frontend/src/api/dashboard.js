import apiClient from './client'

export function getDashboard() {
  return apiClient.get('/api/dashboard')
}
