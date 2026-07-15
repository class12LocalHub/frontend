<script setup>
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMapFilters, getMapPoi, getMapPois } from '../api/map'
import EmptyState from '../components/common/EmptyState.vue'
import ErrorState from '../components/common/ErrorState.vue'
import LoadingState from '../components/common/LoadingState.vue'
import PageLayout from '../components/layout/PageLayout.vue'
import { getApiErrorMessage } from '../utils/api'
import { normalizeTourApiId } from '../utils/normalize'

const route = useRoute()
const router = useRouter()
const filters = ref({ place_types: [], regions: [], categories: [] })
const form = reactive({ placeType: 'all', category: '', keyword: '', region: '' })
const pois = ref([])
const pagination = reactive({ total: 0, page: 1, size: 20, totalPages: 0 })
const selectedPoi = ref(null)
const loading = ref(true)
const detailLoading = ref(false)
const errorMessage = ref('')
const detailError = ref('')

function syncForm() {
  form.placeType = typeof route.query.placeType === 'string' ? route.query.placeType : 'all'
  form.category = typeof route.query.category === 'string' ? route.query.category : ''
  form.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  form.region = typeof route.query.region === 'string' ? route.query.region : ''
}

async function loadFilters() {
  try {
    const response = await getMapFilters()
    filters.value = response.data
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, '지도 필터를 불러오지 못했습니다.')
  }
}

