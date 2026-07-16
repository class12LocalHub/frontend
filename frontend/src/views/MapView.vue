<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MapCanvas from '../components/map/MapCanvas.vue'
import MapCategoryFilter from '../components/map/MapCategoryFilter.vue'
import PlaceList from '../components/map/PlaceList.vue'
import { getMapPoiById, getMapPois } from '../services/mapService.js'
import { getLocationSuggestions } from '../services/locationsService.js'
import { toApiCategory, toDisplayCategory } from '../utils/categoryConverter.js'

const SEOUL_CENTER = { latitude: 37.5665, longitude: 126.978 }
const NEARBY_RADIUS_KM = 5

const categories = [
  '전체',
  '관광지',
  '레포츠',
  '문화시설',
  '쇼핑',
  '숙박',
  '여행코스',
  '축제/공연행사',
]

const route = useRoute()

const normalizeCategoryQuery = (queryValue) => {
  const value = String(queryValue || '').trim()
  if (!value) return '전체'

  const normalized = value.replace(/\s+/g, '').replace(/\//g, '').toLowerCase()

  const aliasMap = {
    관광지: '관광지',
    레포츠: '레포츠',
    문화시설: '문화시설',
    쇼핑: '쇼핑',
    숙박: '숙박',
    여행코스: '여행코스',
    축제공연행사: '축제/공연행사',
    tourist: '관광지',
    leisure: '레포츠',
    culture: '문화시설',
    shopping: '쇼핑',
    accommodation: '숙박',
    course: '여행코스',
    festival: '축제/공연행사',
  }

  return aliasMap[normalized] || '전체'
}

const selectedCategory = ref(normalizeCategoryQuery(route.query.category))
const selectedPlaceId = ref(null)
const selectedPlace = ref(null)
const isPlaceListOpen = ref(false)
const places = ref([])
const page = ref(1)
const pageSize = 20
const total = ref(0)
const totalPages = ref(1)
const keyword = ref('')
const searchInput = ref('')
const loading = ref(false)
const error = ref('')
const mapCanvasRef = ref(null)
const isSearching = ref(false)
const isAreaSearching = ref(false)
const isLocating = ref(false)
const locationError = ref('')
const currentPosition = ref(null)
const centerCoordinates = ref(null)
const hasMapMoved = ref(false)
const lastMapBounds = ref(null)

let listController = null
let areaSearchController = null
let detailController = null
let mapReady = false
let suggestionRequestId = 0
let mapMovementVersion = 0

const normalizePoiId = (value) => {
  const normalized = String(value ?? '').trim()
  return /^\d+$/.test(normalized) ? normalized : null
}

const normalizePlace = (place) => {
  const latitude = Number(place?.latitude ?? place?.mapy)
  const longitude = Number(place?.longitude ?? place?.mapx)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null

  return {
    ...place,
    category: toDisplayCategory(place.category),
    latitude,
    longitude,
  }
}

const normalizeSuggestion = (suggestion) => {
  const sourceId = normalizePoiId(suggestion?.source_id)
  if (!sourceId) return null
  return normalizePlace({ ...suggestion, id: Number(sourceId) })
}

const isCanceled = (requestError) => requestError?.code === 'ERR_CANCELED'

const createNearbyBbox = (position) => {
  const latitudeDelta = NEARBY_RADIUS_KM / 111
  const cosine = Math.max(Math.cos((position.latitude * Math.PI) / 180), 0.01)
  const longitudeDelta = NEARBY_RADIUS_KM / (111 * cosine)
  return [
    position.longitude - longitudeDelta,
    position.latitude - latitudeDelta,
    position.longitude + longitudeDelta,
    position.latitude + latitudeDelta,
  ].join(',')
}

const clearSelection = () => {
  detailController?.abort()
  selectedPlaceId.value = null
  selectedPlace.value = null
}

const setPlacesFromResponse = (result) => {
  places.value = (result.items || []).map(normalizePlace).filter(Boolean)
  total.value = result.total ?? places.value.length
  page.value = result.page ?? page.value
  totalPages.value = result.total_pages ?? 1
}

const selectPoiFromQuery = async (queryValue) => {
  const poiId = normalizePoiId(queryValue)
  if (!poiId) return false

  detailController?.abort()
  const controller = new AbortController()
  detailController = controller
  loading.value = true
  error.value = ''

  try {
    const result = await getMapPoiById(poiId, { signal: controller.signal })
    if (normalizePoiId(route.query.poiId) !== poiId) return false
    const place = normalizePlace(result)
    if (!place) throw new Error('Invalid POI coordinates')

    places.value = [place]
    total.value = 1
    page.value = 1
    totalPages.value = 1
    selectedPlace.value = place
    selectedPlaceId.value = place.id
    selectedCategory.value = toDisplayCategory(place.category)
    isPlaceListOpen.value = true
    hasMapMoved.value = false
    await nextTick()
    mapCanvasRef.value?.focusPlace(place)
    return true
  } catch (requestError) {
    if (!isCanceled(requestError)) error.value = '선택한 장소를 불러오지 못했습니다.'
    return false
  } finally {
    if (detailController === controller) {
      detailController = null
      loading.value = false
    }
  }
}

const loadPlaces = async () => {
  areaSearchController?.abort()
  listController?.abort()
  const controller = new AbortController()
  listController = controller
  loading.value = true
  error.value = ''

  try {
    const params = {
      place_type: 'all',
      region: '서울',
      page: page.value,
      size: pageSize,
    }

    if (selectedCategory.value !== '전체') {
      params.category = toApiCategory(selectedCategory.value)
    }

    if (keyword.value.trim()) {
      params.keyword = keyword.value.trim()
    }

    const result = await getMapPois(params, { signal: controller.signal })
    if (listController !== controller) return
    setPlacesFromResponse(result)
    clearSelection()
  } catch (requestError) {
    if (!isCanceled(requestError)) error.value = '장소 정보를 불러오지 못했습니다.'
  } finally {
    if (listController === controller) {
      listController = null
      loading.value = false
    }
  }
}

const loadNearbyPlaces = async (position) => {
  areaSearchController?.abort()
  listController?.abort()
  const controller = new AbortController()
  listController = controller
  loading.value = true
  error.value = ''

  try {
    const result = await getMapPois(
      {
        place_type: 'tourist',
        region: '서울',
        bbox: createNearbyBbox(position),
        page: 1,
        size: 20,
      },
      { signal: controller.signal },
    )
    if (listController !== controller) return
    setPlacesFromResponse(result)
    total.value = places.value.length
    totalPages.value = 1
    clearSelection()
  } catch (requestError) {
    if (!isCanceled(requestError)) error.value = '현재 위치 주변 장소를 불러오지 못했습니다.'
  } finally {
    if (listController === controller) {
      listController = null
      loading.value = false
    }
  }
}

const handleCategorySelected = (category) => {
  mapCanvasRef.value?.stopLocate()
  isLocating.value = false
  selectedCategory.value = category
  searchInput.value = ''
  keyword.value = ''
  page.value = 1
  isPlaceListOpen.value = true
  loadPlaces()
}

const focusPlace = async (place) => {
  const normalized = normalizePlace(place)
  if (!normalized) return

  selectedPlace.value = normalized
  selectedPlaceId.value = normalized.id
  mapCanvasRef.value?.focusPlace(normalized)

  detailController?.abort()
  const controller = new AbortController()
  detailController = controller
  try {
    const result = await getMapPoiById(String(normalized.id), { signal: controller.signal })
    const detail = normalizePlace(result)
    if (detailController === controller && detail) selectedPlace.value = detail
  } catch (requestError) {
    if (!isCanceled(requestError)) error.value = '장소 상세정보를 불러오지 못했습니다.'
  } finally {
    if (detailController === controller) detailController = null
  }
}

const handleSearch = async () => {
  const searchTerm = searchInput.value.trim()
  if (!searchTerm) {
    isSearching.value = false
    keyword.value = ''
    page.value = 1
    await loadPlaces()
    return
  }

  const requestId = ++suggestionRequestId
  listController?.abort()
  areaSearchController?.abort()
  isSearching.value = true
  try {
    const result = await getLocationSuggestions(searchTerm, 20)
    if (requestId !== suggestionRequestId) return
    places.value = result.map(normalizeSuggestion).filter(Boolean)
    total.value = places.value.length
    page.value = 1
    totalPages.value = 1
    clearSelection()
    isPlaceListOpen.value = true
  } catch {
    if (requestId === suggestionRequestId) error.value = '검색 결과를 불러오지 못했습니다.'
  } finally {
    if (requestId === suggestionRequestId) isSearching.value = false
  }
}

const handleMapMoved = (bounds) => {
  mapMovementVersion += 1
  lastMapBounds.value = bounds
  hasMapMoved.value = true
}

const handleSearchCurrentMap = async () => {
  if (isAreaSearching.value) return
  const bounds = lastMapBounds.value || mapCanvasRef.value?.getBoundsPayload()
  if (!bounds?.bbox) return

  listController?.abort()
  areaSearchController?.abort()
  const controller = new AbortController()
  const requestedMovementVersion = mapMovementVersion
  areaSearchController = controller
  isAreaSearching.value = true
  error.value = ''

  const params = {
    place_type: 'tourist',
    region: '서울',
    bbox: bounds.bbox,
    page: 1,
    size: 100,
  }
  if (selectedCategory.value !== '전체') params.category = toApiCategory(selectedCategory.value)
  if (keyword.value.trim()) params.keyword = keyword.value.trim()

  try {
    const result = await getMapPois(params, { signal: controller.signal })
    if (areaSearchController !== controller) return
    if (requestedMovementVersion !== mapMovementVersion) return
    const nextPlaces = (result.items || []).map(normalizePlace).filter(Boolean)
    const nextSelected = nextPlaces.find(
      (place) => String(place.id) === String(selectedPlaceId.value),
    )
    places.value = nextPlaces
    total.value = nextPlaces.length
    page.value = 1
    totalPages.value = 1
    if (nextSelected) selectedPlace.value = nextSelected
    else clearSelection()
    hasMapMoved.value = false
    lastMapBounds.value = null
  } catch (requestError) {
    if (!isCanceled(requestError)) {
      error.value = '현재 지도 영역의 장소를 불러오지 못했습니다. 기존 결과를 유지합니다.'
    }
  } finally {
    if (areaSearchController === controller) {
      areaSearchController = null
      isAreaSearching.value = false
    }
  }
}

const requestCurrentLocation = () => {
  if (isLocating.value) return
  locationError.value = ''
  isLocating.value = true
  mapCanvasRef.value?.locate()
}

const handleLocationFound = async (position) => {
  isLocating.value = false
  currentPosition.value = position
  centerCoordinates.value = {
    latitude: position.latitude,
    longitude: position.longitude,
  }
  await loadNearbyPlaces(position)
  hasMapMoved.value = false
  lastMapBounds.value = null
}

const handleLocationError = async (locationEvent) => {
  isLocating.value = false
  currentPosition.value = null
  const messages = {
    1: '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해 주세요.',
    2: '현재 위치를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    3: '위치 확인 시간이 초과되었습니다. 다시 시도해 주세요.',
  }
  locationError.value =
    messages[Number(locationEvent?.code)] ||
    '위치 기능을 사용할 수 없습니다. HTTPS 또는 지원되는 브라우저인지 확인해 주세요.'
  centerCoordinates.value = { ...SEOUL_CENTER }
  await loadPlaces()
  hasMapMoved.value = false
}

const handleMapReady = async () => {
  if (mapReady) return
  mapReady = true
  const poiId = normalizePoiId(route.query.poiId)
  if (poiId) {
    const didSelectPoi = await selectPoiFromQuery(poiId)
    if (didSelectPoi) return
  }
  requestCurrentLocation()
}

const goToPage = (pageNumber) => {
  if (pageNumber < 1 || pageNumber > totalPages.value || pageNumber === page.value) return
  page.value = pageNumber
  loadPlaces()
}

const pageButtons = computed(() => {
  const buttons = []
  const totalPage = totalPages.value
  const current = page.value

  if (totalPage <= 7) {
    for (let i = 1; i <= totalPage; i += 1) buttons.push(i)
    return buttons
  }

  if (current <= 4) {
    buttons.push(1, 2, 3, 4, 5, '...', totalPage)
    return buttons
  }

  if (current >= totalPage - 3) {
    buttons.push(1, '...', totalPage - 4, totalPage - 3, totalPage - 2, totalPage - 1, totalPage)
    return buttons
  }

  buttons.push(1, '...', current - 1, current, current + 1, '...', totalPage)
  return buttons
})

const togglePlaceList = () => {
  isPlaceListOpen.value = !isPlaceListOpen.value
}

watch(
  () => route.query.category,
  (category) => {
    if (!mapReady) return
    selectedCategory.value = normalizeCategoryQuery(category)
    page.value = 1
    loadPlaces()
  },
)

watch(
  () => route.query.poiId,
  async (poiId, previousPoiId) => {
    if (!mapReady || String(poiId ?? '') === String(previousPoiId ?? '')) return
    if (normalizePoiId(poiId)) {
      mapCanvasRef.value?.stopLocate()
      isLocating.value = false
      await selectPoiFromQuery(poiId)
    } else {
      requestCurrentLocation()
    }
  },
)

onBeforeUnmount(() => {
  suggestionRequestId += 1
  listController?.abort()
  areaSearchController?.abort()
  detailController?.abort()
  mapCanvasRef.value?.stopLocate()
})
</script>

<template>
  <section class="map-view">
    <header class="map-view__intro">
      <h1>서울 지역 탐색</h1>
      <p>카테고리와 지도를 이용해 서울의 다양한 장소를 찾아보세요.</p>
    </header>

    <div class="map-view__grid">
      <aside class="map-view__sidebar">
        <div class="map-card">
          <h2>카테고리</h2>
          <MapCategoryFilter
            :categories="categories"
            :selectedCategory="selectedCategory"
            @update:selected="handleCategorySelected"
          />
        </div>
      </aside>

      <div class="map-view__content">
        <section class="map-column">
          <div class="map-card map-card--map">
            <MapCanvas
              ref="mapCanvasRef"
              :places="places"
              :selectedPlaceId="selectedPlaceId"
              :centerCoordinates="centerCoordinates"
              :currentPosition="currentPosition"
              :isLocating="isLocating"
              @ready="handleMapReady"
              @select-place="focusPlace"
              @location-found="handleLocationFound"
              @location-error="handleLocationError"
              @request-location="requestCurrentLocation"
              @user-move="handleMapMoved"
            />
            <div v-if="loading" class="map-state map-state--overlay" role="status">
              장소를 불러오는 중입니다...
            </div>
            <div v-else-if="error" class="map-state map-state--overlay" role="status">
              {{ error }}
            </div>
            <div v-else-if="!places.length" class="map-state map-state--overlay" role="status">
              표시할 장소가 없습니다.
            </div>
            <button
              v-if="hasMapMoved"
              type="button"
              class="map-search-area-button"
              :disabled="isAreaSearching"
              @click="handleSearchCurrentMap"
            >
              {{ isAreaSearching ? '검색 중' : '현재 지도에서 검색' }}
            </button>
          </div>

          <article v-if="selectedPlace" class="selected-place-card">
            <img
              v-if="selectedPlace.firstimage || selectedPlace.firstimage2"
              :src="selectedPlace.firstimage || selectedPlace.firstimage2"
              :alt="`${selectedPlace.name} 이미지`"
              class="selected-place-card__image"
            />
            <div class="selected-place-card__content">
              <div class="selected-place-card__header">
                <h3>{{ selectedPlace.name }}</h3>
              </div>
              <div class="selected-place-card__body">
                <p class="selected-place-card__category">{{ selectedPlace.category }}</p>
                <p class="selected-place-card__address">{{ selectedPlace.address }}</p>
                <p v-if="selectedPlace.summary || selectedPlace.description">
                  {{ selectedPlace.summary || selectedPlace.description }}
                </p>
                <p v-if="selectedPlace.telephone">{{ selectedPlace.telephone }}</p>
              </div>
            </div>
          </article>
        </section>

        <p v-if="locationError" class="location-notice" role="status">
          {{ locationError }}
        </p>

        <div class="map-guide">
          <div class="map-guide__text">
            <p class="map-guide__icon">📍 지역 안내</p>
            <p class="map-guide__count">
              {{ isSearching ? '검색 중입니다...' : `지도에서 ${total.toLocaleString()}개의 장소를 찾았습니다.` }}
            </p>
            <p class="map-guide__summary">
              마커를 클릭하면 장소 정보를 확인할 수 있습니다.
            </p>
          </div>

          <button type="button" class="map-guide__button" @click="togglePlaceList">
            {{ isPlaceListOpen ? '장소 목록 닫기' : '장소 목록 열기' }}
          </button>
        </div>

        <div class="map-search">
          <p class="map-search__title">장소 검색</p>
          <input
            v-model="searchInput"
            type="text"
            placeholder="장소명 또는 초성으로 검색"
            class="map-search__input"
            @keyup.enter="handleSearch"
          />
          <button
            type="button"
            class="map-search__button"
            :disabled="isSearching"
            @click="handleSearch"
          >
            {{ isSearching ? '검색 중' : '검색' }}
          </button>
        </div>

        <PlaceList
          v-if="isPlaceListOpen"
          :places="places"
          :selectedPlaceId="selectedPlaceId"
          @select-place="focusPlace"
        />

        <div v-if="isPlaceListOpen && totalPages > 1" class="pagination-bar">
          <button
            type="button"
            class="pagination-bar__button"
            :disabled="page === 1 || loading"
            @click="goToPage(page - 1)"
          >
            이전
          </button>

          <template v-for="button in pageButtons" :key="button">
            <button
              v-if="button !== '...'"
              type="button"
              class="pagination-bar__button"
              :class="{ 'pagination-bar__button--active': button === page }"
              :disabled="loading"
              @click="goToPage(button)"
            >
              {{ button }}
            </button>
            <span v-else class="pagination-bar__ellipsis">…</span>
          </template>

          <button
            type="button"
            class="pagination-bar__button"
            :disabled="page === totalPages || loading"
            @click="goToPage(page + 1)"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.map-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  z-index: 0;
}

