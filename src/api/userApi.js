import { api } from './index'

function unwrap(response) {
  return response?.data ?? response?.result ?? response
}

export const userApi = {
  getMe: () => api.get('/api/users/me').then(unwrap),
  updateMe: ({ email, name }) => api.put('/api/users/me', { email, name }).then(unwrap),
  getProfile: (userId) => api.get(`/api/users/${userId}/profile`).then(unwrap),
  follow: (userId) => api.post(`/api/users/${userId}/follow`, {}).then(unwrap),
  unfollow: (userId) => api.delete(`/api/users/${userId}/follow`).then(unwrap),
}
