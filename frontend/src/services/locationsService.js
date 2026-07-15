import api from './api'

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
    return response.data?.items ?? []
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
    return response.data ?? null
  } catch (error) {
    console.error('Failed to fetch location:', error)
    return null
  }
}