.map-view__intro h1 {
  margin: 0;
  color: #111827;
  font-size: clamp(1.45rem, 2.6vw, 1.9rem);
  line-height: 1.25;
}

.map-view__intro p {
  margin: 0.45rem 0 0;
  color: #6b7280;
  font-size: 0.94rem;
}

.map-view__grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
}

.map-view__sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.map-view__content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.map-column {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1rem;
}

.map-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}

.map-card h2 {
  margin: 0 0 1rem;
  font-size: 1.15rem;
}

.map-card--map {
  overflow: hidden;
  min-height: 500px;
  position: relative;
  z-index: 0;
  border-radius: 16px;
  padding: 0;
}

.map-search-area-button {
  position: absolute;
  top: 0.75rem;
  left: 50%;
  z-index: 500;
  transform: translateX(-50%);
  min-height: 42px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  color: #ea580c;
  padding: 0.62rem 0.95rem;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
  font-weight: 700;
  cursor: pointer;
}

.map-search-area-button:hover:not(:disabled) {
  background: #fff7ed;
  border-color: #fdba74;
}

.map-search-area-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.location-notice {
  margin: 0;
  border: 1px solid #fde68a;
  border-radius: var(--radius-md);
  background: #fffbeb;
  color: #92400e;
  padding: 0.85rem 1rem;
}

