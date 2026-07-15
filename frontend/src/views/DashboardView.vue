<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import { getDashboardData } from '../services/dashboardService.js'
import { getPosts } from '../services/postService.js'

const router = useRouter()

const loading = ref(true)
const error = ref('')
const dashboardData = ref(null)
const postSummaryData = ref(null)
const recentPosts = ref([])
const postCategoryCounts = ref({})

const postCategories = ['관광지', '문화시설', '축제공연행사', '여행코스', '레포츠', '숙박', '쇼핑']
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

// Computed for location data
const categoryLabels = computed(() =>
  dashboardData.value?.category_counts.map((item) => displayCategory(item.category)) ?? []
)
const categoryCounts = computed(() => dashboardData.value?.category_counts.map((item) => item.count) ?? [])
const totalLocations = computed(() => dashboardData.value?.total_locations ?? 0)
const totalPosts = computed(() => postSummaryData.value?.total ?? 0)

// Key metrics
const maxLocationCategory = computed(() => {
  if (!dashboardData.value?.category_counts?.length) return null
  const max = dashboardData.value.category_counts.reduce((prev, current) =>
    prev.count > current.count ? prev : current
  )
  return {
    category: displayCategory(max.category),
    count: max.count,
    ratio: totalLocations.value ? ((max.count / totalLocations.value) * 100).toFixed(1) : '0.0',
  }
})

const maxPostCategory = computed(() => {
  if (!Object.keys(postCategoryCounts.value).length) return null
  let max = null
  let maxCount = 0
  for (const [category, count] of Object.entries(postCategoryCounts.value)) {
    if (count > maxCount) {
      maxCount = count
      max = category
    }
  }
  if (!max) return null
  return {
    category: displayCategory(max),
    count: maxCount,
    ratio: totalPosts.value ? ((maxCount / totalPosts.value) * 100).toFixed(1) : '0.0',
  }
})

const minLocationCategory = computed(() => {
  if (!dashboardData.value?.category_counts?.length) return null
  const min = dashboardData.value.category_counts.reduce((prev, current) =>
    prev.count < current.count ? prev : current
  )
  return {
    category: displayCategory(min.category),
    count: min.count,
  }
})

// Insights
const insights = computed(() => {
  const result = []
  if (maxLocationCategory.value) {
    result.push(`${maxLocationCategory.value.category} 장소가 전체 장소 중 가장 많습니다.`)
  }
  if (maxPostCategory.value) {
    result.push(`${maxPostCategory.value.category} 카테고리에서 가장 많은 지역 이야기가 작성되고 있습니다.`)
  }
  if (minLocationCategory.value && totalLocations.value > 0) {
    result.push(`${minLocationCategory.value.category}는 등록 장소가 가장 적은 카테고리입니다.`)
  }
  return result
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
    // Load location data
    dashboardData.value = await getDashboardData()

    // Load post summary (total posts)
    postSummaryData.value = await getPosts({ page: 1, size: 1 })

    // Load post counts by category in parallel
    const categoryPromises = postCategories.map((category) =>
      getPosts({ category, page: 1, size: 1 })
        .then((data) => {
          postCategoryCounts.value[category] = data?.total ?? 0
        })
        .catch((err) => {
          console.error(`Failed to load posts for category ${category}:`, err)
          postCategoryCounts.value[category] = 0
        })
    )
    await Promise.all(categoryPromises)

    // Load recent posts
    const recentData = await getPosts({ page: 1, size: 3 })
    recentPosts.value = recentData?.items ?? []
  } catch (e) {
    console.error('Dashboard error:', e)
    error.value = '대시보드 데이터를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

const animateCountUp = (target) => {
  if (isReducedMotion || !initialEntry.value) {
    return
  }

  const duration = 800
  const start = performance.now()
  const fromValue = 0

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1)
    // Animation for visual effect only, value stays the same
    if (progress < 1) {
      countAnimationId.value = requestAnimationFrame(step)
    }
  }

  countAnimationId.value = requestAnimationFrame(step)
}

const goToPostDetail = (id) => {
  router.push(`/posts/${id}`)
}

const goToCreatePost = () => {
  router.push('/posts/create')
}

const goToBoard = () => {
  router.push('/board')
}

