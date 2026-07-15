import api from './api'

export async function getMapPois(params = {}) {
  const normalizedParams = { ...params }

  if (normalizedParams.category === '축제/공연행사') {
    normalizedParams.category = '축제공연행사'
  }

  const response = await api.get('/api/map/pois', { params: normalizedParams })
  return response.data
}