async function loadPois() {
  syncForm()
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getMapPois({
      place_type: route.query.placeType,
      category: route.query.category,
      keyword: route.query.keyword,
      region: route.query.region,
      page: route.query.page,
      size: 20,
    })
    pois.value = response.data.items
    pagination.total = response.data.total
    pagination.page = response.data.page
    pagination.size = response.data.size
    pagination.totalPages = response.data.total_pages
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, '장소 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

async function loadPoiDetail(id) {
  if (!id) {
    selectedPoi.value = null
    detailError.value = ''
    return
  }

  detailLoading.value = true
  detailError.value = ''

  try {
    const response = await getMapPoi(normalizeTourApiId(id))
    selectedPoi.value = response.data
  } catch (error) {
    selectedPoi.value = null
    detailError.value = getApiErrorMessage(error, '장소 상세정보를 불러오지 못했습니다.')
  } finally {
    detailLoading.value = false
  }
}

function searchPois() {
  router.push({
    path: '/map',
    query: {
      ...(form.placeType !== 'all' && { placeType: form.placeType }),
      ...(form.category && { category: form.category }),
      ...(form.keyword.trim() && { keyword: form.keyword.trim() }),
      ...(form.region && { region: form.region }),
      page: 1,
    },
  })
}

function selectPoi(poi) {
  router.push({
    query: {
      ...route.query,
      poiId: normalizeTourApiId(poi.id),
    },
  })
}

function clearPoi() {
  const query = { ...route.query }
  delete query.poiId
  router.push({ query })
}

function changePage(page) {
  if (page < 1 || page > pagination.totalPages) return
  router.push({ query: { ...route.query, page } })
}

function coordinates(poi) {
  if (poi.latitude == null || poi.longitude == null) return '좌표 정보 없음'

  return `${poi.latitude}, ${poi.longitude}`
}

watch(
  () => [route.query.placeType, route.query.category, route.query.keyword, route.query.region, route.query.page],
  loadPois,
  { immediate: true },
)
watch(() => route.query.poiId, loadPoiDetail, { immediate: true })
loadFilters()
</script>

<template>
  <PageLayout title="지도 및 장소 검색" description="서울 지역 장소를 조건별로 검색하고 상세정보를 확인합니다.">
    <form class="map-filters" role="search" @submit.prevent="searchPois">
      <label>
        <span>장소 유형</span>
        <select v-model="form.placeType">
          <option v-if="!filters.place_types.length" value="all">전체</option>
          <option v-for="placeType in filters.place_types" :key="placeType.value" :value="placeType.value">
            {{ placeType.label }}
          </option>
        </select>
      </label>
      <label>
        <span>카테고리</span>
        <select v-model="form.category">
          <option value="">전체</option>
          <option v-for="category in filters.categories" :key="category" :value="category">{{ category }}</option>
        </select>
      </label>
      <label>
        <span>지역</span>
        <select v-model="form.region">
          <option value="">전체</option>
          <option v-for="region in filters.regions" :key="region" :value="region">{{ region }}</option>
        </select>
      </label>
      <label class="keyword-field">
        <span>검색어</span>
        <input v-model="form.keyword" placeholder="장소 이름 검색" />
      </label>
      <button class="primary-button" type="submit">검색</button>
    </form>

    <ErrorState v-if="errorMessage && !loading" :message="errorMessage" @retry="loadPois" />
    <div v-else class="map-workspace">
      <section class="result-panel" aria-label="장소 검색 결과">
        <div class="panel-heading">
          <h2>검색 결과</h2>
          <span>{{ pagination.total.toLocaleString() }}곳</span>
        </div>
        <LoadingState v-if="loading" message="장소를 불러오는 중입니다." />
        <EmptyState v-else-if="pois.length === 0" title="검색된 장소가 없습니다." />
        <template v-else>
          <ul class="poi-list">
            <li v-for="poi in pois" :key="normalizeTourApiId(poi.id)">
              <button type="button" @click="selectPoi(poi)">
                <strong>{{ poi.name }}</strong>
                <span>{{ poi.category }} · {{ poi.region || '지역 정보 없음' }}</span>
                <small>{{ poi.address || '주소 정보 없음' }}</small>
              </button>
            </li>
          </ul>
          <div v-if="pagination.totalPages > 1" class="pagination">
            <button class="secondary-button" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">
              이전
            </button>
            <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
            <button
              class="secondary-button"
              :disabled="pagination.page >= pagination.totalPages"
              @click="changePage(pagination.page + 1)"
            >
              다음
            </button>
          </div>
        </template>
      </section>

      <section class="detail-panel" aria-label="선택 장소 상세정보">
        <LoadingState v-if="detailLoading" message="장소 상세정보를 불러오는 중입니다." />
        <ErrorState v-else-if="detailError" :message="detailError" :retryable="false" />
        <article v-else-if="selectedPoi">
          <div class="panel-heading">
            <h2>{{ selectedPoi.name }}</h2>
            <button type="button" class="close-detail" @click="clearPoi">닫기</button>
          </div>
          <img
            v-if="selectedPoi.firstimage2 || selectedPoi.firstimage"
            :src="selectedPoi.firstimage2 || selectedPoi.firstimage"
            :alt="`${selectedPoi.name} 이미지`"
          />
          <dl>
            <div><dt>카테고리</dt><dd>{{ selectedPoi.category }}</dd></div>
            <div><dt>주소</dt><dd>{{ selectedPoi.address || '정보 없음' }}</dd></div>
            <div><dt>좌표</dt><dd>{{ coordinates(selectedPoi) }}</dd></div>
            <div><dt>전화</dt><dd>{{ selectedPoi.telephone || '정보 없음' }}</dd></div>
          </dl>
          <p>{{ selectedPoi.description || selectedPoi.summary || '상세 설명이 없습니다.' }}</p>
          <a v-if="selectedPoi.homepage" :href="selectedPoi.homepage" target="_blank" rel="noopener noreferrer">
            홈페이지 열기
          </a>
        </article>
        <EmptyState
          v-else
          title="장소를 선택해 주세요."
          description="검색 결과에서 장소를 선택하면 상세정보가 표시됩니다."
        />
      </section>
    </div>
  </PageLayout>
</template>

<style scoped>
.map-filters {
  margin-bottom: 20px;
  padding: 16px;
  display: grid;
  grid-template-columns: 130px 150px 120px minmax(180px, 1fr) auto;
  align-items: end;
  gap: 10px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
}

.map-filters label {
  display: grid;
  gap: 6px;
}

.map-filters label span {
  color: #536074;
  font-size: 12px;
  font-weight: 700;
}

.map-workspace {
  display: grid;
  grid-template-columns: minmax(300px, 0.85fr) minmax(360px, 1.15fr);
  gap: 16px;
}

.result-panel,
.detail-panel {
  min-height: 540px;
  padding: 18px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

h2 {
  margin: 0;
  font-size: 18px;
}

.panel-heading span {
  color: #647085;
  font-size: 13px;
}

.poi-list {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  list-style: none;
}

.poi-list button {
  width: 100%;
  padding: 13px;
  display: grid;
  gap: 4px;
  border: 1px solid #d8dee8;
  border-radius: 6px;
  background: #ffffff;
  color: #283347;
  text-align: left;
}

.poi-list span,
.poi-list small {
  color: #647085;
}

.detail-panel article > img {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 6px;
}

.close-detail {
  padding: 5px;
  border: 0;
  background: transparent;
  color: #536074;
}

dl {
  margin: 20px 0;
  display: grid;
  gap: 9px;
}

dl div {
  display: grid;
  grid-template-columns: 75px 1fr;
  gap: 10px;
}

dt {
  color: #647085;
  font-size: 13px;
}

dd {
  margin: 0;
}

.detail-panel p {
  line-height: 1.7;
  white-space: pre-wrap;
}

.detail-panel a {
  color: #176b4d;
  font-weight: 700;
}

.pagination {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

@media (max-width: 900px) {
  .map-filters,
  .map-workspace {
    grid-template-columns: 1fr 1fr;
  }

  .keyword-field,
  .detail-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 560px) {
  .map-filters,
  .map-workspace {
    grid-template-columns: 1fr;
  }

  .keyword-field,
  .detail-panel {
    grid-column: auto;
  }
}
</style>