const formatPostDate = (dateString) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
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
          <p>서울의 장소와 지역 이야기를 한눈에 확인하세요.</p>
        </div>
      </div>

      <div v-if="loading" class="dashboard-loading">
        <div class="metrics-grid">
          <article v-for="i in 4" :key="i" class="metric-card skeleton-card">
            <div class="skeleton-line skeleton-label"></div>
            <div class="skeleton-line skeleton-value"></div>
          </article>
        </div>
        <div class="chart-grid">
          <article class="chart-card">
            <div class="skeleton-chart"></div>
          </article>
          <article class="chart-card">
            <div class="skeleton-chart"></div>
          </article>
        </div>
      </div>

      <div v-else-if="error" class="status-card status-error">{{ error }}</div>

      <template v-else>
        <!-- 상단 4개 지표 카드 -->
        <div class="metrics-grid">
          <article class="metric-card fade-up">
            <p class="metric-label">전체 장소</p>
            <p class="metric-value">{{ formatNumber(totalLocations) }}</p>
            <p class="metric-unit">개</p>
          </article>

          <article class="metric-card fade-up">
            <p class="metric-label">전체 게시글</p>
            <p class="metric-value">{{ formatNumber(totalPosts) }}</p>
            <p class="metric-unit">개</p>
          </article>

          <article class="metric-card fade-up">
            <p class="metric-label">장소 가장 많은 카테고리</p>
            <p class="metric-value" v-if="maxLocationCategory">{{ maxLocationCategory.category }}</p>
            <p class="metric-subtext" v-if="maxLocationCategory">전체 장소의 {{ maxLocationCategory.ratio }}%</p>
          </article>

          <article class="metric-card fade-up">
            <p class="metric-label">활발한 게시글 카테고리</p>
            <p class="metric-value" v-if="maxPostCategory">{{ maxPostCategory.category }}</p>
            <p class="metric-subtext" v-if="maxPostCategory">전체 게시글의 {{ maxPostCategory.ratio }}%</p>
          </article>
        </div>

        <!-- 차트 2개 -->
        <div class="chart-grid">
          <article class="chart-card fade-up">
            <div class="chart-canvas-wrapper">
              <canvas v-if="!loading && totalLocations > 0" ref="barChartRef" aria-label="카테고리별 장소 수 막대그래프"></canvas>
              <div v-else class="chart-empty">
                <p>장소 데이터가 없습니다.</p>
              </div>
            </div>
          </article>

          <article class="chart-card donut-card fade-up">
            <div class="chart-canvas-wrapper donut-wrapper">
              <canvas v-if="!loading && totalLocations > 0" ref="doughnutChartRef" aria-label="카테고리별 비율 도넛그래프"></canvas>
              <div v-else class="chart-empty">
                <p>장소 데이터가 없습니다.</p>
              </div>
              <div v-if="totalLocations > 0" class="donut-center">
                <span class="donut-number">{{ formatNumber(totalLocations) }}</span>
                <span class="donut-label">전체 장소</span>
              </div>
            </div>
          </article>
        </div>

        <!-- 서울 데이터 인사이트 -->
        <div v-if="insights.length > 0" class="insights-section fade-up">
          <div class="insights-header">
            <h2>📊 서울 데이터 인사이트</h2>
          </div>
          <div class="insights-grid">
            <div v-for="(insight, index) in insights" :key="index" class="insight-item">
              <div class="insight-icon">{{ index === 0 ? '📍' : index === 1 ? '📝' : '📉' }}</div>
              <p class="insight-text">{{ insight }}</p>
            </div>
          </div>
        </div>

        <!-- 최근 지역 이야기 -->
        <div class="recent-posts-section fade-up">
          <div class="recent-posts-header">
            <h2>최근 지역 이야기</h2>
            <button type="button" class="view-all-button" @click="goToBoard">전체 보기</button>
          </div>

          <div v-if="recentPosts.length > 0" class="posts-grid">
            <article v-for="post in recentPosts" :key="post.id" class="post-card" @click="goToPostDetail(post.id)">
              <div class="post-icon">{{ post.category.charAt(0) }}</div>
              <div class="post-content">
                <div class="post-title">{{ post.title }}</div>
                <div class="post-meta">
                  <span class="post-category">{{ displayCategory(post.category) }}</span>
                  <span class="post-date">{{ formatPostDate(post.created_at) }}</span>
                  <span v-if="post.view_count" class="post-views">조회 {{ post.view_count }}</span>
                </div>
                <p v-if="post.content" class="post-preview">{{ truncateText(post.content, 80) }}</p>
              </div>
            </article>
          </div>

          <div v-else class="empty-state">
            <p>아직 작성된 지역 이야기가 없습니다.</p>
            <button type="button" class="create-button" @click="goToCreatePost">게시글 작성하기</button>
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
  margin-bottom: 1.8rem;
  flex-wrap: wrap;
}

.dashboard-header h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(1.8rem, 2.1vw, 2.3rem);
  color: #0f172a;
}

.dashboard-header p {
  margin: 0;
  color: var(--color-muted);
  max-width: 680px;
  font-size: 1rem;
}

/* 지표 카드 그리드 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.metric-label {
  margin: 0 0 0.75rem;
  color: var(--color-muted);
  font-size: 0.95rem;
  font-weight: 600;
}

.metric-value {
  margin: 0 0 0.25rem;
  font-size: 1.9rem;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1.2;
}

.metric-unit {
  margin: 0;
  color: var(--color-muted);
  font-size: 1rem;
}

.metric-subtext {
  margin: 0.5rem 0 0;
  color: var(--color-muted);
  font-size: 0.9rem;
}

/* 로딩 상태 */
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
  width: 60%;
  height: 0.95rem;
}

