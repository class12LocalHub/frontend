/**
 * Normalize any category format to standard API format
 * Handles multiple variations of festival category
 * @param {string} value - Any category format
 * @returns {string} Normalized API category
 */
export function normalizeCategory(value) {
  if (!value) return ''
  
  const str = String(value).trim()
  
  // Festival/Event variations
  if (/축제.*공연.*행사|축제.*행사|공연.*행사|축제|공연/.test(str)) {
    return '축제공연행사'
  }
  
  return str
}

/**
 * Display category (UI) to API category (backend) conversion
 * @param {string} displayCategory - Category shown in UI
 * @returns {string} API category name
 */
export function toApiCategory(displayCategory) {
  return normalizeCategory(displayCategory)
}

/**
 * API category (backend) to display category (UI) conversion
 * @param {string} apiCategory - Category from API
 * @returns {string} Display category name
 */
export function toDisplayCategory(apiCategory) {
  const normalized = normalizeCategory(apiCategory)
  
  // Map normalized API category to display format
  const displayMap = {
    '축제공연행사': '축제/공연행사',
  }
  
  return displayMap[normalized] || normalized || '기타'
}

/**
 * Get all available categories in API format
 * @returns {string[]} Array of API category names
 */
export function getApiCategories() {
  return [
    '관광지',
    '레포츠',
    '문화시설',
    '쇼핑',
    '숙박',
    '여행코스',
    '축제공연행사',
  ]
}

/**
 * Get all available categories in display format
 * @returns {string[]} Array of display category names
 */
export function getDisplayCategories() {
  return getApiCategories().map(toDisplayCategory)
}
