<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { getLocationSuggestions } from '../../services/locationsService.js'
import { toApiCategory, toDisplayCategory, getApiCategories } from '../../utils/categoryConverter.js'

const props = defineProps({
  mode: {
    type: String,
    default: 'create',
  },
  initialPost: {
    type: Object,
    default: () => ({}),
  },
  submitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit', 'cancel'])

// Use API categories directly - store values as API format
const categories = getApiCategories()

const form = reactive({
  title: '',
  category: '',
  content: '',
  password: '',
  tagInput: '',
  custom_tags: [],
  location_id: null,
  location_keyword: '',
})

const errors = reactive({
  title: '',
  category: '',
  content: '',
  tags: '',
  password: '',
})

const locationSuggestions = ref([])
const selectedLocation = ref(null)
const searchingLocation = ref(false)
let debounceTimer = null

const resetForm = (source = {}) => {
  form.title = source.title ?? ''
  form.content = source.content ?? ''
  form.password = ''
  form.tagInput = ''
  form.custom_tags = Array.isArray(source.custom_tags) ? [...source.custom_tags] : []
  form.location_id = source.location_id ?? null
  form.location_keyword = ''
  locationSuggestions.value = []
  selectedLocation.value = props.mode === 'edit' ? (source.location ?? null) : null
  
  // Set category: use location's category if exists, otherwise use post's category
  if (source.location && source.location.category) {
    form.category = toApiCategory(source.location.category)
  } else {
    form.category = source.category ?? ''
  }
  
  Object.keys(errors).forEach((key) => {
    errors[key] = ''
  })
}

watch(
  () => props.initialPost,
  (next) => {
    if (next && (props.mode === 'edit' || (props.mode === 'create' && next.category))) {
      resetForm(next)
    }
  },
  { immediate: true }
)

const trimmedValue = (value) => String(value ?? '').trim()

const searchLocations = async () => {
  const keyword = form.location_keyword.trim()
  if (!keyword) {
    locationSuggestions.value = []
    return
  }

  searchingLocation.value = true
  const results = await getLocationSuggestions(keyword, 20)
  locationSuggestions.value = results
  searchingLocation.value = false
}

const handleLocationInput = () => {
  clearTimeout(debounceTimer)
  locationSuggestions.value = []

  const keyword = form.location_keyword.trim()
  if (!keyword) {
    locationSuggestions.value = []
    return
  }

  debounceTimer = setTimeout(() => {
    searchLocations()
  }, 300)
}

const selectLocation = (location) => {
  selectedLocation.value = location
  form.location_id = location.id
  form.category = toApiCategory(location.category)
  form.location_keyword = ''
  locationSuggestions.value = []
}

const clearLocation = () => {
  selectedLocation.value = null
  form.location_id = null
  form.location_keyword = ''
  locationSuggestions.value = []
  // Keep form.category unchanged
}

const addTagsFromInput = () => {
  const raw = form.tagInput || ''
  if (!raw.trim()) {
    form.tagInput = ''
    return
  }

  const parts = raw.split(',').map((item) => item.trim()).filter(Boolean)
  let nextTags = [...form.custom_tags]

  parts.forEach((part) => {
    const cleaned = part.replace(/^#+/, '').trim()
    if (!cleaned) {
      return
    }
    const duplicate = nextTags.some((tag) => tag.toLowerCase() === cleaned.toLowerCase())
    if (!duplicate) {
      nextTags.push(cleaned)
    }
  })

  if (nextTags.length > 5) {
    errors.tags = '태그는 최대 5개까지 추가할 수 있습니다.'
  } else {
    errors.tags = ''
    form.custom_tags = nextTags
  }

  form.tagInput = ''
}

const handleTagKeydown = (event) => {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTagsFromInput()
  }
}

const removeTag = (index) => {
  form.custom_tags.splice(index, 1)
  if (form.custom_tags.length <= 5 && errors.tags) {
    errors.tags = ''
  }
}

const validate = () => {
  let valid = true
  const title = trimmedValue(form.title)
  const content = trimmedValue(form.content)
  const password = trimmedValue(form.password)

  errors.title = ''
  errors.category = ''
  errors.content = ''
  errors.tags = ''
  errors.password = ''

  if (!title) {
    errors.title = '제목을 입력해주세요.'
    valid = false
  } else if (title.length > 200) {
    errors.title = '제목은 200자 이내로 입력해주세요.'
    valid = false
  }

  if (!form.category) {
    errors.category = '카테고리를 선택해주세요.'
    valid = false
  }

  if (!content) {
    errors.content = '내용을 입력해주세요.'
    valid = false
  }

  if (form.custom_tags.length > 5) {
    errors.tags = '태그는 최대 5개까지 추가할 수 있습니다.'
    valid = false
  }

  if (!password) {
    errors.password = '비밀번호를 입력해주세요.'
    valid = false
  } else if (password.length < 4) {
    errors.password = '비밀번호는 4자 이상 입력해주세요.'
    valid = false
  } else if (password.length > 20) {
    errors.password = '비밀번호는 20자 이내로 입력해주세요.'
    valid = false
  }

  return valid
}

const handleSubmit = () => {
  if (!validate()) {
    return
  }

  emit('submit', {
    title: trimmedValue(form.title),
    content: trimmedValue(form.content),
    password: trimmedValue(form.password),
    category: form.category,
    custom_tags: [...form.custom_tags],
    location_id: form.location_id,
    image_url: null,
  })
}

const handleCancel = () => {
  emit('cancel')
}

const titleLength = computed(() => trimmedValue(form.title).length)
const titleLimit = 200

</script>

<template>
  <form class="post-form" @submit.prevent="handleSubmit">
    <div class="form-card">
      <div class="form-field">
        <label class="form-label" for="title">
          제목 <span class="required">*</span>
        </label>
        <input
          id="title"
          type="text"
          v-model="form.title"
          maxlength="200"
          placeholder="제목을 입력해주세요."
        />
        <div class="field-meta">
          <span v-if="titleLength > 0" class="char-count">{{ titleLength }} / {{ titleLimit }}</span>
        </div>
        <p v-if="errors.title" class="field-error">{{ errors.title }}</p>
      </div>

      <div class="form-field">
        <label class="form-label" for="location">
          장소
        </label>
        <div v-if="selectedLocation" class="location-selected">
          <div class="location-info">
            <div class="location-name">{{ selectedLocation.name }}</div>
            <div class="location-address">{{ selectedLocation.address }}</div>
            <div class="location-category">{{ selectedLocation.category }}</div>
          </div>
          <button type="button" class="location-clear-btn" @click="clearLocation">선택 해제</button>
        </div>
        <div v-else class="location-search">
          <input
            id="location"
            type="text"
            v-model="form.location_keyword"
            @input="handleLocationInput"
            placeholder="장소명 또는 초성으로 검색해보세요."
          />
          <div v-if="locationSuggestions.length > 0" class="location-suggestions">
            <button
              v-for="location in locationSuggestions"
              :key="location.id"
              type="button"
              class="location-suggestion-item"
              @click="selectLocation(location)"
            >
              <div class="location-name-small">{{ location.name }}</div>
              <div class="location-address-small">{{ location.address }}</div>
              <div class="location-category-small">{{ location.category }}</div>
            </button>
          </div>
          <div v-else-if="searchingLocation" class="location-status">검색 중...</div>
          <div v-else-if="form.location_keyword && locationSuggestions.length === 0" class="location-status">
            검색 결과가 없습니다.
          </div>
        </div>
      </div>

      <div class="form-field">
        <label class="form-label" for="category">
          카테고리 <span class="required">*</span>
        </label>
        <select id="category" v-model="form.category" :disabled="!!selectedLocation">
          <option value="" disabled>카테고리를 선택해주세요.</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ toDisplayCategory(category) }}
          </option>
        </select>
        <p v-if="selectedLocation" class="field-hint">선택한 장소에 따라 자동 설정됩니다.</p>
        <p v-if="errors.category" class="field-error">{{ errors.category }}</p>
      </div>

      <div class="form-field">
        <label class="form-label" for="content">
          내용 <span class="required">*</span>
        </label>
        <textarea
          id="content"
          v-model="form.content"
          rows="10"
          placeholder="내용을 입력해주세요."
        />
        <p v-if="errors.content" class="field-error">{{ errors.content }}</p>
      </div>

      <div class="form-field">
        <label class="form-label" for="tags">
          태그
        </label>
        <div class="tag-input-row">
          <input
            id="tags"
            type="text"
            v-model="form.tagInput"
            @keydown="handleTagKeydown"
            placeholder="태그 입력 후 Enter 또는 쉼표로 추가"
          />
          <button type="button" class="tag-add-button" @click="addTagsFromInput">추가</button>
        </div>
        <div class="tag-list">
          <button
            v-for="(tag, index) in form.custom_tags"
            :key="tag"
            type="button"
            class="tag-pill"
            @click="removeTag(index)"
          >
            #{{ tag }} <span aria-hidden="true">×</span>
          </button>
        </div>
        <p v-if="errors.tags" class="field-error">{{ errors.tags }}</p>
        <p v-else class="field-help">최대 5개 태그까지 추가할 수 있습니다.</p>
      </div>

      <div class="form-field">
        <label class="form-label" for="password">
          비밀번호 <span class="required">*</span>
        </label>
        <input
          id="password"
          type="password"
          v-model="form.password"
          maxlength="20"
          placeholder="비밀번호를 입력해주세요."
        />
        <p class="field-help">게시글 수정 및 삭제 시 사용할 비밀번호입니다.</p>
        <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="button-secondary" @click="handleCancel" :disabled="submitting">
        취소
      </button>
      <button type="submit" class="button-primary" :disabled="submitting">
        {{ props.mode === 'edit' ? '수정 완료' : '등록' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.post-form {
  width: 100%;
}

.form-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  display: grid;
  gap: 1.25rem;
}

.form-field {
  display: grid;
  gap: 0.55rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 700;
  color: var(--color-text);
}

.required {
  color: var(--color-danger);
}

.optional {
  color: var(--color-muted);
  font-size: 0.95rem;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 0.85rem;
  padding: 0.95rem 1rem;
  font-size: 1rem;
  color: var(--color-text);
  background: #fff;
  box-sizing: border-box;
}

textarea {
  min-height: 200px;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: rgba(14, 118, 255, 0.8);
  box-shadow: 0 0 0 4px rgba(14, 118, 255, 0.08);
}

select:disabled {
  background: #f8fafc;
  color: var(--color-muted);
  cursor: not-allowed;
}

.field-meta {
  display: flex;
  justify-content: flex-end;
}

.char-count {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.tag-input-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.tag-input-row input {
  flex: 1 1 240px;
  min-width: 0;
}

.tag-add-button {
  min-width: 96px;
  height: 44px;
  padding: 0 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.85rem;
  background: #f8fafc;
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
}

.tag-add-button:hover {
  background: #eff6ff;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(14, 118, 255, 0.16);
  background: rgba(14, 118, 255, 0.1);
  color: var(--color-primary);
  border-radius: 999px;
  cursor: pointer;
}

.field-help {
  color: var(--color-muted);
  font-size: 0.95rem;
  margin-top: -0.25rem;
}

.field-error {
  color: var(--color-danger);
  font-size: 0.95rem;
  margin-top: -0.1rem;
}

.field-hint {
  color: var(--color-muted);
  font-size: 0.9rem;
  margin-top: -0.1rem;
}

.location-selected {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid rgba(14, 118, 255, 0.16);
  background: rgba(14, 118, 255, 0.04);
  border-radius: 0.85rem;
}

.location-info {
  flex: 1;
}

.location-name {
  font-weight: 700;
  color: var(--color-text);
}

.location-address {
  font-size: 0.9rem;
  color: var(--color-muted);
  margin-top: 0.25rem;
}

.location-category {
  display: inline-block;
  font-size: 0.8rem;
  color: var(--color-primary);
  font-weight: 600;
  margin-top: 0.5rem;
}

.location-clear-btn {
  min-width: 96px;
  height: 40px;
  padding: 0 1rem;
  border: 1px solid var(--color-border);
  background: #fff;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  color: var(--color-text);
  flex-shrink: 0;
}

.location-clear-btn:hover {
  background: #f8fafc;
}

.location-search {
  position: relative;
}

.location-search input {
  width: 100%;
}

.location-suggestions {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 0.85rem;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
  max-height: 320px;
  overflow-y: auto;
  z-index: 10;
}

.location-suggestion-item {
  display: block;
  width: 100%;
  padding: 0.85rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 150ms ease;
}

.location-suggestion-item:last-child {
  border-bottom: none;
}

.location-suggestion-item:hover {
  background: #f8fafc;
}

.location-name-small {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.95rem;
}

.location-address-small {
  font-size: 0.85rem;
  color: var(--color-muted);
  margin-top: 0.2rem;
}

.location-category-small {
  display: inline-block;
  font-size: 0.75rem;
  color: var(--color-primary);
  font-weight: 600;
  margin-top: 0.3rem;
}

.location-status {
  margin-top: 0.5rem;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.button-primary,
.button-secondary {
  min-width: 120px;
  height: 44px;
  border-radius: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.button-primary {
  border: none;
  background: var(--color-primary);
  color: #fff;
}

.button-secondary {
  border: 1px solid var(--color-border);
  background: #fff;
  color: var(--color-text);
}

button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-card {
    padding: 1.25rem;
  }

  .form-actions {
    justify-content: stretch;
  }

  .button-primary,
  .button-secondary,
  .tag-add-button {
    width: 100%;
  }
}
</style>