.skeleton-value {
  width: 50%;
  height: 1.8rem;
}

.skeleton-chart {
  width: 100%;
  min-height: 360px;
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
  .skeleton-chart {
    animation: none;
  }
}

/* 차트 그리드 */
.chart-grid {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: 1rem;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  margin-bottom: 2rem;
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

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-muted);
  font-size: 0.95rem;
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

/* 인사이트 섹션 */
.insights-section {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  margin-bottom: 2rem;
}

.insights-header h2 {
  margin: 0 0 1.25rem;
  font-size: 1.3rem;
  color: #0f172a;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.insight-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 0;
}

.insight-icon {
  flex-shrink: 0;
  font-size: 1.5rem;
}

.insight-text {
  margin: 0;
  color: var(--color-text);
  font-size: 0.95rem;
  line-height: 1.6;
}

/* 최근 지역 이야기 섹션 */
.recent-posts-section {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.recent-posts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.recent-posts-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #0f172a;
}

.view-all-button,
.create-button {
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  background: #f8fafc;
  color: var(--color-primary);
  padding: 0.75rem 1rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 150ms ease, color 150ms ease;
}

.view-all-button:hover {
  background: #eff6ff;
  border-color: var(--color-primary);
}

.create-button {
  background: var(--color-primary);
  color: #fff;
  border: none;
}

.create-button:hover {
  background: rgba(14, 118, 255, 0.9);
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.post-card {
  background: #f9fafb;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease;
}

.post-card:hover {
  transform: translateY(-2px);
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.post-icon {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(14, 118, 255, 0.1), rgba(14, 118, 255, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.5rem;
  color: var(--color-primary);
}

.post-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.post-title {
  margin: 0 0 0.5rem;
  font-weight: 700;
  color: #0f172a;
  font-size: 1rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
}

.post-category {
  display: inline-block;
  background: rgba(14, 118, 255, 0.12);
  color: var(--color-primary);
  padding: 0.25rem 0.6rem;
  border-radius: 0.4rem;
  font-weight: 600;
}

.post-date {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.post-views {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.post-preview {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
}

.empty-state p {
  margin: 0 0 1rem;
  color: var(--color-muted);
  font-size: 1rem;
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

/* 애니메이션 */
.metric-card,
.chart-card,
.insights-section,
.recent-posts-section {
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.fade-up {
  opacity: 0;
  transform: translateY(10px);
  animation: fadeUp 240ms ease-out forwards;
}

.fade-up:nth-of-type(1) {
  animation-delay: 0.05s;
}

.fade-up:nth-of-type(2) {
  animation-delay: 0.12s;
}

.fade-up:nth-of-type(3) {
  animation-delay: 0.18s;
}

.fade-up:nth-of-type(4) {
  animation-delay: 0.24s;
}

.fade-up:nth-of-type(5) {
  animation-delay: 0.3s;
}

.fade-up:nth-of-type(6) {
  animation-delay: 0.36s;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.metric-card:hover,
.chart-card:hover,
.insights-section:hover,
.recent-posts-section:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
}

@media (prefers-reduced-motion: reduce) {
  .metric-card,
  .chart-card,
  .insights-section,
  .recent-posts-section {
    transition: none;
  }

  .fade-up {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .metric-card:hover,
  .chart-card:hover,
  .insights-section:hover,
  .recent-posts-section:hover {
    transform: none;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  }
}

/* 반응형 */
@media (max-width: 1280px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .chart-card {
    min-height: 360px;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    align-items: stretch;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .metric-card {
    padding: 1.2rem 1rem;
  }

  .metric-value {
    font-size: 1.6rem;
  }

  .dashboard-container {
    padding-bottom: 1rem;
  }

  .chart-card {
    min-height: 320px;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

  .recent-posts-header {
    flex-direction: column;
    align-items: stretch;
  }

  .view-all-button {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 560px) {
  .dashboard-header {
    gap: 0.75rem;
  }

  .dashboard-header h1 {
    font-size: 1.6rem;
  }

  .metric-card {
    padding: 1rem;
  }

  .metric-value {
    font-size: 1.4rem;
  }

  .metric-label {
    font-size: 0.9rem;
  }

  .chart-card {
    padding: 0.9rem;
    min-height: 300px;
  }

  .chart-canvas-wrapper {
    min-height: 260px;
  }

  .post-card {
    flex-direction: column;
    text-align: center;
  }

  .post-icon {
    margin: 0 auto;
  }

  .post-title {
    text-align: left;
  }

  .post-meta {
    justify-content: center;
  }

  .recent-posts-section {
    padding: 1rem;
  }

  .insights-section {
    padding: 1rem;
  }
}
</style>