.map-guide {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 14px;
  padding: 0.95rem 1.1rem;
}

.map-guide p {
  margin: 0;
  color: var(--color-text);
}

.map-guide__count {
  font-weight: 700;
}

.map-guide__icon {
  color: #ea580c;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.map-guide__summary {
  margin-top: 0.2rem;
  color: #6b7280;
  font-size: 0.9rem;
}

.map-guide__button {
  border: 1px solid var(--color-primary);
  border-radius: 12px;
  background: var(--color-primary);
  color: #fff;
  padding: 0.76rem 0.95rem;
  box-shadow: 0 5px 12px rgba(249, 115, 22, 0.22);
  font-weight: 700;
  cursor: pointer;
}

.map-guide__button:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.map-search {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: center;
}

.map-search__title {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.map-search__input {
  flex: 1;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 0.82rem 0.95rem;
}

.map-search__input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.15);
}

@media (max-width: 1080px) {
  .map-view__grid {
    grid-template-columns: 1fr;
  }
}

.map-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  color: var(--color-muted);
  text-align: center;
  padding: 1rem;
}

.map-state--overlay {
  position: absolute;
  left: 50%;
  bottom: 1rem;
  z-index: 500;
  min-height: 0;
  max-width: calc(100% - 2rem);
  transform: translateX(-50%);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.82);
  color: #fff;
  padding: 0.6rem 0.9rem;
  pointer-events: none;
}

