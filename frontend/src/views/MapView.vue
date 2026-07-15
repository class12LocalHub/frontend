<script setup>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
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
const SEOUL_CENTER = [37.5665, 126.978]
const DEFAULT_ZOOM = 12
const LOCATION_ZOOM = 14
const NEARBY_LIMIT = 20
const NEARBY_REQUEST_SIZE = 100
const filters = ref({ place_types: [], regions: [], categories: [] })
const form = reactive({ placeType: 'all', category: '', region: '' })
const inputKeyword = ref('')
const committedKeyword = ref('')
const suggestions = ref([])
const isSuggesting = ref(false)
const isSuggestionOpen = ref(false)
const activeSuggestionIndex = ref(-1)
const suggestionError = ref('')
const hasSuggested = ref(false)
const pois = ref([])
const pagination = reactive({ total: 0, page: 1, size: 20, totalPages: 0 })
const selectedPoi = ref(null)
const isSearching = ref(false)
const isLocating = ref(false)
const isInitialLoading = ref(true)
const isDetailLoading = ref(false)
const currentPosition = ref(null)
const locationError = ref('')
const searchError = ref('')
const filterError = ref('')
const hasMapMoved = ref(false)
const isNearbyResults = ref(false)
const detailError = ref('')
const mapContainer = ref(null)
const markersById = new Map()
const activeSuggestionId = computed(() => {
  const suggestion = suggestions.value[activeSuggestionIndex.value]

  return suggestion ? suggestionOptionId(suggestion) : undefined
})

const locationStatusMessage = computed(() => {
  if (isLocating.value) return '현재 위치를 확인하고 있습니다.'
  if (!isNearbyResults.value) return ''
  if (currentPosition.value?.isFallback) return '서울 중심 기준 장소입니다.'
  if (currentPosition.value) return '현재 위치 주변 장소입니다.'
  return ''
})

let leafletMap = null
let markerLayer = null
let locationLayer = null
let currentLocationMarker = null
let accuracyCircle = null
let openPopupMarker = null
let searchAbortController = null
let suggestionAbortController = null
let detailAbortController = null
let suggestionDebounceTimer = null
let programmaticMoveTimer = null
let poiRequestId = 0
let suggestionRequestId = 0
let detailRequestId = 0
let programmaticMoveToken = 0
let isProgrammaticMove = false
let userMoveStarted = false
let isMapReady = false
let pendingLocationOptions = null
let pendingRouteSearchOptions = null
let lastSearchOptions = { viewport: 'fit' }
let lastScheduledSuggestionKey = ''
let lastRequestedSuggestionKey = ''

function getCoordinates(place) {
  const latitudeValue = place?.latitude ?? place?.mapy
  const longitudeValue = place?.longitude ?? place?.mapx

  if (latitudeValue === null || latitudeValue === undefined) return null
  if (longitudeValue === null || longitudeValue === undefined) return null

  const latitude = Number(latitudeValue)
  const longitude = Number(longitudeValue)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  return [latitude, longitude]
}

