<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import MapCanvas from '../components/map/MapCanvas.vue'
import MapCategoryFilter from '../components/map/MapCategoryFilter.vue'
import PlaceList from '../components/map/PlaceList.vue'

import { getMapPoiById, getMapPois } from '../services/mapService.js'
import { getLocationSuggestions } from '../services/locationsService.js'
import { toApiCategory, toDisplayCategory } from '../utils/categoryConverter.js'

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

const normalizeCategory = (queryValue) => {
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
    '축제/공연행사': '축제/공연행사',
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

const getInitialCategory = () => normalizeCategory(route.query.category)

const selectedCategory = ref(getInitialCategory())
const selectedPlaceId = ref(null)
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
const placeListSection = ref(null)
const isSearching = ref(false)
const searchResults = ref([])
const isFromSearch = ref(false)
const centerCoordinates = ref(null)

const normalizePoiId = (value) => {
  const normalized = String(value ?? '').trim()
  if (!/^\d+$/.test(normalized)) return null

  const poiId = Number(normalized)
  return Number.isSafeInteger(poiId) ? poiId : null
}

const normalizePlace = (place) => ({
  ...place,
  category: toDisplayCategory(place.category),
  latitude: place.latitude ?? null,
  longitude: place.longitude ?? null,
})

const selectPoiFromQuery = async (queryValue) => {
  const poiId = normalizePoiId(queryValue)
  if (poiId === null) {
    selectedPlaceId.value = null
    return
  }

  let targetPlace = places.value.find((place) => Number(place.id) === poiId)

  if (!targetPlace) {
    try {
      const result = await getMapPoiById(String(poiId))
      if (normalizePoiId(route.query.poiId) !== poiId) return

      targetPlace = normalizePlace(result)
      places.value = [targetPlace, ...places.value.filter((place) => Number(place.id) !== poiId)]
    } catch (err) {
      console.error(err)
      return
    }
  }

  selectedPlaceId.value = null
  await nextTick()
  selectedPlaceId.value = poiId
}

watch(
  () => route.query.category,
  (category) => {
    selectedCategory.value = normalizeCategory(category)
    page.value = 1
    // Only reload if not from a location search selection
    if (!isFromSearch.value) {
      loadPlaces()
    }
    isFromSearch.value = false
  },
)

watch(
  () => route.query.poiId,
  (poiId) => {
    selectPoiFromQuery(poiId)
  },
)

const loadPlaces = async () => {
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

    const result = await getMapPois(params)

    places.value = (result.items || []).map(normalizePlace)
    total.value = result.total ?? result.items?.length ?? 0
    page.value = result.page ?? page.value
    totalPages.value = result.total_pages ?? 1
    await selectPoiFromQuery(route.query.poiId)
  } catch (err) {
    console.error(err)
    error.value = '장소 정보를 불러오지 못했습니다.'
    places.value = []
    total.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
    await nextTick()

    const poiId = normalizePoiId(route.query.poiId)
    const hasSelectedPoi = places.value.some((place) => Number(place.id) === poiId)
    if (poiId !== null && hasSelectedPoi) {
      selectedPlaceId.value = null
      await nextTick()
      selectedPlaceId.value = poiId
    }
  }
}

const filteredPlaces = computed(() => {
  if (isSearching.value || searchResults.value.length > 0) {
    return searchResults.value
  }
  return places.value
})

const handleCategorySelected = (category) => {
  selectedCategory.value = category
  searchInput.value = ''
  keyword.value = ''
  page.value = 1
  isPlaceListOpen.value = true
  loadPlaces()
}

const handleSelectPlace = (placeId) => {
  selectedPlaceId.value = placeId
}

const handleSelectPlaceFromSearch = async (place) => {
  selectedPlaceId.value = place.id
  isFromSearch.value = true
  // Auto-select the category for this place
  selectedCategory.value = toDisplayCategory(place.category)
  // Move map to the place coordinates
  centerCoordinates.value = {
    latitude: place.latitude,
    longitude: place.longitude,
  }
  // Close search results
  isSearching.value = false
  searchResults.value = []
  searchInput.value = ''
}

