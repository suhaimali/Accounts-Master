import api from './client';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (key, value) => api.put(`/settings/${key}`, { value }),
  bulkUpdate: (data) => api.put('/settings', data),
};

export const dailyAccountsAPI = {
  getAll: (params) => api.get('/daily-accounts', { params }),
  getToday: (branch) => api.get('/daily-accounts/today', { params: { branch } }),
  getByDate: (date, branch) => api.get(`/daily-accounts/${date}`, { params: { branch } }),
  update: (id, data) => api.put(`/daily-accounts/${id}`, data),
  updateDenominations: (id, denominations) => api.put(`/daily-accounts/${id}/denominations`, { denominations }),
  closeDay: (id) => api.post(`/daily-accounts/${id}/close`),
  reopenDay: (id) => api.post(`/daily-accounts/${id}/reopen`),
  delete: (id) => api.delete(`/daily-accounts/${id}`),
};

export const creditAPI = {
  getAll: (params) => api.get('/credit', { params }),
  create: (data) => api.post('/credit', data),
  update: (id, data) => api.put(`/credit/${id}`, data),
  delete: (id) => api.delete(`/credit/${id}`),
};

export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getCategorySummary: (params) => api.get('/expenses/categories/summary', { params }),
};

export const gpayAPI = {
  getAll: (params) => api.get('/gpay', { params }),
  create: (data) => api.post('/gpay', data),
  update: (id, data) => api.put(`/gpay/${id}`, data),
  delete: (id) => api.delete(`/gpay/${id}`),
};

export const pcAPI = {
  getAll: (params) => api.get('/pc', { params }),
  create: (data) => api.post('/pc', data),
  update: (id, data) => api.put(`/pc/${id}`, data),
  delete: (id) => api.delete(`/pc/${id}`),
};

export const cashCounterAPI = {
  getByDate: (date, branch) => api.get(`/cash-counter/${date}`, { params: { branch } }),
  update: (accountId, denominations) => api.put(`/cash-counter/${accountId}`, { denominations }),
};

export const carryForwardAPI = {
  getAll: (params) => api.get('/carry-forward', { params }),
  update: (accountId, carryForward) => api.put(`/carry-forward/${accountId}`, { carryForward }),
};

export const dashboardAPI = {
  getSummary: (branch) => api.get('/dashboard/summary', { params: { branch } }),
};

export const reportsAPI = {
  getDaily: (params) => api.get('/reports/daily', { params }),
  getExpenses: (params) => api.get('/reports/expenses', { params }),
  getReconciliation: (params) => api.get('/reports/reconciliation', { params }),
  getCreditOutstanding: (params) => api.get('/reports/credit-outstanding', { params }),
  exportReport: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
};

export const auditLogsAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
};

export const backupsAPI = {
  getAll: () => api.get('/backups'),
  create: () => api.post('/backups'),
  delete: (filename) => api.delete(`/backups/${filename}`),
  download: (filename) => `${api.defaults.baseURL}/backups/${filename}/download` // URL for window.open
};
