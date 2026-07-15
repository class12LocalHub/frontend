import apiClient from './client'
import { clampPageSize, normalizeTourApiId } from '../utils/normalize'

export function getMapFilters() {
  return apiClient.get('/api/map/filters')
}

export function getMapPois(params = {}, options = {}) {
  const query = {
    page: Math.max(1, Number(params.page) || 1),
    size: clampPageSize(params.size, 20),
  }

  for (const key of ['place_type', 'category', 'keyword', 'region', 'bbox']) {
    if (params[key]) query[key] = params[key]
  }

  return apiClient.get('/api/map/pois', {
    params: query,
    signal: options.signal,
  })
}

export function getMapPoi(id, options = {}) {
  return apiClient.get(`/api/map/pois/${normalizeTourApiId(id)}`, {
    signal: options.signal,
  })
}
