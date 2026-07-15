import api from './api'
import { toApiCategory } from '../utils/categoryConverter.js'

export async function getMapPois(params = {}) {
  const normalizedParams = { ...params }

  if (normalizedParams.category) {
    normalizedParams.category = toApiCategory(normalizedParams.category)
  }

  const response = await api.get('/api/map/pois', { params: normalizedParams })
  return response.data
}