function calculateDistanceKm(latitude1, longitude1, latitude2, longitude2) {
  const earthRadiusKm = 6371
  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const latitudeDelta = toRadians(latitude2 - latitude1)
  const longitudeDelta = toRadians(longitude2 - longitude1)
  const startLatitude = toRadians(latitude1)
  const endLatitude = toRadians(latitude2)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function createRadiusBbox(latitude, longitude, radiusKm) {
  const latitudeDelta = radiusKm / 111.32
  const longitudeScale = Math.max(Math.cos((latitude * Math.PI) / 180), 0.01)
  const longitudeDelta = radiusKm / (111.32 * longitudeScale)

  return [
    longitude - longitudeDelta,
    latitude - latitudeDelta,
    longitude + longitudeDelta,
    latitude + latitudeDelta,
  ]
    .map((value) => value.toFixed(6))
    .join(',')
}

function getMapBoundsBbox() {
  if (!leafletMap) return ''

  const bounds = leafletMap.getBounds()

  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
    .map((value) => value.toFixed(6))
    .join(',')
}

function isSelected(place) {
  if (!selectedPoi.value || !place) return false

  return normalizeTourApiId(selectedPoi.value.id) === normalizeTourApiId(place.id)
}

function createPinIcon(selected = false) {
  const pin = document.createElement('span')
  pin.className = selected ? 'localhub-map-pin is-selected' : 'localhub-map-pin'
  pin.setAttribute('aria-hidden', 'true')

  return L.divIcon({
    className: 'localhub-div-icon',
    html: pin,
    iconSize: [32, 42],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  })
}

function createPopupContent(place) {
  const container = document.createElement('div')
  container.className = 'localhub-popup'

  const name = document.createElement('strong')
  name.textContent = place.name

  const category = document.createElement('span')
  category.textContent = place.category

  const address = document.createElement('small')
  address.textContent = place.address || '주소 정보 없음'

  container.append(name, category, address)

  return container
}

function createTooltipContent(place) {
  const container = document.createElement('div')
  container.className = 'localhub-tooltip-content'

  const name = document.createElement('strong')
  name.textContent = place.name

  const category = document.createElement('span')
  category.textContent = place.category

  const address = document.createElement('small')
  address.textContent = place.address || '주소 정보 없음'

  container.append(name, category, address)

  return container
}

function updateMarkerSelection() {
  const selectedId = selectedPoi.value ? normalizeTourApiId(selectedPoi.value.id) : null

  for (const [id, marker] of markersById) {
    marker.setIcon(createPinIcon(id === selectedId))
  }
}

function runProgrammaticMove(moveMap, onComplete) {
  if (!leafletMap) {
    onComplete?.()
    return
  }

  const moveToken = ++programmaticMoveToken
  isProgrammaticMove = true
  userMoveStarted = false
  hasMapMoved.value = false

  if (programmaticMoveTimer) clearTimeout(programmaticMoveTimer)

  let completed = false
  const finishMove = () => {
    if (completed || moveToken !== programmaticMoveToken) return

    completed = true
    leafletMap?.off('moveend', finishMove)
    if (programmaticMoveTimer) {
      clearTimeout(programmaticMoveTimer)
      programmaticMoveTimer = null
    }
    isProgrammaticMove = false
    onComplete?.()
  }

  leafletMap.once('moveend', finishMove)
  moveMap()
  programmaticMoveTimer = setTimeout(finishMove, 1800)
}

function cancelProgrammaticMove() {
  programmaticMoveToken += 1
  isProgrammaticMove = false
  userMoveStarted = false

  if (programmaticMoveTimer) {
    clearTimeout(programmaticMoveTimer)
    programmaticMoveTimer = null
  }
}

function moveToSearchResults(places, options = {}) {
  if (!leafletMap) return

  const coordinates = places.map(getCoordinates).filter(Boolean)
  if (coordinates.length === 0) return

  if (coordinates.length === 1) {
    const place = places.find((item) => getCoordinates(item))
    if (place) focusPlace(place, 16, options.openSinglePopup !== false)
    return
  }

  runProgrammaticMove(() => {
    leafletMap.flyToBounds(L.latLngBounds(coordinates), {
      animate: true,
      duration: 0.9,
      maxZoom: 15,
      padding: [32, 32],
    })
  })
}

function updateMarkers(places) {
  if (!leafletMap || !markerLayer) return

  if (openPopupMarker) {
    openPopupMarker.closePopup()
    openPopupMarker = null
  }

  markerLayer.clearLayers()
  markersById.clear()

  for (const place of places) {
    const coordinates = getCoordinates(place)
    if (!coordinates) continue

    const id = normalizeTourApiId(place.id)
    const marker = L.marker(coordinates, {
      icon: createPinIcon(isSelected(place)),
      title: place.name,
    })

    marker.on('click', () => {
      marker.closeTooltip()

      if (openPopupMarker && openPopupMarker !== marker) {
        openPopupMarker.closePopup()
      }

      selectPoi(place, { moveMap: false, openPopup: false })
    })
    marker.bindPopup(createPopupContent(place), {
      autoClose: true,
      autoPan: false,
      className: 'localhub-popup-shell',
      closeOnClick: true,
      maxWidth: 320,
      minWidth: 220,
    })
    marker.bindTooltip(createTooltipContent(place), {
      className: 'localhub-tooltip',
      direction: 'top',
      offset: L.point(0, -34),
      opacity: 1,
    })
    marker.on({
      mouseover: () => {
        if (openPopupMarker === marker) {
          marker.closeTooltip()
          return
        }

        marker.openTooltip()
      },
      mouseout: () => {
        marker.closeTooltip()
      },
      popupopen: () => {
        marker.closeTooltip()
        openPopupMarker = marker
      },
      popupclose: () => {
        if (openPopupMarker === marker) openPopupMarker = null
      },
    })
    marker.addTo(markerLayer)
    markersById.set(id, marker)
  }
}

function focusPlace(place, zoom = 16, openPopup = true) {
  if (!leafletMap) return

  const coordinates = getCoordinates(place)
  if (!coordinates) return

  const openPlacePopup = () => {
    if (!openPopup) return

    const marker = markersById.get(normalizeTourApiId(place.id))
    if (!marker) return

    marker.closeTooltip()
    marker.openPopup()
  }

  runProgrammaticMove(
    () => leafletMap.flyTo(coordinates, zoom, { animate: true, duration: 0.9 }),
    openPlacePopup,
  )
}

function handleMapMoveStart() {
  if (!isProgrammaticMove) userMoveStarted = true
}

function handleMapMoveEnd() {
  if (userMoveStarted && !isProgrammaticMove) hasMapMoved.value = true
  userMoveStarted = false
}

function updateCurrentLocationLayers(position) {
  if (!leafletMap || !locationLayer || position.isFallback) return

  const coordinates = [position.latitude, position.longitude]

  if (currentLocationMarker) {
    currentLocationMarker.setLatLng(coordinates)
  } else {
    currentLocationMarker = L.circleMarker(coordinates, {
      radius: 8,
      color: '#ffffff',
      weight: 3,
      fillColor: '#2563eb',
      fillOpacity: 1,
    })
      .bindTooltip('현재 위치', { direction: 'top', offset: L.point(0, -8) })
      .addTo(locationLayer)
  }

  const accuracy = Math.max(0, Number(position.accuracy) || 0)
  if (accuracyCircle) {
    accuracyCircle.setLatLng(coordinates).setRadius(accuracy)
  } else {
    accuracyCircle = L.circle(coordinates, {
      radius: accuracy,
      color: '#2563eb',
      weight: 1,
      fillColor: '#60a5fa',
      fillOpacity: 0.14,
      interactive: false,
    }).addTo(locationLayer)
  }
}

function clearCurrentLocationLayers() {
  if (currentLocationMarker) locationLayer?.removeLayer(currentLocationMarker)
  if (accuracyCircle) locationLayer?.removeLayer(accuracyCircle)
  currentLocationMarker = null
  accuracyCircle = null
}

function initializeMap() {
  if (!mapContainer.value || leafletMap) return

  leafletMap = L.map(mapContainer.value, {
    center: SEOUL_CENTER,
    zoom: DEFAULT_ZOOM,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(leafletMap)

  markerLayer = L.layerGroup().addTo(leafletMap)
  locationLayer = L.layerGroup().addTo(leafletMap)
  leafletMap.on('locationfound', handleLocationFound)
  leafletMap.on('locationerror', handleLocationError)
  leafletMap.on('movestart', handleMapMoveStart)
  leafletMap.on('moveend', handleMapMoveEnd)
  updateMarkers(pois.value)
  leafletMap.invalidateSize()
  isMapReady = true
}

function suggestionOptionId(place) {
  return `map-suggestion-${normalizeTourApiId(place.id)}`
}

function buildSuggestionKey(keyword) {
  return JSON.stringify([
    keyword,
    form.placeType,
    form.category,
    form.region,
  ])
}

function cancelSuggestionRequest() {
  if (suggestionDebounceTimer) {
    clearTimeout(suggestionDebounceTimer)
    suggestionDebounceTimer = null
  }

  if (suggestionAbortController) {
    suggestionAbortController.abort()
    suggestionAbortController = null
  }

  suggestionRequestId += 1
  isSuggesting.value = false
}

function resetSuggestionState() {
  cancelSuggestionRequest()
  suggestions.value = []
  suggestionError.value = ''
  hasSuggested.value = false
  isSuggestionOpen.value = false
  activeSuggestionIndex.value = -1
  lastScheduledSuggestionKey = ''
  lastRequestedSuggestionKey = ''
}

function closeSuggestionDropdown() {
  cancelSuggestionRequest()
  isSuggestionOpen.value = false
  activeSuggestionIndex.value = -1
}

async function requestSuggestions(keyword, requestKey) {
  suggestionDebounceTimer = null

  if (inputKeyword.value.trim() !== keyword || buildSuggestionKey(keyword) !== requestKey) {
    isSuggesting.value = false
    return
  }

  const requestId = ++suggestionRequestId
  suggestionAbortController = new AbortController()
  lastRequestedSuggestionKey = requestKey

  try {
    const response = await getMapPois(
      {
        keyword,
        place_type: form.placeType,
        category: form.category,
        region: form.region,
        page: 1,
        size: 8,
      },
      { signal: suggestionAbortController.signal },
    )

    if (requestId !== suggestionRequestId) return
    if (inputKeyword.value.trim() !== keyword || buildSuggestionKey(keyword) !== requestKey) return

    suggestions.value = response.data.items.slice(0, 8)
    suggestionError.value = ''
    hasSuggested.value = true
    isSuggestionOpen.value = true
    activeSuggestionIndex.value = -1
  } catch (error) {
    if (requestId !== suggestionRequestId || error.code === 'ERR_CANCELED') return

    lastRequestedSuggestionKey = ''
    suggestions.value = []
    suggestionError.value = getApiErrorMessage(error, '추천 장소를 불러오지 못했습니다.')
    hasSuggested.value = true
    isSuggestionOpen.value = true
    activeSuggestionIndex.value = -1
  } finally {
    if (requestId === suggestionRequestId) {
      suggestionAbortController = null
      isSuggesting.value = false
    }
  }
}

function scheduleSuggestions(value) {
  inputKeyword.value = value
  const keyword = value.trim()

  if (!keyword) {
    resetSuggestionState()
    return
  }

  const requestKey = buildSuggestionKey(keyword)

  if (
    requestKey === lastScheduledSuggestionKey &&
    (suggestionDebounceTimer || suggestionAbortController)
  ) {
    return
  }

  if (requestKey === lastRequestedSuggestionKey && hasSuggested.value) {
    isSuggestionOpen.value = true
    return
  }

  cancelSuggestionRequest()
  lastScheduledSuggestionKey = requestKey
  suggestions.value = []
  suggestionError.value = ''
  hasSuggested.value = false
  isSuggestionOpen.value = true
  activeSuggestionIndex.value = -1
  isSuggesting.value = true
  suggestionDebounceTimer = setTimeout(() => requestSuggestions(keyword, requestKey), 250)
}

function handleKeywordInput(event) {
  scheduleSuggestions(event.target.value)
}

function handleKeywordCompositionUpdate(event) {
  scheduleSuggestions(event.target.value)
}

function handleKeywordCompositionEnd(event) {
  scheduleSuggestions(event.target.value)
}

function handleKeywordFocus() {
  if (suggestions.value.length > 0) {
    isSuggestionOpen.value = true
    return
  }

  if (inputKeyword.value.trim() && !isSuggesting.value) {
    lastScheduledSuggestionKey = ''
    scheduleSuggestions(inputKeyword.value)
  }
}

function handleSuggestionFilterChange() {
  if (inputKeyword.value.trim()) scheduleSuggestions(inputKeyword.value)
}

function scrollActiveSuggestionIntoView() {
  nextTick(() => {
    if (!activeSuggestionId.value) return

    document.getElementById(activeSuggestionId.value)?.scrollIntoView({ block: 'nearest' })
  })
}

function handleKeywordKeydown(event) {
  if (event.isComposing) {
    if (event.key === 'Enter') event.preventDefault()
    return
  }

  if (event.key === 'ArrowDown') {
    if (!suggestions.value.length) return
    event.preventDefault()
    isSuggestionOpen.value = true
    activeSuggestionIndex.value = Math.min(activeSuggestionIndex.value + 1, suggestions.value.length - 1)
    scrollActiveSuggestionIntoView()
    return
  }

  if (event.key === 'ArrowUp') {
    if (!suggestions.value.length) return
    event.preventDefault()
    isSuggestionOpen.value = true
    activeSuggestionIndex.value =
      activeSuggestionIndex.value <= 0 ? suggestions.value.length - 1 : activeSuggestionIndex.value - 1
    scrollActiveSuggestionIntoView()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    const activeSuggestion = suggestions.value[activeSuggestionIndex.value]

    if (isSuggestionOpen.value && activeSuggestion) {
      selectSuggestion(activeSuggestion)
      return
    }

    searchPlaces()
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    closeSuggestionDropdown()
    return
  }

  if (event.key === 'Tab') closeSuggestionDropdown()
}

function selectSuggestion(place) {
  inputKeyword.value = place.name
  committedKeyword.value = place.name
  resetSuggestionState()
  searchPlaces(place.name, { focusId: place.id })
}

function syncForm() {
  form.placeType = typeof route.query.placeType === 'string' ? route.query.placeType : 'all'
  form.category = typeof route.query.category === 'string' ? route.query.category : ''
  form.region = typeof route.query.region === 'string' ? route.query.region : ''
  committedKeyword.value = typeof route.query.keyword === 'string' ? route.query.keyword : ''
  inputKeyword.value = committedKeyword.value
}

function hasExplicitInitialSearch() {
  return ['placeType', 'category', 'keyword', 'region', 'bbox', 'page'].some(
    (key) => typeof route.query[key] === 'string' && route.query[key] !== '',
  )
}

function normalizeNearbyPlaces(items, position) {
  return items
    .map((place) => {
      const coordinates = getCoordinates(place)
      if (!coordinates) return null

      return {
        ...place,
        latitude: coordinates[0],
        longitude: coordinates[1],
        distanceKm: calculateDistanceKm(
          position.latitude,
          position.longitude,
          coordinates[0],
          coordinates[1],
        ),
      }
    })
    .filter(Boolean)
    .sort((first, second) => first.distanceKm - second.distanceKm)
}

function applyResultPagination(responseData, displayedItems = responseData.items) {
  pagination.total = responseData.total
  pagination.page = responseData.page
  pagination.size = responseData.size
  pagination.totalPages = responseData.total_pages

  if (displayedItems !== responseData.items) {
    pagination.total = displayedItems.length
    pagination.page = 1
    pagination.size = NEARBY_LIMIT
    pagination.totalPages = displayedItems.length ? 1 : 0
  }
}

async function loadNearbyPlaces(position) {
  if (searchAbortController) searchAbortController.abort()

  const requestId = ++poiRequestId
  searchAbortController = new AbortController()
  resetSuggestionState()
  isInitialLoading.value = true
  isNearbyResults.value = true
  searchError.value = ''
  selectedPoi.value = null
  detailError.value = ''

  if (detailAbortController) {
    detailAbortController.abort()
    detailAbortController = null
    detailRequestId += 1
    isDetailLoading.value = false
  }

  form.placeType = 'tourist'
  form.category = ''
  form.region = '서울'
  inputKeyword.value = ''
  committedKeyword.value = ''

  try {
    let normalizedPlaces = []
    let lastResponseData = null

    for (const radiusKm of [5, 10]) {
      const response = await getMapPois(
        {
          place_type: 'tourist',
          region: '서울',
          bbox: createRadiusBbox(position.latitude, position.longitude, radiusKm),
          page: 1,
          size: NEARBY_REQUEST_SIZE,
        },
        { signal: searchAbortController.signal },
      )

      if (requestId !== poiRequestId) return

      lastResponseData = response.data
      normalizedPlaces = normalizeNearbyPlaces(response.data.items, position)
      if (normalizedPlaces.length >= NEARBY_LIMIT || radiusKm === 10) break
    }

    const nearbyPlaces = normalizedPlaces.slice(0, NEARBY_LIMIT)
    pois.value = nearbyPlaces
    applyResultPagination(lastResponseData, nearbyPlaces)
    hasMapMoved.value = false
  } catch (error) {
    if (requestId !== poiRequestId || error.code === 'ERR_CANCELED') return

    pois.value = []
    pagination.total = 0
    pagination.totalPages = 0
    searchError.value = getApiErrorMessage(error, '주변 장소를 불러오지 못했습니다.')
  } finally {
    if (requestId === poiRequestId) {
      searchAbortController = null
      isInitialLoading.value = false
    }
  }
}

function moveToPositionAndLoadNearby(position) {
  currentPosition.value = position
  updateCurrentLocationLayers(position)

  if (!leafletMap) {
    loadNearbyPlaces(position)
    return
  }

  runProgrammaticMove(
    () => {
      leafletMap.flyTo([position.latitude, position.longitude], LOCATION_ZOOM, {
        animate: true,
        duration: 0.9,
      })
    },
    () => loadNearbyPlaces(position),
  )
}

function handleLocationFound(event) {
  if (!pendingLocationOptions) return

  const options = pendingLocationOptions
  pendingLocationOptions = null
  isLocating.value = false
  locationError.value = ''

  const position = {
    latitude: Number(event.latitude),
    longitude: Number(event.longitude),
    accuracy: Number(event.accuracy) || 0,
    isFallback: false,
  }

  if (options.initial && hasExplicitInitialSearch()) {
    currentPosition.value = position
    updateCurrentLocationLayers(position)
    loadPois({ viewport: 'fit' })
    return
  }

  if (options.loadNearby) moveToPositionAndLoadNearby(position)
}

function handleLocationError(event) {
  if (!pendingLocationOptions) return

  const options = pendingLocationOptions
  pendingLocationOptions = null
  isLocating.value = false
  clearCurrentLocationLayers()

  locationError.value =
    event.code === 1
      ? '위치 권한이 거부되었습니다. 서울 시청을 기준으로 장소를 표시합니다.'
      : '현재 위치를 확인하지 못했습니다. 서울 시청을 기준으로 장소를 표시합니다.'

  const fallbackPosition = {
    latitude: SEOUL_CENTER[0],
    longitude: SEOUL_CENTER[1],
    accuracy: 0,
    isFallback: true,
  }

  if (options.initial && hasExplicitInitialSearch()) {
    currentPosition.value = fallbackPosition
    loadPois({ viewport: 'fit' })
    return
  }

  if (options.loadNearby) moveToPositionAndLoadNearby(fallbackPosition)
}

function requestCurrentLocation(options = {}) {
  if (!leafletMap || isLocating.value || isSearching.value) return

  locationError.value = ''
  isLocating.value = true
  pendingLocationOptions = {
    initial: options.initial === true,
    loadNearby: options.loadNearby !== false,
  }

  leafletMap.stopLocate()
  leafletMap.locate({
    setView: false,
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  })
}

async function loadFilters() {
  try {
    const response = await getMapFilters()
    filters.value = response.data
  } catch (error) {
    filterError.value = getApiErrorMessage(error, '지도 필터를 불러오지 못했습니다.')
  }
}

async function loadPois(options = {}) {
  if (searchAbortController) searchAbortController.abort()

  if (pendingLocationOptions) {
    leafletMap?.stopLocate()
    pendingLocationOptions = null
    isLocating.value = false
  }

  cancelProgrammaticMove()
  leafletMap?.stop()

  const searchOptions = {
    viewport: options.viewport || 'fit',
    focusId: options.focusId ? normalizeTourApiId(options.focusId) : '',
  }
  lastSearchOptions = searchOptions
  const requestId = ++poiRequestId
  searchAbortController = new AbortController()
  resetSuggestionState()
  syncForm()
  isSearching.value = true
  isInitialLoading.value = false
  isNearbyResults.value = false
  searchError.value = ''
  selectedPoi.value = null
  detailError.value = ''

  if (detailAbortController) {
    detailAbortController.abort()
    detailAbortController = null
    detailRequestId += 1
    isDetailLoading.value = false
  }

  try {
    const response = await getMapPois(
      {
        place_type: route.query.placeType,
        category: route.query.category,
        keyword: route.query.keyword,
        region: route.query.region,
        bbox: route.query.bbox,
        page: route.query.page,
        size: route.query.bbox ? NEARBY_REQUEST_SIZE : 20,
      },
      { signal: searchAbortController.signal },
    )
    if (requestId !== poiRequestId) return

    pois.value = response.data.items
    applyResultPagination(response.data)

    await nextTick()
    if (requestId !== poiRequestId) return

    if (searchOptions.focusId) {
      const focusedPlace = response.data.items.find(
        (place) => normalizeTourApiId(place.id) === searchOptions.focusId,
      )

      if (focusedPlace) {
        selectedPoi.value = focusedPlace
        focusPlace(focusedPlace, 16, true)
        loadPoiDetail(focusedPlace.id)
      } else {
        moveToSearchResults(response.data.items)
      }
    } else if (searchOptions.viewport === 'fit') {
      const validPlaces = response.data.items.filter((place) => getCoordinates(place))

      if (validPlaces.length === 1) {
        selectedPoi.value = validPlaces[0]
        focusPlace(validPlaces[0], 16, true)
        loadPoiDetail(validPlaces[0].id)
      } else {
        moveToSearchResults(response.data.items)
      }
    } else if (searchOptions.viewport === 'preserve') {
      hasMapMoved.value = false
    }
  } catch (error) {
    if (requestId !== poiRequestId || error.code === 'ERR_CANCELED') return

    pois.value = []
    pagination.total = 0
    pagination.totalPages = 0
    searchError.value = getApiErrorMessage(error, '장소 목록을 불러오지 못했습니다.')
  } finally {
    if (requestId === poiRequestId) {
      searchAbortController = null
      isSearching.value = false
    }
  }
}

async function loadPoiDetail(id) {
  if (detailAbortController) detailAbortController.abort()

  const requestId = ++detailRequestId

  if (!id) {
    selectedPoi.value = null
    detailError.value = ''
    return
  }

  const normalizedId = normalizeTourApiId(id)
  const fallbackPoi = pois.value.find((poi) => normalizeTourApiId(poi.id) === normalizedId) || null
  selectedPoi.value = fallbackPoi
  isDetailLoading.value = true
  detailError.value = ''
  detailAbortController = new AbortController()

  try {
    const response = await getMapPoi(normalizedId, { signal: detailAbortController.signal })
    if (requestId !== detailRequestId) return

    selectedPoi.value = response.data
  } catch (error) {
    if (requestId !== detailRequestId || error.code === 'ERR_CANCELED') return

    selectedPoi.value = fallbackPoi
    detailError.value = getApiErrorMessage(error, '장소 상세정보를 불러오지 못했습니다.')
  } finally {
    if (requestId === detailRequestId) {
      detailAbortController = null
      isDetailLoading.value = false
    }
  }
}

function searchPlaces(keyword = inputKeyword.value, options = {}) {
  const normalizedKeyword = keyword.trim()
  inputKeyword.value = normalizedKeyword
  committedKeyword.value = normalizedKeyword
  resetSuggestionState()

  const location = {
    path: '/map',
    query: {
      ...(form.placeType !== 'all' && { placeType: form.placeType }),
      ...(form.category && { category: form.category }),
      ...(committedKeyword.value && { keyword: committedKeyword.value }),
      ...(form.region && { region: form.region }),
      page: 1,
    },
  }

  const searchOptions = {
    viewport: 'fit',
    focusId: options.focusId || '',
  }

  if (router.resolve(location).fullPath === route.fullPath) {
    loadPois(searchOptions)
    return
  }

  pendingRouteSearchOptions = searchOptions
  router.push(location)
}

function searchCurrentMapBounds() {
  const bbox = getMapBoundsBbox()
  if (!bbox || isSearching.value) return

  resetSuggestionState()
  const location = {
    path: '/map',
    query: {
      ...(form.placeType !== 'all' && { placeType: form.placeType }),
      ...(form.category && { category: form.category }),
      ...(committedKeyword.value && { keyword: committedKeyword.value }),
      ...(form.region && { region: form.region }),
      bbox,
      page: 1,
    },
  }
  const searchOptions = { viewport: 'preserve' }

  if (router.resolve(location).fullPath === route.fullPath) {
    loadPois(searchOptions)
    return
  }

  pendingRouteSearchOptions = searchOptions
  router.push(location)
}

function selectPoi(poi, options = {}) {
  const { moveMap = true, openPopup = true } = options
  selectedPoi.value = poi
  detailError.value = ''

  if (moveMap) focusPlace(poi, 16, openPopup)
  loadPoiDetail(poi.id)
}

function clearPoi() {
  detailRequestId += 1

  if (detailAbortController) {
    detailAbortController.abort()
    detailAbortController = null
  }

  if (openPopupMarker) {
    openPopupMarker.closePopup()
    openPopupMarker = null
  }

  selectedPoi.value = null
  detailError.value = ''
  isDetailLoading.value = false
}

function changePage(page) {
  if (page < 1 || page > pagination.totalPages) return

  const query = { ...route.query, page }
  delete query.poiId
  pendingRouteSearchOptions = { viewport: route.query.bbox ? 'preserve' : 'fit' }
  router.push({ query })
}

function coordinates(poi) {
  const normalized = getCoordinates(poi)
  if (!normalized) return '좌표 정보 없음'

  return normalized.join(', ')
}

function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) return ''
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`

  return `${distanceKm.toFixed(1)}km`
}

function retryLastSearch() {
  if (currentPosition.value && !hasExplicitInitialSearch()) {
    loadNearbyPlaces(currentPosition.value)
    return
  }

  loadPois(lastSearchOptions)
}

function handleRouteSearchChange() {
  if (!isMapReady) return

  if (!hasExplicitInitialSearch() && currentPosition.value) {
    pendingRouteSearchOptions = null
    loadNearbyPlaces(currentPosition.value)
    return
  }

  const options = pendingRouteSearchOptions || { viewport: 'fit' }
  pendingRouteSearchOptions = null
  loadPois(options)
}

watch(
  [
    () => route.query.placeType,
    () => route.query.category,
    () => route.query.keyword,
    () => route.query.region,
    () => route.query.bbox,
    () => route.query.page,
  ],
  handleRouteSearchChange,
)
watch(() => route.query.poiId, loadPoiDetail)
watch(pois, updateMarkers)
watch(() => selectedPoi.value?.id, updateMarkerSelection)
onMounted(() => {
  syncForm()
  initializeMap()
  requestCurrentLocation({ initial: true, loadNearby: true })
})
onBeforeUnmount(() => {
  cancelSuggestionRequest()

  if (searchAbortController) {
    searchAbortController.abort()
    searchAbortController = null
  }

  if (detailAbortController) {
    detailAbortController.abort()
    detailAbortController = null
  }

  if (programmaticMoveTimer) {
    clearTimeout(programmaticMoveTimer)
    programmaticMoveTimer = null
  }

  poiRequestId += 1
  detailRequestId += 1

  if (!leafletMap) return

  leafletMap.stopLocate()
  leafletMap.off('locationfound', handleLocationFound)
  leafletMap.off('locationerror', handleLocationError)
  leafletMap.off('movestart', handleMapMoveStart)
  leafletMap.off('moveend', handleMapMoveEnd)
  leafletMap.off()
  leafletMap.remove()
  leafletMap = null
  markerLayer = null
  locationLayer = null
  currentLocationMarker = null
  accuracyCircle = null
  openPopupMarker = null
  markersById.clear()
})
loadFilters()
</script>

<template>
  <PageLayout title="지도 및 장소 검색" description="서울 지역 장소를 조건별로 검색하고 상세정보를 확인합니다.">
    <form class="map-filters" role="search" @submit.prevent="searchPlaces()">
      <label>
        <span>장소 유형</span>
        <select v-model="form.placeType" @change="handleSuggestionFilterChange">
          <option v-if="!filters.place_types.length" value="all">전체</option>
          <option v-for="placeType in filters.place_types" :key="placeType.value" :value="placeType.value">
            {{ placeType.label }}
          </option>
        </select>
      </label>
      <label>
        <span>카테고리</span>
        <select v-model="form.category" @change="handleSuggestionFilterChange">
          <option value="">전체</option>
          <option v-for="category in filters.categories" :key="category" :value="category">{{ category }}</option>
        </select>
      </label>
      <label>
        <span>지역</span>
        <select v-model="form.region" @change="handleSuggestionFilterChange">
          <option value="">전체</option>
          <option v-for="region in filters.regions" :key="region" :value="region">{{ region }}</option>
        </select>
      </label>
      <div class="keyword-field">
        <label for="map-keyword">검색어</label>
        <div class="keyword-combobox">
          <input
            id="map-keyword"
            :value="inputKeyword"
            autocomplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="map-suggestions"
            :aria-expanded="isSuggestionOpen"
            :aria-activedescendant="activeSuggestionId"
            placeholder="장소 이름 또는 초성 검색"
            @input="handleKeywordInput"
            @compositionupdate="handleKeywordCompositionUpdate"
            @compositionend="handleKeywordCompositionEnd"
            @focus="handleKeywordFocus"
            @keydown="handleKeywordKeydown"
          />

          <div
            v-if="isSuggestionOpen"
            id="map-suggestions"
            class="suggestion-dropdown"
            role="listbox"
          >
            <p v-if="isSuggesting" class="suggestion-state" role="status">추천 장소를 검색하는 중입니다.</p>
            <p v-else-if="suggestionError" class="suggestion-state is-error" role="alert">
              {{ suggestionError }}
            </p>
            <p v-else-if="hasSuggested && suggestions.length === 0" class="suggestion-state">
              추천 장소가 없습니다.
            </p>
            <ul v-else-if="suggestions.length" class="suggestion-list" role="presentation">
              <li
                v-for="(suggestion, index) in suggestions"
                :key="normalizeTourApiId(suggestion.id)"
                role="presentation"
              >
                <button
                  :id="suggestionOptionId(suggestion)"
                  type="button"
                  role="option"
                  :aria-selected="activeSuggestionIndex === index"
                  :class="{ 'is-active': activeSuggestionIndex === index }"
                  @mouseenter="activeSuggestionIndex = index"
                  @mousedown.prevent
                  @click.stop="selectSuggestion(suggestion)"
                >
                  <strong>{{ suggestion.name }}</strong>
                  <span>{{ suggestion.category }} · {{ suggestion.region || '지역 정보 없음' }}</span>
                  <small>{{ suggestion.address || '주소 정보 없음' }}</small>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <button class="primary-button" type="submit" :disabled="isSearching">
        {{ isSearching ? '검색 중' : '검색' }}
      </button>
    </form>

    <p v-if="filterError" class="map-notice is-error" role="alert">{{ filterError }}</p>
    <div class="location-status" aria-live="polite">
      <p v-if="locationStatusMessage">{{ locationStatusMessage }}</p>
      <p v-if="locationError" class="is-error">{{ locationError }}</p>
      <small>현재 위치 확인은 HTTPS 또는 localhost 환경에서 사용할 수 있습니다.</small>
    </div>

    <div class="map-workspace">
      <section class="result-panel" aria-label="장소 검색 결과">
        <div class="panel-heading">
          <h2>검색 결과</h2>
          <span>{{ pagination.total.toLocaleString() }}곳</span>
        </div>
        <LoadingState v-if="isInitialLoading" message="현재 위치 주변 장소를 불러오는 중입니다." />
        <LoadingState v-else-if="isSearching" message="장소를 불러오는 중입니다." />
        <ErrorState v-else-if="searchError" :message="searchError" @retry="retryLastSearch" />
        <EmptyState v-else-if="pois.length === 0" title="검색된 장소가 없습니다." />
        <template v-else>
          <ul class="poi-list">
            <li
              v-for="poi in pois"
              :key="normalizeTourApiId(poi.id)"
              :class="{ 'is-selected': isSelected(poi) }"
            >
              <button type="button" :aria-pressed="isSelected(poi)" @click.stop="selectPoi(poi)">
                <strong>{{ poi.name }}</strong>
                <span>{{ poi.category }} · {{ poi.region || '지역 정보 없음' }}</span>
                <small>{{ poi.address || '주소 정보 없음' }}</small>
                <small v-if="Number.isFinite(poi.distanceKm)" class="poi-distance">
                  기준 위치에서 {{ formatDistance(poi.distanceKm) }}
                </small>
              </button>
            </li>
          </ul>
          <div v-if="pagination.totalPages > 1" class="pagination">
            <button
              class="secondary-button"
              type="button"
              :disabled="pagination.page <= 1"
              @click="changePage(pagination.page - 1)"
            >
              이전
            </button>
            <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
            <button
              class="secondary-button"
              type="button"
              :disabled="pagination.page >= pagination.totalPages"
              @click="changePage(pagination.page + 1)"
            >
              다음
            </button>
          </div>
        </template>
      </section>

      <div class="map-column">
        <section class="map-panel" aria-label="장소 지도">
          <div class="map-controls" aria-label="지도 검색 도구">
            <button
              type="button"
              :disabled="isLocating || isInitialLoading || isSearching"
              @click="requestCurrentLocation({ loadNearby: true })"
            >
              {{ isLocating ? '위치 확인 중' : '내 위치' }}
            </button>
            <button
              type="button"
              :disabled="!hasMapMoved || isSearching || isInitialLoading"
              @click="searchCurrentMapBounds"
            >
              현재 지도에서 검색
            </button>
          </div>
          <div ref="mapContainer" class="leaflet-map" />
        </section>

        <section class="detail-panel" aria-label="선택 장소 상세정보">
          <LoadingState v-if="isDetailLoading && !selectedPoi" message="장소 상세정보를 불러오는 중입니다." />
          <article v-else-if="selectedPoi">
            <div class="panel-heading">
              <h2>{{ selectedPoi.name }}</h2>
              <button type="button" class="close-detail" @click.stop="clearPoi">닫기</button>
            </div>
            <p v-if="detailError" class="detail-error" role="alert">{{ detailError }}</p>
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
          <ErrorState v-else-if="detailError" :message="detailError" :retryable="false" />
          <EmptyState
            v-else
            title="장소를 선택해 주세요."
            description="검색 결과에서 장소를 선택하면 상세정보가 표시됩니다."
          />
        </section>
      </div>
    </div>
  </PageLayout>
</template>

<style scoped>
.map-filters {
  position: relative;
  z-index: 40;
  margin-bottom: 20px;
  padding: 16px;
  display: grid;
  grid-template-columns: 130px 150px 120px minmax(180px, 1fr) auto;
  align-items: end;
  gap: 10px;
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
  overflow: visible;
}

.map-filters > label,
.keyword-field {
  display: grid;
  gap: 6px;
}

.map-filters > label > span,
.keyword-field > label {
  color: #536074;
  font-size: 12px;
  font-weight: 700;
}

.map-notice,
.location-status {
  margin: -8px 0 16px;
  padding: 10px 12px;
  border: 1px solid #cbd8d2;
  border-radius: 6px;
  background: #f5faf7;
  color: #3c4b43;
  font-size: 13px;
}

.location-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 14px;
}

.location-status p,
.location-status small {
  margin: 0;
}

.location-status small {
  color: #647085;
}

.map-notice.is-error,
.location-status .is-error {
  color: #9a3434;
}

.keyword-combobox {
  position: relative;
  min-width: 0;
}

.suggestion-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 1200;
  max-height: min(320px, calc(100vh - 180px));
  overflow-y: auto;
  border: 1px solid #bdc6d4;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(23, 32, 51, 0.18);
}

.suggestion-state {
  margin: 0;
  padding: 14px;
  color: #647085;
  font-size: 13px;
}

.suggestion-state.is-error {
  color: #a13d3d;
}

.suggestion-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.suggestion-list li + li {
  border-top: 1px solid #e5e9ef;
}

.suggestion-list button {
  width: 100%;
  padding: 11px 13px;
  display: grid;
  gap: 3px;
  border: 0;
  border-left: 3px solid transparent;
  border-radius: 0;
  background: #ffffff;
  color: #283347;
  text-align: left;
}

.suggestion-list button.is-active {
  border-left-color: #176b4d;
  background: #eef6f2;
}

.suggestion-list strong,
.suggestion-list span,
.suggestion-list small {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: keep-all;
}

.suggestion-list span {
  color: #176b4d;
  font-size: 12px;
  font-weight: 700;
}

.suggestion-list small {
  color: #647085;
  line-height: 1.4;
}

.map-workspace {
  display: grid;
  grid-template-columns: minmax(300px, 0.85fr) minmax(360px, 1.15fr);
  align-items: start;
  gap: 16px;
}

.map-column {
  min-width: 0;
  display: grid;
  gap: 16px;
}

.result-panel,
.map-panel,
.detail-panel {
  border: 1px solid #d8dee8;
  border-radius: 8px;
  background: #ffffff;
}

.result-panel {
  min-height: 540px;
  padding: 18px;
}

.map-panel {
  position: relative;
  height: 540px;
  overflow: hidden;
  isolation: isolate;
}

.map-controls {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 800;
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-controls button {
  min-height: 42px;
  padding: 0 13px;
  border: 1px solid #aeb9c7;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(23, 32, 51, 0.14);
  color: #283347;
  font-weight: 700;
}

.map-controls button:disabled {
  background: #edf0f4;
  box-shadow: none;
  color: #8791a1;
  cursor: not-allowed;
}

.leaflet-map {
  z-index: 0;
  width: 100%;
  height: 100%;
  background: #e7ebef;
}

.detail-panel {
  min-height: 240px;
  padding: 18px;
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
  max-height: 650px;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  overflow-y: auto;
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

.poi-list li.is-selected button {
  border-color: #176b4d;
  background: #eef6f2;
  box-shadow: inset 3px 0 0 #176b4d;
}

.poi-list span,
.poi-list small {
  color: #647085;
}

.poi-list .poi-distance {
  color: #176b4d;
  font-weight: 700;
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

.detail-panel .detail-error {
  margin: 0 0 14px;
  padding: 10px 12px;
  border: 1px solid #e6b8b8;
  border-radius: 6px;
  background: #fffafa;
  color: #a13d3d;
  font-size: 13px;
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

:deep(.localhub-div-icon) {
  border: 0;
  background: transparent;
}

:deep(.localhub-map-pin) {
  position: absolute;
  top: 3px;
  left: 5px;
  width: 22px;
  height: 22px;
  display: block;
  border: 3px solid #ffffff;
  border-radius: 50% 50% 50% 0;
  background: #1d7a56;
  box-shadow: 0 2px 7px rgba(23, 32, 51, 0.35);
  transform: rotate(-45deg);
}

:deep(.localhub-map-pin::after) {
  position: absolute;
  top: 5px;
  left: 5px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  content: '';
}

:deep(.localhub-map-pin.is-selected) {
  background: #0d4e38;
  box-shadow:
    0 0 0 4px rgba(23, 107, 77, 0.22),
    0 2px 7px rgba(23, 32, 51, 0.4);
}

:global(.localhub-popup-shell .leaflet-popup-content) {
  min-width: 220px;
  max-width: 300px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: keep-all;
}

:global(.localhub-popup) {
  width: 100%;
  max-width: 300px;
  display: grid;
  gap: 4px;
  color: #283347;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: keep-all;
}

:global(.localhub-popup strong) {
  display: block;
  font-size: 14px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: keep-all;
}

:global(.localhub-popup span) {
  color: #176b4d;
  font-size: 12px;
  font-weight: 700;
}

:global(.localhub-popup small) {
  display: block;
  color: #647085;
  line-height: 1.45;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: keep-all;
}

:global(.leaflet-tooltip.localhub-tooltip) {
  min-width: 180px;
  max-width: 280px;
  padding: 10px 12px;
  border: 1px solid #b9cfc5;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(23, 32, 51, 0.16);
  color: #283347;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: keep-all;
}

:global(.leaflet-tooltip-top.localhub-tooltip::before) {
  border-top-color: #b9cfc5;
}

:global(.localhub-tooltip .localhub-tooltip-content) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  display: grid;
  gap: 3px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: keep-all;
}

:global(.localhub-tooltip .localhub-tooltip-content strong) {
  display: block;
  font-size: 14px;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: keep-all;
}

:global(.localhub-tooltip .localhub-tooltip-content span) {
  color: #176b4d;
  font-size: 12px;
  font-weight: 700;
}

:global(.localhub-tooltip .localhub-tooltip-content small) {
  display: block;
  overflow-wrap: anywhere;
  color: #647085;
  line-height: 1.4;
  white-space: normal;
  word-break: keep-all;
}

@media (max-width: 900px) {
  .map-filters {
    grid-template-columns: 1fr 1fr;
  }

  .keyword-field {
    grid-column: 1 / -1;
  }

  .map-workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .map-filters {
    grid-template-columns: 1fr;
  }

  .keyword-field {
    grid-column: auto;
  }

  .map-panel {
    height: 430px;
  }

  .map-controls {
    right: 8px;
    left: 48px;
    justify-content: flex-end;
  }

  .map-controls button {
    min-height: 44px;
    padding: 0 10px;
    font-size: 12px;
  }

  .location-status {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
