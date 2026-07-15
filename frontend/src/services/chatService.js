import api from './api'

const CHAT_ROLES = new Set(['user', 'assistant', 'system'])

const normalizeHistory = (history) =>
  (Array.isArray(history) ? history : [])
    .filter(
      (item) =>
        CHAT_ROLES.has(item?.role) &&
        typeof item?.content === 'string' &&
        item.content.length > 0
    )
    .slice(-20)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 4000),
    }))

export async function sendChatMessage(message, history = [], options = {}) {
  const response = await api.post(
    '/api/chat',
    {
      message,
      history: normalizeHistory(history),
    },
    {
      signal: options.signal,
    }
  )

  return response.data
}
