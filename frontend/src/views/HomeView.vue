<script setup>
import { onMounted, ref } from 'vue'
import { getCategories } from '../api/categories'
import { getDashboard } from '../api/dashboard'
import EmptyState from '../components/common/EmptyState.vue'
import ErrorState from '../components/common/ErrorState.vue'
import LoadingState from '../components/common/LoadingState.vue'
import PageLayout from '../components/layout/PageLayout.vue'
import { getApiErrorMessage } from '../utils/api'

const categories = ref([])
const dashboard = ref(null)
const loading = ref(true)
const errorMessage = ref('')

async function loadHome() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [categoryResponse, dashboardResponse] = await Promise.all([
      getCategories(),
      getDashboard(),
    ])
    categories.value = categoryResponse.data.categories
    dashboard.value = dashboardResponse.data
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, '홈 데이터를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

onMounted(loadHome)
</script>

<template>
  <PageLayout title="LocalHub" description="서울의 지역정보를 찾고 경험을 공유하는 공간입니다.">
    <LoadingState v-if="loading" message="홈 데이터를 불러오는 중입니다." />
    <ErrorState v-else-if="errorMessage" :message="errorMessage" @retry="loadHome" />
    <template v-else>
      <section v-if="dashboard" class="overview" aria-label="서울 지역정보 현황">
        <div>
          <span>대상 지역</span>
          <strong>{{ dashboard.region }}</strong>
        </div>
        <div>
          <span>등록 장소</span>
          <strong>{{ dashboard.total_locations.toLocaleString() }}곳</strong>
        </div>
        <RouterLink class="primary-button link-button" to="/map">장소 검색</RouterLink>
      </section>

      <section class="category-section">
        <div class="section-heading">
          <h2>카테고리</h2>
          <RouterLink to="/dashboard">전체 통계 보기</RouterLink>
        </div>
        <div v-if="categories.length" class="category-grid">
          <RouterLink
            v-for="category in categories"
            :key="category"
            :to="{ path: '/map', query: { category } }"
          >
            {{ category }}
          </RouterLink>
        </div>
        <EmptyState v-else title="등록된 카테고리가 없습니다." />
      </section>
    </template>
  </PageLayout>
</template>

<style scoped>
.overview {
  padding: 28px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) auto;
  align-items: center;
  gap: 24px;
  border: 1px solid #c9d7d1;
  border-radius: 8px;
  background: #eef6f2;
}

.overview div {
  display: grid;
  gap: 6px;
}

.overview span {
  color: #58677a;
  font-size: 13px;
}

.overview strong {
  color: #174f3d;
  font-size: 24px;
}

.category-section {
  margin-top: 40px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

h2 {
  margin: 0;
  color: #172033;
  font-size: 21px;
}

.section-heading a {
  color: #176b4d;
  font-weight: 700;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.category-grid a {
  min-height: 92px;
  padding: 18px;
  display: flex;
  align-items: flex-end;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
  color: #283347;
  font-weight: 800;
  text-decoration: none;
}

@media (max-width: 640px) {
  .overview {
    grid-template-columns: 1fr 1fr;
  }

  .overview a {
    grid-column: 1 / -1;
  }
}
</style>
