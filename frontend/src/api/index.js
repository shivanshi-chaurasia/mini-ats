import axios from 'axios'

const base = import.meta.env.VITE_API_URL || '/api/v1'

const http = axios.create({ baseURL: base })

const SESSION_KEY = 'ats_session'

export const session = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY))
    } catch {
      return null
    }
  },
  set: (value) => localStorage.setItem(SESSION_KEY, JSON.stringify(value)),
  clear: () => localStorage.removeItem(SESSION_KEY),
}

http.interceptors.request.use(config => {
  const current = session.get()
  if (current?.token) config.headers.Authorization = `Bearer ${current.token}`
  return config
})

http.interceptors.response.use(
  res => res,
  err => {
    const isLogin = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !isLogin) {
      session.clear()
      window.location.assign('/login')
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (data) => http.post('/auth/login', data),
}

// --- Jobs ---
export const jobsApi = {
  getAll: () => http.get('/jobs'),
  getById: (id) => http.get(`/jobs/${id}`),
  create: (data) => http.post('/jobs', data),
  update: (id, data) => http.put(`/jobs/${id}`, data),
  delete: (id) => http.delete(`/jobs/${id}`),
}

// --- Candidates ---
export const candidatesApi = {
  search: (params) => http.get('/candidates', { params }),
  getById: (id) => http.get(`/candidates/${id}`),
  create: (data) => http.post('/candidates', data),
  update: (id, data) => http.put(`/candidates/${id}`, data),
  delete: (id) => http.delete(`/candidates/${id}`),
  moveStage: (id, data) => http.patch(`/candidates/${id}/stage`, data),
  getHistory: (id) => http.get(`/candidates/${id}/history`),
  addNote: (id, data) => http.post(`/candidates/${id}/notes`, data),
  getNotes: (id) => http.get(`/candidates/${id}/notes`),
}

// --- Dashboard ---
export const dashboardApi = {
  getMetrics: () => http.get('/dashboard'),
}

export default http
