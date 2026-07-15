<script setup>
import { computed, onMounted, ref } from 'vue'
import { getDashboard } from '../api/dashboard'
import EmptyState from '../components/common/EmptyState.vue'
import ErrorState from '../components/common/ErrorState.vue'
import LoadingState from '../components/common/LoadingState.vue'
import PageLayout from '../components/layout/PageLayout.vue'
import { getApiErrorMessage } from '../utils/api'

const dashboard = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const maxCount = computed(() => {
  if (!dashboard.value?.category_counts.length) return 0

  return Math.max(...dashboard.value.category_counts.map((item) => item.count))
})

async function loadDashboard() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getDashboard()
    dashboard.value = response.data
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, '대시보드 데이터를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

function barWidth(count) {
  if (!maxCount.value) return '0%'

  return `${(count / maxCount.value) * 100}%`
}

onMounted(loadDashboard)
</script>

<template>
  <PageLayout title="데이터 대시보드" description="백엔드가 제공하는 서울 지역정보 현황입니다.">
    <LoadingState v-if="loading" message="통계를 불러오는 중입니다." />
    <ErrorState v-else-if="errorMessage" :message="errorMessage" @retry="loadDashboard" />
    <template v-else-if="dashboard">
      <section class="summary" aria-label="전체 지역정보">
        <div><span>대상 지역</span><strong>{{ dashboard.region }}</strong></div>
        <div><span>전체 장소</span><strong>{{ dashboard.total_locations.toLocaleString() }}</strong></div>
      </section>

      <section class="category-data">
        <h2>카테고리별 장소 수</h2>
        <EmptyState v-if="dashboard.category_counts.length === 0" title="카테고리 통계가 없습니다." />
        <ul v-else>
          <li v-for="item in dashboard.category_counts" :key="item.category">
            <div class="category-row">
              <span>{{ item.category }}</span>
              <strong>{{ item.count.toLocaleString() }}</strong>
            </div>
            <div class="bar-track" aria-hidden="true">
              <span :style="{ width: barWidth(item.count) }" />
            </div>
          </li>
        </ul>
      </section>
    </template>
  </PageLayout>
</template>

<style scoped>
.summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.summary div {
  min-height: 130px;
  padding: 22px;
  display: grid;
  align-content: space-between;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
}

.summary span {
  color: #647085;
  font-size: 14px;
}

.summary strong {
  color: #174f3d;
  font-size: 30px;
}

.category-data {
  margin-top: 24px;
  padding: 24px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
}

h2 {
  margin: 0 0 20px;
  font-size: 19px;
}

ul {
  margin: 0;
  padding: 0;
  display: grid;
  gap: 18px;
  list-style: none;
}

.category-row {
  margin-bottom: 7px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.bar-track {
  height: 10px;
  overflow: hidden;
  border-radius: 4px;
  background: #e7ebf0;
}

.bar-track span {
  height: 100%;
  display: block;
  border-radius: 4px;
  background: #2b7a5f;
}

@media (max-width: 560px) {
  .summary {
    grid-template-columns: 1fr;
  }
}
</style>
