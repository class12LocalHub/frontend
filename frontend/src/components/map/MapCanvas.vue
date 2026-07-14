<script setup>
import { onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

const customIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const props = defineProps({
  places: Array,
  selectedPlaceId: Number,
})

const emit = defineEmits(['select-place'])

const mapElement = ref(null)
const mapInstance = ref(null)
const markers = ref([])

const defaultCenter = [37.5665, 126.9780]
const defaultZoom = 12

const clearMarkers = () => {
  markers.value.forEach((marker) => marker.remove())
  markers.value = []
}

const flyToPlace = (place) => {
  if (!mapInstance.value || !place) return
  mapInstance.value.flyTo([Number(place.latitude), Number(place.longitude)], 14, {
    duration: 0.7,
  })
}

const renderMarkers = () => {
  if (!mapInstance.value) return
  clearMarkers()

  props.places.forEach((place) => {
    const marker = L.marker([Number(place.latitude), Number(place.longitude)], {
      icon: customIcon,
    })
      .addTo(mapInstance.value)
      .bindPopup(`
        <strong>${place.name}</strong><br />
        ${place.category}<br />
        ${place.address}
      `)
      .on('click', () => {
        emit('select-place', place.id)
      })

    markers.value.push(marker)
  })
}

onMounted(() => {
  mapInstance.value = L.map(mapElement.value, {
    center: defaultCenter,
    zoom: defaultZoom,
    zoomControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(mapInstance.value)

  renderMarkers()
})

watch(
  () => props.places,
  () => {
    renderMarkers()
  },
  { deep: true }
)

watch(
  () => props.selectedPlaceId,
  (selectedId) => {
    const place = props.places.find((p) => p.id === selectedId)
    flyToPlace(place)
  }
)
</script>

<template>
  <div class="map-canvas">
    <div ref="mapElement" class="map-canvas__map"></div>
  </div>
</template>

<style scoped>
.map-canvas {
  width: 100%;
  min-height: 500px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #f3f4f6;
}

.map-canvas__map {
  width: 100%;
  height: 100%;
  min-height: 500px;
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

.custom-marker div {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 3px solid #fff;
  box-shadow: 0 0 0 1px rgba(21, 94, 239, 0.2);
}
</style>
