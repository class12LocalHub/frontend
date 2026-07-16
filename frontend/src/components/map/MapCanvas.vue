<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const createPlaceMarkerIcon = (isSelected) =>
  L.divIcon({
    className: `map-pin-marker${isSelected ? ' map-pin-marker--selected' : ''}`,
    html:
      '<svg class="map-pin-marker__svg" viewBox="0 0 32 42" aria-hidden="true" focusable="false">' +
      '<path class="map-pin-marker__shape" d="M16 1C8.82 1 3 6.82 3 14c0 10.13 11.21 20.99 12.63 22.33a.53.53 0 0 0 .74 0C17.79 34.99 29 24.13 29 14 29 6.82 23.18 1 16 1Z"/>' +
      '<circle class="map-pin-marker__center" cx="16" cy="14" r="5"/>' +
      '</svg>',
    iconSize: [32, 42],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
    tooltipAnchor: [0, -28],
  })

const props = defineProps({
  places: {
    type: Array,
    default: () => [],
  },
  centerCoordinates: {
    type: Object,
    default: null,
  },
  currentPosition: {
    type: Object,
    default: null,
  },
  isLocating: {
    type: Boolean,
    default: false,
  },
  selectedPlaceId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits([
  'ready',
  'select-place',
  'location-found',
  'location-error',
  'request-location',
  'user-move',
])

const mapElement = ref(null)
const mapInstance = shallowRef(null)
let markerLayer = null
let locationLayer = null
let currentLocationMarker = null
let accuracyCircle = null
const markerById = new Map()
let isMapMoving = false
let isProgrammaticMove = false
let hasUserInteraction = false
let pendingPlaces = null
let programmaticMoveTimer = null
let markerRenderFrame = null
let popupOpenTimer = null
let pendingPopupHandler = null

const defaultCenter = [37.5665, 126.978]
const defaultZoom = 13

const normalizeCoordinates = (place) => {
  const latitude = Number(place?.latitude ?? place?.mapy)
  const longitude = Number(place?.longitude ?? place?.mapx)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  return { latitude, longitude }
}

const createPopupContent = (place) => {
  const wrapper = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = String(place.name ?? '')
  wrapper.append(title)
  ;[place.category, place.address].filter(Boolean).forEach((value) => {
    wrapper.append(document.createElement('br'), document.createTextNode(String(value)))
  })

  return wrapper
}

const cancelPendingPopup = () => {
  if (popupOpenTimer) clearTimeout(popupOpenTimer)
  popupOpenTimer = null
  if (pendingPopupHandler && mapInstance.value) {
    mapInstance.value.off('moveend', pendingPopupHandler)
  }
  pendingPopupHandler = null
}

const beginProgrammaticMove = () => {
  isProgrammaticMove = true
  hasUserInteraction = false
  if (programmaticMoveTimer) clearTimeout(programmaticMoveTimer)
  programmaticMoveTimer = setTimeout(() => {
    isProgrammaticMove = false
  }, 2000)
}

const getBoundsPayload = () => {
  if (!mapInstance.value) return null
  const bounds = mapInstance.value.getBounds()
  const center = mapInstance.value.getCenter()

  return {
    bbox: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(','),
    center: {
      latitude: center.lat,
      longitude: center.lng,
    },
  }
}

const applyMarkers = (places) => {
  if (!markerLayer || !mapInstance.value) return
  cancelPendingPopup()
  mapInstance.value.closePopup()
  markerLayer.clearLayers()
  markerById.clear()

  places.forEach((place) => {
    const coordinates = normalizeCoordinates(place)
    if (!coordinates) return
    const isSelected = String(place.id) === String(props.selectedPlaceId ?? '')

    const marker = L.marker([coordinates.latitude, coordinates.longitude], {
      icon: createPlaceMarkerIcon(isSelected),
      pane: 'markerPane',
    })
      .bindTooltip(String(place.name ?? ''), {
        direction: 'top',
        offset: [0, 0],
      })
      .bindPopup(createPopupContent(place), {
        maxWidth: 340,
      })
      .on('click', () => emit('select-place', place))
      .on('popupopen', () => marker.closeTooltip())
      .on('tooltipopen', () => {
        if (marker.isPopupOpen()) marker.closeTooltip()
      })

    marker.addTo(markerLayer)
    markerById.set(String(place.id), marker)
  })
}

const renderMarkers = (places) => {
  if (isMapMoving) {
    pendingPlaces = [...places]
    return
  }

  pendingPlaces = null
  if (markerRenderFrame) cancelAnimationFrame(markerRenderFrame)
  markerRenderFrame = null
  applyMarkers(places)
}

const flushPendingMarkers = () => {
  if (!pendingPlaces) return
  const places = pendingPlaces
  pendingPlaces = null
  markerRenderFrame = requestAnimationFrame(() => {
    markerRenderFrame = null
    if (!isMapMoving) applyMarkers(places)
  })
}

const renderCurrentPosition = (position) => {
  if (!locationLayer) return
  if (!position) {
    locationLayer.clearLayers()
    currentLocationMarker = null
    accuracyCircle = null
    return
  }

  const coordinates = normalizeCoordinates(position)
  if (!coordinates) return
  const latLng = L.latLng(coordinates.latitude, coordinates.longitude)
  const accuracy = Math.max(0, Number(position.accuracy) || 0)

  if (currentLocationMarker) {
    currentLocationMarker.setLatLng(latLng)
  } else {
    currentLocationMarker = L.circleMarker(latLng, {
      radius: 8,
      color: '#fff',
      weight: 3,
      fillColor: '#2563eb',
      fillOpacity: 1,
    })
      .bindTooltip('현재 위치', { direction: 'top' })
      .addTo(locationLayer)
  }

  if (accuracyCircle) {
    accuracyCircle.setLatLng(latLng).setRadius(accuracy)
  } else {
    accuracyCircle = L.circle(latLng, {
      radius: accuracy,
      color: '#2563eb',
      weight: 1,
      fillColor: '#60a5fa',
      fillOpacity: 0.15,
      interactive: false,
    }).addTo(locationLayer)
  }
}

const handleMoveStart = () => {
  isMapMoving = true
}

const handleUserMoveStart = () => {
  if (!isProgrammaticMove) hasUserInteraction = true
}

const handleMoveEnd = () => {
  isMapMoving = false
  const wasProgrammatic = isProgrammaticMove
  if (wasProgrammatic) {
    isProgrammaticMove = false
    if (programmaticMoveTimer) clearTimeout(programmaticMoveTimer)
    programmaticMoveTimer = null
  }

  flushPendingMarkers()
  if (!wasProgrammatic && hasUserInteraction) {
    const payload = getBoundsPayload()
    if (payload) emit('user-move', payload)
  }
  hasUserInteraction = false
}

const flyToCoordinates = (coordinates, zoom = 14) => {
  if (!mapInstance.value) return false
  const normalized = normalizeCoordinates(coordinates)
  if (!normalized) return false

  beginProgrammaticMove()
  mapInstance.value.flyTo([normalized.latitude, normalized.longitude], Number(zoom), {
    animate: true,
    duration: 0.9,
  })
  return true
}

const focusPlace = (place) => {
  if (!mapInstance.value || !place) return false
  const coordinates = normalizeCoordinates(place)
  const marker = markerById.get(String(place.id))
  if (!coordinates || !marker) return false

  cancelPendingPopup()
  const openPopup = () => {
    mapInstance.value?.off('moveend', openPopup)
    if (pendingPopupHandler === openPopup) pendingPopupHandler = null
    if (popupOpenTimer) clearTimeout(popupOpenTimer)
    popupOpenTimer = null
    if (!markerLayer?.hasLayer(marker)) return
    marker.closeTooltip()
    marker.openPopup()
  }

  beginProgrammaticMove()
  pendingPopupHandler = openPopup
  mapInstance.value.once('moveend', openPopup)
  const targetZoom = Math.min(mapInstance.value.getMaxZoom() || 19, 18)
  mapInstance.value.flyTo([coordinates.latitude, coordinates.longitude], targetZoom, {
    animate: true,
    duration: 0.9,
  })
  popupOpenTimer = setTimeout(openPopup, 1100)
  return true
}

const locate = () => {
  if (!mapInstance.value) return
  mapInstance.value.stopLocate()
  mapInstance.value.locate({
    setView: false,
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  })
}

const stopLocate = () => mapInstance.value?.stopLocate()

const handleLocationFound = (event) => {
  const position = {
    latitude: event.latlng.lat,
    longitude: event.latlng.lng,
    accuracy: event.accuracy,
  }
  renderCurrentPosition(position)
  emit('location-found', position)
}

const handleLocationError = (event) => {
  emit('location-error', { code: event.code, message: event.message })
}

onMounted(() => {
  if (mapInstance.value || !mapElement.value) return
  const map = L.map(mapElement.value, {
    center: defaultCenter,
    zoom: defaultZoom,
    zoomControl: true,
  })
  mapInstance.value = map

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)
  locationLayer = L.layerGroup().addTo(map)
  map.on('movestart', handleMoveStart)
  map.on('moveend', handleMoveEnd)
  map.on('dragstart', handleUserMoveStart)
  map.on('zoomstart', handleUserMoveStart)
  map.on('locationfound', handleLocationFound)
  map.on('locationerror', handleLocationError)

  renderMarkers(props.places)
  renderCurrentPosition(props.currentPosition)
  emit('ready')
})

watch(
  () => props.places,
  (places) => renderMarkers(places),
  { deep: true },
)

watch(
  () => props.selectedPlaceId,
  () => renderMarkers(props.places),
)

watch(
  () => props.currentPosition,
  (position) => renderCurrentPosition(position),
  { deep: true },
)

watch(
  () => props.centerCoordinates,
  (coordinates) => flyToCoordinates(coordinates, 14),
  { deep: true },
)

onBeforeUnmount(() => {
  if (programmaticMoveTimer) clearTimeout(programmaticMoveTimer)
  if (markerRenderFrame) cancelAnimationFrame(markerRenderFrame)
  cancelPendingPopup()
  pendingPlaces = null

  const map = mapInstance.value
  if (map) {
    map.stop()
    map.stopLocate()
    map.off('movestart', handleMoveStart)
    map.off('moveend', handleMoveEnd)
    map.off('dragstart', handleUserMoveStart)
    map.off('zoomstart', handleUserMoveStart)
    map.off('locationfound', handleLocationFound)
    map.off('locationerror', handleLocationError)
    map.off()
    map.remove()
  }

  mapInstance.value = null
  markerLayer = null
  locationLayer = null
  currentLocationMarker = null
  accuracyCircle = null
  markerById.clear()
})

defineExpose({
  locate,
  stopLocate,
  flyToCoordinates,
  focusPlace,
  getBoundsPayload,
})
</script>

<template>
  <div class="map-canvas">
    <div ref="mapElement" class="map-canvas__map"></div>
    <button
      type="button"
      class="map-canvas__location-button"
      :disabled="isLocating"
      @click="$emit('request-location')"
    >
      {{ isLocating ? '위치 확인 중' : '내 위치' }}
    </button>
  </div>
</template>

<style scoped>
.map-canvas {
  width: 100%;
  min-height: 500px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  background: #f3f4f6;
  position: relative;
  z-index: 0;
}

.map-canvas__map {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.map-canvas__location-button {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 500;
  min-height: 42px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  color: var(--color-text);
  padding: 0.62rem 0.9rem;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
  font-weight: 700;
  cursor: pointer;
}

.map-canvas__location-button:hover:not(:disabled) {
  background: #fff7ed;
  color: #ea580c;
  border-color: #fdba74;
}

.map-canvas__location-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .map-canvas {
    min-height: 420px;
  }

  .map-canvas__map {
    min-height: 420px;
  }
}

.leaflet-container {
  width: 100%;
  height: 100%;
}

:deep(.map-pin-marker) {
  width: 32px;
  height: 42px;
  margin: 0;
  position: relative;
  background: transparent;
  border: none;
}

:deep(.map-pin-marker__svg) {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
  filter: drop-shadow(0 4px 8px rgba(194, 65, 12, 0.22));
}

:deep(.map-pin-marker__shape) {
  fill: #f97316;
  stroke: #fff;
  stroke-width: 2;
}

:deep(.map-pin-marker__center) {
  fill: #fff;
}

:deep(.map-pin-marker--selected .map-pin-marker__shape),
:deep(.map-pin-marker:hover .map-pin-marker__shape) {
  fill: #ea580c;
}
</style>
