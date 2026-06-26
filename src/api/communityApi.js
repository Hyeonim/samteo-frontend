import { api } from './index'

function unwrap(response) {
  return response?.data ?? response?.result ?? response
}

export const communityApi = {
  getPosts: ({ page = 0, size = 9 } = {}) => (
    api.get(`/api/community/posts?page=${page}&size=${size}`).then(unwrap)
  ),
  getPost: (postId) => api.get(`/api/community/posts/${postId}`).then(unwrap),
  createPost: ({ content, images }) => {
    const formData = new FormData()
    formData.append('content', content || '')
    images.forEach((image) => formData.append('images', image))
    return api.form('/api/community/posts', formData).then(unwrap)
  },
  deletePost: (postId) => api.delete(`/api/community/posts/${postId}`),
  likePost: (postId) => api.post(`/api/community/posts/${postId}/likes`, {}).then(unwrap),
  unlikePost: (postId) => api.delete(`/api/community/posts/${postId}/likes`).then(unwrap),
  getComments: ({ postId, page = 0, size = 20 }) => (
    api.get(`/api/community/posts/${postId}/comments?page=${page}&size=${size}`).then(unwrap)
  ),
  createComment: ({ postId, content }) => (
    api.post(`/api/community/posts/${postId}/comments`, { content }).then(unwrap)
  ),
  deleteComment: ({ postId, commentId }) => (
    api.delete(`/api/community/posts/${postId}/comments/${commentId}`)
  ),
}
