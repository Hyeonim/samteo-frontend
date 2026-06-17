import { api } from './index'

export const myPlannerApi = {
  getAll: () => api.get('/api/my-planner'),
  create: (planner) => api.post('/api/my-planner', planner),
  update: (id, planner) => api.put(`/api/my-planner/${id}`, planner),
  remove: (id) => api.delete(`/api/my-planner/${id}`),
}
