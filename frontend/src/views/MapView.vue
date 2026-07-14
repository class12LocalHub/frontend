<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import MapCanvas from '../components/map/MapCanvas.vue'
import MapCategoryFilter from '../components/map/MapCategoryFilter.vue'
import PlaceList from '../components/map/PlaceList.vue'

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
    '축제공연행사': '축제/공연행사',
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

watch(
  () => route.query.category,
  (category) => {
    selectedCategory.value = normalizeCategory(category)
  }
)

const places = [
  {
    id: 1,
    name: '경복궁',
    category: '관광지',
    address: '서울특별시 종로구 사직로 161',
    latitude: 37.5796,
    longitude: 126.9770,
  },
  {
    id: 2,
    name: '롯데월드',
    category: '레포츠',
    address: '서울특별시 송파구 올림픽로 240',
    latitude: 37.5110,
    longitude: 127.0980,
  },
  {
    id: 3,
    name: 'DDP 디자인플라자',
    category: '문화시설',
    address: '서울특별시 중구 을지로 281',
    latitude: 37.5663,
    longitude: 127.0094,
  },
  {
    id: 4,
    name: '명동 쇼핑거리',
    category: '쇼핑',
    address: '서울특별시 중구 명동',
    latitude: 37.5639,
    longitude: 126.9862,
  },
  {
    id: 5,
    name: '홍대 게스트하우스',
    category: '숙박',
    address: '서울특별시 마포구 홍익로',
    latitude: 37.5572,
    longitude: 126.9243,
  },
  {
    id: 6,
    name: '한강 자전거 코스',
    category: '여행코스',
    address: '서울특별시 영등포구 여의도동',
    latitude: 37.5275,
    longitude: 126.9320,
  },
  {
    id: 7,
    name: '서울재즈페스티벌',
    category: '축제/공연행사',
    address: '서울특별시 송파구 올림픽공원',
    latitude: 37.5155,
    longitude: 127.1181,
  },
]

const filteredPlaces = computed(() => {
  if (selectedCategory.value === '전체') {
    return places
  }
  return places.filter((place) => place.category === selectedCategory.value)
})

const handleCategorySelected = (category) => {
  selectedCategory.value = category
  isPlaceListOpen.value = true
}

const handleSelectPlace = (placeId) => {
  selectedPlaceId.value = placeId
}

const togglePlaceList = () => {
  isPlaceListOpen.value = !isPlaceListOpen.value
}
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
          <MapCanvas :places="filteredPlaces" :selectedPlaceId="selectedPlaceId" @select-place="handleSelectPlace" />
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
