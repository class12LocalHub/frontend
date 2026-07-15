export function normalizeTourApiId(value) {
  return String(value)
}

export function normalizeLocationId(value) {
  if (value === null || value === undefined || value === '') return null

  const normalized = Number(value)

  return Number.isFinite(normalized) ? normalized : null
}

export function clampPageSize(value, fallback = 20) {
  const normalized = Number(value) || fallback

  return Math.min(Math.max(normalized, 1), 100)
}
