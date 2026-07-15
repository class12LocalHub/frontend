import api from './api'
import { normalizeCategory } from '../utils/categoryConverter.js'

/**
 * Normalize location data from API
 * Convert contentType to category if needed
 */
function normalizeLocationData(location) {
  if (!location) return null
  
  return {
    ...location,
    // Use category if exists, otherwise use contentType
    category: location.category || location.contentType || '기타',
    id: location.id || location.contentid,
    name: location.name || location.title,
    address: location.address || location.addr1,
    latitude: Number(location.latitude || location.mapy || 0),
    longitude: Number(location.longitude || location.mapx || 0),
  }
}

export async function getLocationSuggestions(keyword, limit = 20) {
  if (!keyword || !keyword.trim()) {
    return []
  }
  try {
    const params = {
      keyword: keyword.trim(),
      limit,
    }

    const response = await api.get('/api/locations/suggestions', { params })
    const items = response.data?.items ?? []
    return items.map(normalizeLocationData)
  } catch (error) {
    console.error('Failed to fetch location suggestions:', error)
    return []
  }
}

export async function getLocationById(locationId) {
  if (!locationId) {
    return null
  }
  try {
    const response = await api.get(`/api/locations/${locationId}`)
    const location = response.data ?? null
    return normalizeLocationData(location)
  } catch (error) {
    console.error('Failed to fetch location:', error)
    return null
  }
}
