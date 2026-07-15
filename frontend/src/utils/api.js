export function getApiErrorMessage(error, fallback = '요청을 처리하지 못했습니다.') {
  const detail = error?.response?.data?.detail

  if (typeof detail === 'string') return detail
  if (detail?.message) return detail.message
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg

  return error?.message || fallback
}
