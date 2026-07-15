import api from './api'
import { toApiCategory } from '../utils/categoryConverter.js'

export async function getMapPois(params = {}, options = {}) {
  const normalizedParams = { ...params }

  if (normalizedParams.category) {
    normalizedParams.category = toApiCategory(normalizedParams.category)
  }

  const response = await api.get('/api/map/pois', {
    params: normalizedParams,
    signal: options.signal,
  })
  return response.data
}

export async function getMapPoiById(poiId, options = {}) {
  const response = await api.get(`/api/map/pois/${poiId}`, {
    signal: options.signal,
  })
  return response.data
}
