<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import Chart from 'chart.js/auto'
import { getDashboardData } from '../services/dashboardService.js'

const loading = ref(true)
const error = ref('')
const dashboardData = ref(null)
const barChartRef = ref(null)
const doughnutChartRef = ref(null)
let barChartInstance = null
let doughnutChartInstance = null

const formatNumber = (value) => {
  return value?.toLocaleString('ko-KR') ?? '0'
}

const categoryLabels = computed(() => dashboardData.value?.category_counts.map((item) => item.category) ?? [])
const categoryCounts = computed(() => dashboardData.value?.category_counts.map((item) => item.count) ?? [])
const totalLocations = computed(() => dashboardData.value?.total_locations ?? 0)
const categoryItems = computed(() => {
  if (!dashboardData.value) return []
  return dashboardData.value.category_counts.map((item) => ({
    ...item,
    ratio: totalLocations.value ? (item.count / totalLocations.value) * 100 : 0,
  }))
})

const createBarChart = () => {
  if (!barChartRef.value || !dashboardData.value) return
  if (barChartInstance) {
    barChartInstance.destroy()
  }

  const ctx = barChartRef.value.getContext('2d')
  barChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categoryLabels.value,
      datasets: [
        {
          label: '장소 수',
          data: categoryCounts.value,
          backgroundColor: 'rgba(14, 118, 255, 0.85)',
          borderRadius: 12,
          borderSkipped: false,
          maxBarThickness: 48,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 16, right: 8, left: 8, bottom: 8 },
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: '카테고리별 장소 수',
          color: '#0f172a',
          font: { size: 16, weight: '700' },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y ?? 0
              return `${context.label}: ${value.toLocaleString('ko-KR')}곳`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#334155', font: { size: 12 }, maxRotation: 0, minRotation: 0 },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(15, 23, 42, 0.08)' },
          ticks: {
            color: '#334155',
            callback: (value) => value.toLocaleString('ko-KR'),
          },
        },
      },
    },
  })
}

const createDoughnutChart = () => {
  if (!doughnutChartRef.value || !dashboardData.value) return
  if (doughnutChartInstance) {
    doughnutChartInstance.destroy()
  }

  const ctx = doughnutChartRef.value.getContext('2d')
  doughnutChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categoryLabels.value,
      datasets: [
        {
          data: categoryCounts.value,
          backgroundColor: [
            'rgba(14, 118, 255, 0.92)',
            'rgba(56, 189, 248, 0.88)',
            'rgba(59, 130, 246, 0.82)',
            'rgba(14, 165, 233, 0.78)',
            'rgba(96, 165, 250, 0.76)',
            'rgba(37, 99, 235, 0.85)',
            'rgba(191, 219, 254, 0.95)',
          ],
          borderColor: '#fff',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#334155',
            boxWidth: 10,
            boxHeight: 10,
            padding: 10,
            usePointStyle: true,
            font: {
              size: 11,
            },
          },
        },
        title: {
          display: true,
          text: '카테고리별 비율',
          color: '#0f172a',
          font: { size: 16, weight: '700' },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed
              const ratio = totalLocations.value
                ? ((value / totalLocations.value) * 100).toFixed(1)
                : '0.0'
              return `${context.label}: ${value.toLocaleString('ko-KR')}곳 (${ratio}%)`
            },
          },
        },
      },
      cutout: '55%',
    },
  })
}

const destroyCharts = () => {
  if (barChartInstance) {
    barChartInstance.destroy()
    barChartInstance = null
  }
  if (doughnutChartInstance) {
    doughnutChartInstance.destroy()
    doughnutChartInstance = null
  }
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  destroyCharts()

  try {
    dashboardData.value = await getDashboardData()
  } catch (e) {
    error.value = '대시보드 데이터를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadData()
  if (!error.value && dashboardData.value) {
    await nextTick()

    createBarChart()
    createDoughnutChart()
  }
})

onBeforeUnmount(() => {
  destroyCharts()
})
</script>

