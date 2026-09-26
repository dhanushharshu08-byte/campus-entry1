import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 20000,
});

// Request interceptor to attach persistent auth token
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('campusentry_token');
      if (token && token !== 'undefined' && token !== 'null') {
        if (config.headers && typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
          config.headers.set('X-Auth-Token', token);
        } else {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${token}`;
          config.headers['X-Auth-Token'] = token;
        }
      }
      // If data is FormData, remove Content-Type so Axios/browser sets boundary automatically
      if (config.data instanceof FormData) {
        if (config.headers && typeof config.headers.delete === 'function') {
          config.headers.delete('Content-Type');
          config.headers.delete('content-type');
        } else if (config.headers) {
          delete config.headers['Content-Type'];
          delete config.headers['content-type'];
        }
      }
    } catch {
      // ignore localStorage read issues
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred';
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
      message = 'Unable to connect to the server. Please make sure the CampuSentry backend is running.';
    } else if (error.message) {
      message = error.message;
    }

    const customError = {
      message,
      status: error.response?.status,
      error_code: error.response?.data?.error_code,
      data: error.response?.data,
      errors: error.response?.data?.errors,
    };
    return Promise.reject(customError);
  }
);

// Health Check API
export const checkHealth = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

// Auth API
export const authApi = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getCurrentUser: () => api.get('/api/auth/me'),
  updateProfile: (data) => api.patch('/api/auth/profile', data),
  changePassword: (data) => api.post('/api/auth/change-password', data),
  logout: () => api.post('/api/auth/logout'),
};

// Departments API
export const departmentsApi = {
  list: () => api.get('/api/departments'),
};

// Complaints API
export const complaintsApi = {
  list: (params) => api.get('/api/complaints', { params }),
  get: (id) => api.get(`/api/complaints/${id}`),
  track: (ticketId) => api.get(`/api/complaints/track/${encodeURIComponent(ticketId)}`),
  create: (formData) => api.post('/api/complaints', formData),
  close: (id) => api.patch(`/api/complaints/${id}/close`),
  reopen: (id, data) => api.patch(`/api/complaints/${id}/reopen`, data),
};

// Student API
export const studentApi = {
  getDashboard: () => api.get('/api/student/dashboard'),
};

// Faculty API
export const facultyApi = {
  getDashboard: () => api.get('/api/faculty/dashboard'),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/api/dashboard/stats'),
  getSummary: () => api.get('/api/dashboard/summary'),
  getDepartmentStatistics: () => api.get('/api/dashboard/department-statistics'),
  getStatusStatistics: () => api.get('/api/dashboard/status-statistics'),
  getRecentActivity: (limit = 20) => api.get('/api/dashboard/recent-activity', { params: { limit } }),
  getNotifications: (limit = 20) => api.get('/api/dashboard/notifications', { params: { limit } }),
};

// Notifications API
export const notificationsApi = {
  list: (params) => api.get('/api/notifications', { params }),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  markRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllRead: () => api.patch('/api/notifications/read-all'),
};

// Maintenance Staff API
export const maintenanceApi = {
  getComplaints: (params) => api.get('/api/maintenance/complaints', { params }),
  getStats: () => api.get('/api/maintenance/dashboard/stats'),
  getComplaintDetails: (id) => api.get(`/api/maintenance/complaints/${id}`),
  acceptComplaint: (id) => api.patch(`/api/maintenance/complaints/${id}/accept`),
  resolveComplaint: (id, formData) => api.patch(`/api/maintenance/complaints/${id}/resolve`, formData),
};

// Management Administration API
export const managementApi = {
  getStats: () => api.get('/api/management/dashboard/stats'),
  getDepartmentPerformance: () => api.get('/api/management/departments/performance'),
  getComplaintTrends: (days = 30) => api.get('/api/management/analytics/complaint-trends', { params: { days } }),
  getRecentComplaints: (limit = 10) => api.get('/api/management/complaints/recent', { params: { limit } }),
  getComplaints: (params) => api.get('/api/management/complaints', { params }),
  getComplaintDetails: (id) => api.get(`/api/management/complaints/${id}`),
  getUnassignedComplaints: () => api.get('/api/management/complaints/unassigned'),
  getOverdueComplaints: () => api.get('/api/management/complaints/overdue'),
  getStaffPerformance: () => api.get('/api/management/staff/performance'),
  getActivity: (limit = 20) => api.get('/api/management/activity', { params: { limit } }),
  
  // Interventions
  assignComplaint: (id, data) => api.patch(`/api/management/complaints/${id}/assign`, data),
  reassignComplaint: (id, data) => api.patch(`/api/management/complaints/${id}/reassign`, data),
  updatePriority: (id, data) => api.patch(`/api/management/complaints/${id}/priority`, data),
  addInternalRemark: (id, data) => api.post(`/api/management/complaints/${id}/remarks`, data),

  // Audit Logs
  getAuditLogs: (params) => api.get('/api/management/audit-logs', { params }),

  // User Management
  getUsers: (params) => api.get('/api/management/users', { params }),
  getManagementUsers: () => api.get('/api/management/users/management'),
  createManagementUser: (data) => api.post('/api/management/users/management', data),
  createMaintenanceUser: (data) => api.post('/api/management/users/maintenance', data),
  updateUser: (id, data) => api.patch(`/api/management/users/${id}`, data),
  updateUserPassword: (id, data) => api.post(`/api/management/users/${id}/password`, data),
  updateUserStatus: (id, data) => api.patch(`/api/management/users/${id}/status`, data),
  getUserActiveComplaints: (id) => api.get(`/api/management/users/${id}/active-complaints`),
  reassignUserComplaints: (id, data) => api.post(`/api/management/users/${id}/reassign-complaints`, data),
  disableAndReassignUser: (id, data) => api.post(`/api/management/users/${id}/disable-and-reassign`, data),
  deleteUser: (id, data) => api.delete(`/api/management/users/${id}`, { data }),
  deleteStaff: (id, data) => api.delete(`/api/management/staff/${id}`, { data }),
  getStaffRoster: () => api.get('/api/management/staff'),

  // Department Management
  getDepartments: () => api.get('/api/management/departments'),
  createDepartment: (data) => api.post('/api/management/departments', data),
  updateDepartment: (id, data) => api.patch(`/api/management/departments/${id}`, data),

  // System Settings
  getSettings: () => api.get('/api/management/settings'),
  updateSettings: (data) => api.patch('/api/management/settings', data),

  // Reports & Analytics
  getReports: (params) => api.get('/api/management/reports', { params }),
  getSlaAnalytics: () => api.get('/api/management/analytics/sla'),
  getResolutionPerformance: () => api.get('/api/management/analytics/resolution-performance'),

  // CSV Export URLs
  getComplaintsCsvUrl: () => `${api.defaults.baseURL || ''}/api/management/reports/complaints.csv`,
  getDepartmentsCsvUrl: () => `${api.defaults.baseURL || ''}/api/management/reports/departments.csv`,
  getStaffCsvUrl: () => `${api.defaults.baseURL || ''}/api/management/reports/staff.csv`,
  getSlaCsvUrl: () => `${api.defaults.baseURL || ''}/api/management/reports/sla.csv`,

  // Search & Backup
  search: (q) => api.get('/api/management/search', { params: { q } }),
  createBackup: () => api.post('/api/management/backup'),
  triggerSlaEvaluation: () => api.post('/api/management/sla/evaluate'),
};

export default api;
