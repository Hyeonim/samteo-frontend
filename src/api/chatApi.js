import { api } from './index'

export const chatApi = {
  ask: (payload) => api.post('/api/chat', payload),
}