<template>
  <section class="page dashboard-view">
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div>
          <h1>지역 데이터 대시보드</h1>
          <p>서울 지역의 카테고리별 장소 현황을 확인해보세요.</p>
        </div>
      </div>

      <div class="summary-grid">
        <article class="summary-card">
          <p class="summary-label">전체 장소 수</p>
          <p class="summary-value">{{ formatNumber(totalLocations) }}곳</p>
        </article>
        <article class="summary-card">
          <p class="summary-label">카테고리 수</p>
          <p class="summary-value">{{ dashboardData?.category_counts?.length ?? 0 }}개</p>
        </article>
      </div>

      <div v-if="loading" class="status-card">대시보드 데이터를 불러오는 중입니다.</div>
      <div v-else-if="error" class="status-card status-error">{{ error }}</div>

      <template v-else>
        <div class="chart-grid">
          <article class="chart-card">
            <div class="chart-canvas-wrapper">
              <canvas ref="barChartRef" aria-label="카테고리별 장소 수 막대그래프"></canvas>
            </div>
          </article>

          <article class="chart-card donut-card">
            <div class="chart-canvas-wrapper donut-wrapper">
              <canvas ref="doughnutChartRef" aria-label="카테고리별 비율 도넛그래프"></canvas>
              <div class="donut-center">
                <span class="donut-number">{{ formatNumber(totalLocations) }}</span>
                <span class="donut-label">전체 장소 수</span>
              </div>
            </div>
          </article>
        </div>

        <div class="table-card">
          <div class="table-header">
            <h2>카테고리별 장소 현황</h2>
            <p>각 카테고리의 장소 수와 비율을 확인하세요.</p>
          </div>
          <div class="table-scroll">
            <table class="category-table">
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th>장소 수</th>
                  <th>비율</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in categoryItems" :key="item.category">
                  <td>{{ item.category }}</td>
                  <td>{{ formatNumber(item.count) }}</td>
                  <td>{{ item.ratio.toFixed(1) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.dashboard-view {
  display: flex;
  justify-content: center;
  padding: 1.5rem 1rem 2rem;
}

.dashboard-container {
  width: 100%;
  max-width: 1100px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.3rem;
  flex-wrap: wrap;
}

.dashboard-header h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(1.8rem, 2.1vw, 2.3rem);
}

.dashboard-header p {
  margin: 0;
  color: var(--color-muted);
  max-width: 680px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.summary-label {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.95rem;
}

.summary-value {
  margin: 0.75rem 0 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-primary);
}

.status-card {
  padding: 1.25rem 1.35rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: #fff;
  color: var(--color-text);
  margin-bottom: 1.5rem;
}

.status-error {
  color: var(--color-danger);
}

.chart-grid {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: 1rem;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  margin-bottom: 1.5rem;
}

.chart-card {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  min-height: 420px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.donut-card {
  display: flex;
  flex-direction: column;
}

.chart-canvas-wrapper {
  position: relative;
  flex: 1;
  min-height: 320px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.donut-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.chart-canvas-wrapper canvas {
  display: block;
  width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.donut-number {
  display: block;
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--color-primary);
}

.donut-label {
  display: block;
  color: var(--color-muted);
  margin-top: 0.35rem;
  font-size: 0.95rem;
}

.table-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.table-header h2 {
  margin: 0 0 0.35rem;
  font-size: 1.2rem;
}

.table-header p {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.95rem;
}

.table-scroll {
  overflow-x: auto;
  margin-top: 1rem;
}

.category-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 520px;
}

.category-table th,
.category-table td {
  padding: 0.95rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.category-table th {
  font-weight: 700;
  color: var(--color-muted);
  background: #f8fafc;
}

.category-table td:nth-child(2),
.category-table td:nth-child(3) {
  text-align: right;
}

@media (max-width: 1024px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .chart-card {
    min-height: 360px;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    align-items: stretch;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-container {
    padding-bottom: 1rem;
  }

  .chart-card {
    min-height: 320px;
  }
}

@media (max-width: 560px) {
  .dashboard-header {
    gap: 0.75rem;
  }

  .summary-card {
    padding: 1rem;
  }

  .chart-card {
    padding: 1rem;
  }

  .category-table th,
  .category-table td {
    padding: 0.85rem 0.85rem;
  }
}
</style>