const handleSearch = async () => {
  const searchTerm = searchInput.value.trim()
  if (!searchTerm) {
    isSearching.value = false
    searchResults.value = []
    keyword.value = ''
    page.value = 1
    await loadPlaces()
    return
  }

  isSearching.value = true
  try {
    searchResults.value = await getLocationSuggestions(searchTerm, 20)
  } catch (err) {
    console.error('검색 실패:', err)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
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

const togglePlaceList = async () => {
  isPlaceListOpen.value = !isPlaceListOpen.value
  await nextTick()
  if (isPlaceListOpen.value && placeListSection.value) {
    placeListSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

onMounted(() => {
  searchInput.value = ''
  keyword.value = ''
  loadPlaces()
})
</script>

<template>
  <section class="map-view">
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
        <div class="map-card map-card--map">
          <template v-if="loading">
            <div class="map-state">장소를 불러오는 중입니다...</div>
          </template>
          <template v-else-if="error">
            <div class="map-state">{{ error }}</div>
          </template>
          <template v-else-if="filteredPlaces.length">
            <MapCanvas
              :places="filteredPlaces"
              :selectedPlaceId="selectedPlaceId"
              :centerCoordinates="centerCoordinates"
              @select-place="handleSelectPlace"
            />
          </template>
          <template v-else>
            <div class="map-state">표시할 장소가 없습니다.</div>
          </template>
        </div>

        <div class="map-guide">
          <div class="map-guide__text">
            <p>마커를 클릭하면 장소 정보를 확인할 수 있습니다.</p>
            <p v-if="!isSearching && searchResults.length === 0" class="map-guide__summary">
              총 {{ total }}개 장소, 페이지 {{ page }} / {{ totalPages }}
            </p>
            <p v-else-if="isSearching" class="map-guide__summary">검색 중입니다...</p>
            <p v-else class="map-guide__summary">{{ searchResults.length }}개 검색 결과</p>
          </div>

          <button type="button" class="map-guide__button" @click="togglePlaceList">
            {{ isPlaceListOpen ? '장소 목록 닫기' : '장소 목록 열기' }}
          </button>
        </div>

        <div class="map-search">
          <input
            type="text"
            v-model="searchInput"
            placeholder="장소명 또는 주소로 검색"
            class="map-search__input"
            @keyup.enter="handleSearch"
          />
          <button type="button" class="map-search__button" @click="handleSearch">검색</button>
        </div>

        <PlaceList
          v-if="isPlaceListOpen"
          ref="placeListSection"
          :places="filteredPlaces"
          :selectedPlaceId="selectedPlaceId"
          @select-place="
            isSearching || searchResults.length > 0
              ? handleSelectPlaceFromSearch($event)
              : handleSelectPlace($event.id)
          "
        />

        <div
          v-if="isPlaceListOpen && totalPages > 1 && !isSearching && searchResults.length === 0"
          class="pagination-bar"
        >
          <button
            type="button"
            class="pagination-bar__button"
            :disabled="page === 1"
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
              @click="goToPage(button)"
            >
              {{ button }}
            </button>
            <span v-else class="pagination-bar__ellipsis">…</span>
          </template>

          <button
            type="button"
            class="pagination-bar__button"
            :disabled="page === totalPages"
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
  isolation: isolate;
}

.map-guide {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--color-primary-light);
  border: 1px solid rgba(21, 94, 239, 0.18);
  border-radius: var(--radius-lg);
  padding: 1rem 1.25rem;
}

.map-guide p {
  margin: 0;
  color: var(--color-text);
}

.map-guide__button {
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  padding: 0.8rem 1rem;
  cursor: pointer;
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
}

.map-search {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.map-search__input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.9rem 1rem;
}

.map-search__button {
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  padding: 0.9rem 1.2rem;
  cursor: pointer;
}

.pagination-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
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
</style>
