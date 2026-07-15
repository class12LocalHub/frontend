/**
 * Display category (UI) to API category (backend) conversion
 * @param {string} displayCategory - Category shown in UI
 * @returns {string} API category name
 */
export function toApiCategory(displayCategory) {
  if (displayCategory === '축제/공연행사') {
    return '축제공연행사'
  }
  return displayCategory
}

/**
 * API category (backend) to display category (UI) conversion
 * @param {string} apiCategory - Category from API
 * @returns {string} Display category name
 */
export function toDisplayCategory(apiCategory) {
  if (apiCategory === '축제공연행사') {
    return '축제/공연행사'
  }
  return apiCategory || '기타'
}