@media (max-width: 768px) {
  .map-view__grid {
    grid-template-columns: 1fr;
  }

  .map-card--map {
    min-height: 420px;
  }

  .map-guide {
    flex-direction: column;
    align-items: stretch;
  }

  .map-search-area-button {
    max-width: calc(100% - 8rem);
    white-space: nowrap;
  }
}

.map-search__button {
  border: none;
  border-radius: 12px;
  background: var(--color-primary);
  color: #fff;
  padding: 0.84rem 1.2rem;
  cursor: pointer;
}

.map-search__button:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.map-search__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pagination-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.selected-place-card {
  display: flex;
  gap: 1rem;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  box-shadow: 0 15px 30px rgba(15, 23, 42, 0.06);
}

.selected-place-card__image {
  width: 180px;
  min-height: 150px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.selected-place-card__content {
  min-width: 0;
  flex: 1;
}

.selected-place-card__header {
  margin-bottom: 0.75rem;
}

.selected-place-card__header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text);
}

.selected-place-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.selected-place-card__category {
  margin: 0;
  font-size: 0.95rem;
  color: var(--color-primary);
  font-weight: 600;
}

.selected-place-card__address {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-muted);
  line-height: 1.4;
}

.selected-place-card__body p {
  margin-top: 0;
  line-height: 1.55;
  overflow-wrap: anywhere;
  word-break: keep-all;
}

.pagination-bar__button {
  min-width: 52px;
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
  border-radius: var(--radius-md);
  padding: 0.78rem 1rem;
  cursor: pointer;
}

.pagination-bar__button--active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.pagination-bar__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-bar__ellipsis {
  color: var(--color-muted);
  font-size: 1rem;
}

@media (max-width: 600px) {
  .selected-place-card {
    flex-direction: column;
  }

  .selected-place-card__image {
    width: 100%;
    max-height: 240px;
  }
}
</style>
