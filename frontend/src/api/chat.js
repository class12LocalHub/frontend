import apiClient from './client'

export function sendChatMessage(message, history = []) {
  return apiClient.post('/api/chat', {
    message,
    history: history.slice(-20),
  })
}
