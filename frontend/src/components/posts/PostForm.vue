<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
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
const searchingLocations = ref(false)
const locationError = ref('')
const validationError = ref('')
const hasSearchedLocations = ref(false)

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

async function searchLocations() {
  const keyword = locationKeyword.value.trim()

  if (!keyword) {
    locationError.value = '검색할 장소 이름을 입력해 주세요.'
    return
  }

  searchingLocations.value = true
  locationError.value = ''
  hasSearchedLocations.value = true

  try {
    const response = await getLocationSuggestions(keyword, 10)
    locationResults.value = response.data.items
  } catch (error) {
    locationError.value = getApiErrorMessage(error, '장소를 검색하지 못했습니다.')
  } finally {
    searchingLocations.value = false
  }
}

function selectLocation(location) {
  selectedLocation.value = location
  form.locationId = normalizeLocationId(location.id)
  locationKeyword.value = location.name
  locationResults.value = []
  hasSearchedLocations.value = false
}

function clearLocation() {
  selectedLocation.value = null
  form.locationId = null
  locationKeyword.value = ''
  locationResults.value = []
  hasSearchedLocations.value = false
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
        <span>{{ selectedLocation.name }}</span>
        <button type="button" class="text-button" @click="clearLocation">선택 해제</button>
      </div>
      <div v-else class="inline-field">
        <input
          id="post-location"
          v-model="locationKeyword"
          placeholder="장소 이름 또는 초성"
          @keydown.enter.prevent="searchLocations"
        />
        <button type="button" class="secondary-button" :disabled="searchingLocations" @click="searchLocations">
          {{ searchingLocations ? '검색 중' : '장소 검색' }}
        </button>
      </div>
      <p v-if="locationError" class="field-error">{{ locationError }}</p>
      <ul v-if="locationResults.length" class="suggestions">
        <li v-for="location in locationResults" :key="String(location.source_id)">
          <button type="button" @click="selectLocation(location)">
            <strong>{{ location.name }}</strong>
            <span>{{ location.category }} · {{ location.address || '주소 정보 없음' }}</span>
          </button>
        </li>
      </ul>
      <p v-else-if="hasSearchedLocations && !searchingLocations && !locationError" class="field-help">
        검색된 장소가 없습니다.
      </p>
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

.inline-field,
.selected-location,
.form-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.inline-field input {
  flex: 1;
}

.selected-location {
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid #aed3c4;
  border-radius: 6px;
  background: #f1f8f5;
}

.text-button {
  padding: 4px;
  border: 0;
  background: transparent;
  color: #176b4d;
}

.suggestions {
  max-height: 250px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  border: 1px solid #d8dee8;
  border-radius: 6px;
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

@media (max-width: 560px) {
  .inline-field {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
