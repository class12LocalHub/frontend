import apiClient from './client'
import { clampPageSize, normalizeTourApiId } from '../utils/normalize'

export function getLocationSuggestions(keyword, limit = 10) {
  return apiClient.get('/api/locations/suggestions', {
    params: {
      keyword,
      limit: Math.min(Math.max(Number(limit) || 10, 1), 20),
    },
  })
}

export function getLocations(params = {}) {
  const query = {
    page: Math.max(1, Number(params.page) || 1),
    size: clampPageSize(params.size, 20),
  }

  for (const key of ['place_type', 'category', 'keyword', 'region', 'bbox']) {
    if (params[key]) query[key] = params[key]
  }

  return apiClient.get('/api/locations', { params: query })
}

export function getLocation(id) {
  return apiClient.get(`/api/locations/${normalizeTourApiId(id)}`)
}
