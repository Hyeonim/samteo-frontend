import { api } from './index'

function unwrap(response) {
  return response?.data ?? response?.result ?? response
}

export const notificationApi = {
  getNotifications: () => api.get('/api/notifications').then(unwrap),
  markAsRead: (notificationId) => (
    api.patch(`/api/notifications/${notificationId}/read`, {}).then(unwrap)
  ),
  markAllAsRead: () => api.patch('/api/notifications/read-all', {}).then(unwrap),
}
