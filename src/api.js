import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// ── 任务管理 ─────────────────────
export const getTasks = () => api.get('/tasks').then(r => r.data)
export const getTask = (id) => api.get(`/tasks/${id}`).then(r => r.data)
export const createTask = (data) => api.post('/tasks', data).then(r => r.data)
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then(r => r.data)

// ── 执行签到 ─────────────────────
export const runTask = (id, showBrowser = false) =>
  api.post(`/tasks/${id}/run`, null, { params: { show_browser: showBrowser }, timeout: 120000 }).then(r => r.data)

export const runConfig = (config, showBrowser = false) =>
  api.post('/run-config', config, { params: { show_browser: showBrowser }, timeout: 120000 }).then(r => r.data)

// ── 录制 ─────────────────────────
export const startRecording = (url, name) =>
  api.post('/record/start', { url, name }).then(r => r.data)

export const stopRecording = () =>
  api.post('/record/stop', null, { timeout: 60000 }).then(r => r.data)

export const getRecordingStatus = () =>
  api.get('/record/status').then(r => r.data)

// ── 桌面端录制 ───────────────────
export const startDesktopRecording = (processPath, name) =>
  api.post('/desktop/record/start', { process_path: processPath, name }).then(r => r.data)

export const stopDesktopRecording = () =>
  api.post('/desktop/record/stop', null, { timeout: 60000 }).then(r => r.data)

export const getDesktopRecordingStatus = () =>
  api.get('/desktop/record/status').then(r => r.data)

// ── 桌面端文件浏览 ─────────────
export const browseFiles = (path = '') =>
  api.get('/desktop/browse', { params: { path } }).then(r => r.data)

// ── 日志 ─────────────────────────
export const getLogs = (taskName, limit = 50) =>
  api.get('/logs', { params: { task_name: taskName, limit } }).then(r => r.data)

// ── 健康检查 ─────────────────────
export const healthCheck = () => api.get('/health').then(r => r.data)

export default api
