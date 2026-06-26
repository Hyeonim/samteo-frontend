const BASE_URL = import.meta.env.VITE_API_URL || ''

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const token = getToken()
  const isFormData = options.body instanceof FormData
  const { headers: customHeaders, ...requestOptions } = options
  const res = await fetch(`${BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(customHeaders || {}),
    },
  })
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}`)
    error.status = res.status
    throw error
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  form: (path, formData, method = 'POST') => request(path, { method, body: formData }),
}
