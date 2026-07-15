<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import Chart from 'chart.js/auto'
import { getDashboardData } from '../services/dashboardService.js'

const loading = ref(true)
const error = ref('')
const dashboardData = ref(null)
const visibleTotalLocations = ref(0)
const barChartRef = ref(null)
const doughnutChartRef = ref(null)
let barChartInstance = null
let doughnutChartInstance = null
const countAnimationId = ref(null)
const isReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const initialEntry = ref(true)

const formatNumber = (value) => {
  return value?.toLocaleString('ko-KR') ?? '0'
}

const displayCategory = (category) => {
  if (category === '축제공연행사') return '축제/공연행사'
  return category || '기타'
}

const categoryLabels = computed(() =>
  dashboardData.value?.category_counts.map((item) => displayCategory(item.category)) ?? []
)
const categoryCounts = computed(() => dashboardData.value?.category_counts.map((item) => item.count) ?? [])
const totalLocations = computed(() => dashboardData.value?.total_locations ?? 0)
const categoryItems = computed(() => {
  if (!dashboardData.value) return []
  return dashboardData.value.category_counts.map((item) => ({
    category: displayCategory(item.category),
    count: item.count ?? 0,
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
          borderRadius: 0,
          borderSkipped: false,
          maxBarThickness: 30,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 16, right: 12, left: 12, bottom: 12 },
      },
      animation: isReducedMotion
        ? false
        : {
            duration: 1000,
            easing: 'easeOutQuart',
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
              const value = context.parsed.x ?? 0
              const label = context.label || ''
              return `${label}: ${value.toLocaleString('ko-KR')}곳`
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(15, 23, 42, 0.08)' },
          ticks: {
            color: '#334155',
            callback: (value) => value.toLocaleString('ko-KR'),
          },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#334155',
            autoSkip: false,
            font: { size: 12 },
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
      animation: isReducedMotion
        ? false
        : {
            duration: 1000,
            animateRotate: true,
            animateScale: false,
            easing: 'easeOutQuart',
          },
      plugins: {
        legend: {
          position: 'bottom',
          align: 'center',
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

const animateCountUp = (target) => {
  if (isReducedMotion || !initialEntry.value) {
    visibleTotalLocations.value = target
    return
  }

  const duration = 800
  const start = performance.now()
  const fromValue = 0

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1)
    visibleTotalLocations.value = Math.round(fromValue + (target - fromValue) * progress)
    if (progress < 1) {
      countAnimationId.value = requestAnimationFrame(step)
    }
  }

  countAnimationId.value = requestAnimationFrame(step)
}

onMounted(async () => {
  await loadData()
  if (!error.value && dashboardData.value) {
    await nextTick()

    const animationDelay = isReducedMotion ? 0 : 280
    if (animationDelay) {
      await new Promise((resolve) => setTimeout(resolve, animationDelay))
    }

    createBarChart()
    createDoughnutChart()
    animateCountUp(totalLocations.value)
    initialEntry.value = false
  }
})

onBeforeUnmount(() => {
  destroyCharts()
  if (countAnimationId.value) {
    cancelAnimationFrame(countAnimationId.value)
    countAnimationId.value = null
  }
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

      <div v-if="loading" class="dashboard-loading">
        <div class="summary-grid">
          <article class="summary-card skeleton-card">
            <div class="skeleton-line skeleton-label"></div>
            <div class="skeleton-line skeleton-value"></div>
          </article>
          <article class="summary-card skeleton-card">
            <div class="skeleton-line skeleton-label"></div>
            <div class="skeleton-line skeleton-value"></div>
          </article>
        </div>

        <div class="chart-grid">
          <article class="chart-card">
            <div class="chart-canvas-wrapper">
              <div class="skeleton-chart-area skeleton-bar-chart">
                <div class="skeleton-bar skeleton-bar-1"></div>
                <div class="skeleton-bar skeleton-bar-2"></div>
                <div class="skeleton-bar skeleton-bar-3"></div>
                <div class="skeleton-bar skeleton-bar-4"></div>
                <div class="skeleton-bar skeleton-bar-5"></div>
                <div class="skeleton-bar skeleton-bar-6"></div>
                <div class="skeleton-bar skeleton-bar-7"></div>
              </div>
            </div>
          </article>
          <article class="chart-card donut-card">
            <div class="chart-canvas-wrapper donut-wrapper">
              <div class="skeleton-chart-area skeleton-doughnut-chart">
                <div class="skeleton-doughnut-ring"></div>
                <div class="skeleton-doughnut-hole"></div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div v-else-if="error" class="status-card status-error">{{ error }}</div>

      <template v-else>
        <div class="summary-grid">
          <article class="summary-card fade-up">
            <p class="summary-label">전체 장소 수</p>
            <p class="summary-value">{{ formatNumber(visibleTotalLocations) }}곳</p>
          </article>
          <article class="summary-card fade-up">
            <p class="summary-label">카테고리 수</p>
            <p class="summary-value">{{ dashboardData?.category_counts?.length ?? 0 }}개</p>
          </article>
        </div>

        <div class="chart-grid">
          <article class="chart-card fade-up">
            <div class="chart-canvas-wrapper">
              <canvas v-if="!loading" ref="barChartRef" aria-label="카테고리별 장소 수 막대그래프"></canvas>
            </div>
          </article>

          <article class="chart-card donut-card fade-up">
            <div class="chart-canvas-wrapper donut-wrapper">
              <canvas v-if="!loading" ref="doughnutChartRef" aria-label="카테고리별 비율 도넛그래프"></canvas>
              <div class="donut-center">
                <span class="donut-number">{{ formatNumber(visibleTotalLocations) }}</span>
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

.skeleton-card {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: transparent;
  position: relative;
  overflow: hidden;
}

.skeleton-line,
.skeleton-chart {
  border-radius: 1rem;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.9) 25%, rgba(241, 245, 249, 0.9) 50%, rgba(226, 232, 240, 0.9) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s linear infinite;
}

.skeleton-line {
  width: 100%;
  margin-bottom: 0.9rem;
  min-height: 1rem;
}

.skeleton-label {
  width: 50%;
  height: 0.95rem;
}

.skeleton-value {
  width: 40%;
  height: 1.6rem;
}

.skeleton-chart {
  width: 100%;
  min-height: 280px;
}

.skeleton-chart-area {
  position: relative;
  width: 100%;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;
}

.skeleton-bar-chart {
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  display: grid;
  gap: 0.75rem;
}

.skeleton-bar {
  height: 16px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.9) 25%, rgba(241, 245, 249, 0.9) 50%, rgba(226, 232, 240, 0.9) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s linear infinite;
}

.skeleton-bar-1 { width: 85%; }
.skeleton-bar-2 { width: 70%; }
.skeleton-bar-3 { width: 90%; }
.skeleton-bar-4 { width: 60%; }
.skeleton-bar-5 { width: 75%; }
.skeleton-bar-6 { width: 50%; }
.skeleton-bar-7 { width: 80%; }

.skeleton-doughnut-chart {
  position: relative;
  width: 100%;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skeleton-doughnut-ring {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(226, 232, 240, 0.95), rgba(241, 245, 249, 0.95));
  position: relative;
  animation: shimmer 1.6s linear infinite;
}

.skeleton-doughnut-hole {
  position: absolute;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--color-surface);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-line,
  .skeleton-chart,
  .skeleton-bar,
  .skeleton-doughnut-ring {
    animation: none;
  }
}

.summary-card,
.chart-card,
.table-card {
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.summary-card.fade-up,
.chart-card.fade-up,
.table-card.fade-up {
  opacity: 0;
  transform: translateY(10px);
  animation: fadeUp 240ms ease-out forwards;
}

.summary-card.fade-up:nth-of-type(1) {
  animation-delay: 0.05s;
}

.summary-card.fade-up:nth-of-type(2) {
  animation-delay: 0.12s;
}

.chart-card.fade-up {
  animation-delay: 0.18s;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chart-card:hover,
.summary-card:hover,
.table-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
}

.chart-grid {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: 1rem;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  margin-bottom: 1.5rem;
}

@media (prefers-reduced-motion: reduce) {
  .summary-card,
  .chart-card,
  .table-card {
    transition: none;
  }

  .summary-card.fade-up,
  .chart-card.fade-up,
  .table-card.fade-up {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .chart-card:hover,
  .summary-card:hover,
  .table-card:hover {
    transform: none;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  }
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
