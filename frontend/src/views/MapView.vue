<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MapCanvas from '../components/map/MapCanvas.vue'
import MapCategoryFilter from '../components/map/MapCategoryFilter.vue'
import PlaceList from '../components/map/PlaceList.vue'
import { getMapPois } from '../services/mapService.js'

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

  const normalized = value
    .replace(/\s+/g, '')
    .replace(/\//g, '')
    .toLowerCase()

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

const toApiCategory = (displayCategory) => {
  if (displayCategory === '축제/공연행사') return '축제공연행사'
  return displayCategory
}

const toDisplayCategory = (value) => {
  if (value === '축제공연행사') return '축제/공연행사'
  return value || '기타'
}

const getInitialCategory = () => normalizeCategory(route.query.category)

const selectedCategory = ref(getInitialCategory())
const selectedPlaceId = ref(null)
const isPlaceListOpen = ref(false)
const places = ref([])
const loading = ref(false)
const error = ref('')

watch(
  () => route.query.category,
  (category) => {
    selectedCategory.value = normalizeCategory(category)
    loadPlaces()
  }
)

const loadPlaces = async () => {
  loading.value = true
  error.value = ''

  try {
    const baseParams = {
      place_type: 'all',
      region: '서울',
      page: 1,
      size: 20,
    }

    let results = []

    if (selectedCategory.value === '전체') {
      const categoryList = [
        '관광지',
        '레포츠',
        '문화시설',
        '쇼핑',
        '숙박',
        '여행코스',
        '축제/공연행사',
      ]

      const responses = await Promise.all(
        categoryList.map((category) => getMapPois({ ...baseParams, category: toApiCategory(category) }))
      )

      results = responses.flatMap((response) => response.items || [])
    } else {
      const result = await getMapPois({ ...baseParams, category: toApiCategory(selectedCategory.value) })
      results = result.items || []
    }

    const merged = Array.from(
      new Map(
        results.map((place) => [
          place.id,
          {
            ...place,
            category: toDisplayCategory(place.category),
            latitude: place.latitude ?? null,
            longitude: place.longitude ?? null,
          },
        ])
      ).values()
    )

    places.value = merged
  } catch (err) {
    console.error(err)
    error.value = '장소 정보를 불러오지 못했습니다.'
    places.value = []
  } finally {
    loading.value = false
  }
}

const filteredPlaces = computed(() => {
  if (selectedCategory.value === '전체') {
    return places.value
  }
  return places.value.filter((place) => place.category === selectedCategory.value)
})

const handleCategorySelected = (category) => {
  selectedCategory.value = category
  isPlaceListOpen.value = true
  loadPlaces()
}

const handleSelectPlace = (placeId) => {
  selectedPlaceId.value = placeId
}

const togglePlaceList = () => {
  isPlaceListOpen.value = !isPlaceListOpen.value
}

onMounted(() => {
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
            <MapCanvas :places="filteredPlaces" :selectedPlaceId="selectedPlaceId" @select-place="handleSelectPlace" />
          </template>
          <template v-else>
            <div class="map-state">표시할 장소가 없습니다.</div>
          </template>
        </div>

        <div class="map-guide">
          <p>마커를 클릭하면 장소 정보를 확인할 수 있습니다.</p>
          <button type="button" class="map-guide__button" @click="togglePlaceList">
            {{ isPlaceListOpen ? '장소 목록 닫기' : '장소 목록 열기' }}
          </button>
        </div>

        <PlaceList
          v-if="isPlaceListOpen"
          :places="filteredPlaces"
          :selectedPlaceId="selectedPlaceId"
          @select-place="handleSelectPlace"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.map-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
</style>
