<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { getCategories } from '../../api/categories'
import { getLocationSuggestions } from '../../api/locations'
import { getApiErrorMessage } from '../../utils/api'
import { normalizeLocationId } from '../../utils/normalize'

const props = defineProps({
  initialPost: {
    type: Object,
    default: null,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  submitLabel: {
    type: String,
    default: '저장',
  },
  serverError: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['submit'])

const form = reactive({
  title: '',
  category: '',
  content: '',
  tags: '',
  imageUrl: '',
  password: '',
  locationId: null,
})

const categories = ref([])
const categoryError = ref('')
const locationKeyword = ref('')
const locationResults = ref([])
const selectedLocation = ref(null)
const isLocationSearching = ref(false)
const isLocationDropdownOpen = ref(false)
const locationError = ref('')
const validationError = ref('')
const hasSearchedLocations = ref(false)

let locationDebounceTimer = null
let locationAbortController = null
let locationRequestId = 0
let lastScheduledKeyword = ''
let lastRequestedKeyword = ''

watch(
  () => props.initialPost,
  (post) => {
    if (!post) return

    form.title = post.title || ''
    form.category = post.category || ''
    form.content = post.content || ''
    form.tags = Array.isArray(post.custom_tags) ? post.custom_tags.join(', ') : ''
    form.imageUrl = post.image_url || ''
    form.password = ''
    form.locationId = normalizeLocationId(post.location_id)
    selectedLocation.value = post.location || null
    locationKeyword.value = post.location?.name || ''
  },
  { immediate: true },
)

async function loadCategories() {
  categoryError.value = ''

  try {
    const response = await getCategories()
    categories.value = response.data.categories

    if (!form.category && categories.value.length > 0) {
      form.category = categories.value[0]
    }
  } catch (error) {
    categoryError.value = getApiErrorMessage(error, '카테고리를 불러오지 못했습니다.')
  }
}

function cancelLocationSearch() {
  if (locationDebounceTimer) {
    clearTimeout(locationDebounceTimer)
    locationDebounceTimer = null
  }

  if (locationAbortController) {
    locationAbortController.abort()
    locationAbortController = null
  }

  locationRequestId += 1
  isLocationSearching.value = false
}

function resetLocationSearch() {
  cancelLocationSearch()
  locationResults.value = []
  locationError.value = ''
  hasSearchedLocations.value = false
  isLocationDropdownOpen.value = false
  lastScheduledKeyword = ''
  lastRequestedKeyword = ''
}

async function requestLocationSuggestions(keyword) {
  locationDebounceTimer = null

  if (selectedLocation.value || locationKeyword.value.trim() !== keyword) {
    isLocationSearching.value = false
    return
  }

  const requestId = ++locationRequestId
  locationAbortController = new AbortController()
  lastRequestedKeyword = keyword

  try {
    const response = await getLocationSuggestions(keyword, 10, {
      signal: locationAbortController.signal,
    })

    if (requestId !== locationRequestId) return
    if (locationKeyword.value.trim() !== keyword || selectedLocation.value) return

    locationResults.value = response.data.items
    hasSearchedLocations.value = true
    isLocationDropdownOpen.value = true
  } catch (error) {
    if (requestId !== locationRequestId || error.code === 'ERR_CANCELED') return

    lastRequestedKeyword = ''
    locationError.value = getApiErrorMessage(error, '장소를 검색하지 못했습니다.')
    hasSearchedLocations.value = true
    isLocationDropdownOpen.value = true
  } finally {
    if (requestId === locationRequestId) {
      locationAbortController = null
      isLocationSearching.value = false
    }
  }
}

function scheduleLocationSearch(value) {
  const keyword = value.trim()

  if (!keyword) {
    resetLocationSearch()
    return
  }

  if (keyword === lastScheduledKeyword && (locationDebounceTimer || locationAbortController)) return

  if (keyword === lastRequestedKeyword && hasSearchedLocations.value) {
    isLocationDropdownOpen.value = true
    return
  }

  cancelLocationSearch()
  lastScheduledKeyword = keyword
  locationResults.value = []
  locationError.value = ''
  hasSearchedLocations.value = false
  isLocationDropdownOpen.value = true
  isLocationSearching.value = true
  locationDebounceTimer = setTimeout(() => requestLocationSuggestions(keyword), 250)
}

function handleLocationValue(value) {
  locationKeyword.value = value
  scheduleLocationSearch(value)
}

function handleLocationInput(event) {
  handleLocationValue(event.target.value)
}

function handleLocationCompositionUpdate(event) {
  handleLocationValue(event.target.value)
}

function handleLocationCompositionEnd(event) {
  handleLocationValue(event.target.value)
}

function handleLocationFocus() {
  if (locationResults.value.length > 0) {
    isLocationDropdownOpen.value = true
    return
  }

  if (locationKeyword.value.trim() && locationError.value) {
    lastScheduledKeyword = ''
    scheduleLocationSearch(locationKeyword.value)
  }
}

function selectLocation(location) {
  cancelLocationSearch()
  selectedLocation.value = location
  form.locationId = normalizeLocationId(location.id)
  locationKeyword.value = location.name
  locationResults.value = []
  hasSearchedLocations.value = false
  isLocationDropdownOpen.value = false
  lastScheduledKeyword = ''
  lastRequestedKeyword = ''
}

function clearLocation() {
  resetLocationSearch()
  selectedLocation.value = null
  form.locationId = null
  locationKeyword.value = ''
}

function submitForm() {
  validationError.value = ''
  const customTags = form.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  if (!form.title.trim() || !form.content.trim() || !form.category || !form.password) {
    validationError.value = '제목, 카테고리, 내용, 비밀번호를 모두 입력해 주세요.'
    return
  }

  if (form.password.length < 4 || form.password.length > 20) {
    validationError.value = '비밀번호는 4자 이상 20자 이하여야 합니다.'
    return
  }

  if (customTags.length > 5) {
    validationError.value = '태그는 최대 5개까지 입력할 수 있습니다.'
    return
  }

  emit('submit', {
    title: form.title.trim(),
    content: form.content.trim(),
    password: form.password,
    category: form.category,
    location_id: form.locationId,
    custom_tags: customTags,
    image_url: form.imageUrl.trim() || null,
  })
}

onMounted(loadCategories)
onBeforeUnmount(cancelLocationSearch)
</script>

<template>
  <form class="post-form" @submit.prevent="submitForm">
    <div class="field">
      <label for="post-title">제목</label>
      <input id="post-title" v-model="form.title" maxlength="200" required />
    </div>

    <div class="field">
      <label for="post-category">카테고리</label>
      <select id="post-category" v-model="form.category" required :disabled="!categories.length">
        <option value="" disabled>카테고리 선택</option>
        <option v-for="category in categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
      <p v-if="categoryError" class="field-error">{{ categoryError }}</p>
    </div>

    <div class="field">
      <label for="post-location">연결 장소</label>
      <div v-if="selectedLocation" class="selected-location">
        <span class="location-tag">#{{ selectedLocation.name }}</span>
        <button type="button" class="text-button" @click="clearLocation">선택 해제</button>
      </div>
      <div v-else class="location-autocomplete">
        <input
          id="post-location"
          :value="locationKeyword"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="location-suggestions"
          :aria-expanded="isLocationDropdownOpen"
          placeholder="장소 이름 또는 초성"
          @input="handleLocationInput"
          @compositionupdate="handleLocationCompositionUpdate"
          @compositionend="handleLocationCompositionEnd"
          @focus="handleLocationFocus"
          @keydown.enter.prevent
          @keydown.escape="isLocationDropdownOpen = false"
        />
        <div v-if="isLocationDropdownOpen" id="location-suggestions" class="suggestions-dropdown">
          <p v-if="isLocationSearching" class="suggestion-state" role="status">장소를 검색하는 중입니다.</p>
          <p v-else-if="locationError" class="suggestion-state is-error" role="alert">{{ locationError }}</p>
          <p v-else-if="hasSearchedLocations && locationResults.length === 0" class="suggestion-state">
            검색된 장소가 없습니다.
          </p>
          <ul v-else-if="locationResults.length" class="suggestions" role="listbox">
            <li v-for="location in locationResults" :key="String(location.id)">
              <button
                type="button"
                role="option"
                @mousedown.prevent
                @click.stop="selectLocation(location)"
              >
                <strong>{{ location.name }}</strong>
                <span>{{ location.category }} · {{ location.address || '주소 정보 없음' }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="field">
      <label for="post-content">내용</label>
      <textarea id="post-content" v-model="form.content" rows="12" required />
    </div>

    <div class="field">
      <label for="post-tags">태그</label>
      <input id="post-tags" v-model="form.tags" placeholder="쉼표로 구분, 최대 5개" />
    </div>

    <div class="field">
      <label for="post-image">이미지 URL</label>
      <input id="post-image" v-model="form.imageUrl" type="url" placeholder="https://" />
    </div>

    <div class="field">
      <label for="post-password">수정·삭제 비밀번호</label>
      <input id="post-password" v-model="form.password" type="password" minlength="4" maxlength="20" required />
    </div>

    <p v-if="validationError || serverError" class="form-error" role="alert">
      {{ validationError || serverError }}
    </p>

    <div class="form-actions">
      <RouterLink class="secondary-button link-button" to="/posts">취소</RouterLink>
      <button class="primary-button" type="submit" :disabled="submitting || !categories.length">
        {{ submitting ? '저장 중' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.post-form {
  max-width: 760px;
  display: grid;
  gap: 22px;
}

.field {
  display: grid;
  gap: 8px;
}

label {
  color: #283347;
  font-weight: 700;
}

textarea {
  resize: vertical;
}

.selected-location,
.form-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selected-location {
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid #aed3c4;
  border-radius: 6px;
  background: #f1f8f5;
}

.location-tag {
  color: #176b4d;
  font-weight: 800;
}

.location-autocomplete {
  position: relative;
}

.text-button {
  padding: 4px;
  border: 0;
  background: transparent;
  color: #176b4d;
}

.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 15;
  overflow: hidden;
  border: 1px solid #bdc6d4;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(23, 32, 51, 0.14);
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

.suggestions {
  max-height: 250px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.suggestions li + li {
  border-top: 1px solid #e5e9ef;
}

.suggestions button {
  width: 100%;
  padding: 12px 14px;
  display: grid;
  gap: 4px;
  border: 0;
  background: #ffffff;
  color: #283347;
  text-align: left;
}

.suggestions span,
.field-help {
  color: #647085;
  font-size: 13px;
}

.field-error,
.form-error {
  margin: 0;
  color: #a13d3d;
  font-size: 14px;
}

.form-error {
  padding: 12px;
  border: 1px solid #e6b8b8;
  border-radius: 6px;
  background: #fffafa;
}

.form-actions {
  justify-content: flex-end;
}
</style>
