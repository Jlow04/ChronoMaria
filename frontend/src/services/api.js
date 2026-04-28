import axios from 'axios';
import { getDepartmentFilter } from './authHelper';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Department Service
export const departmentService = {
  getAll: async () => {
    const response = await api.get('/departments');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/departments', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },
};

// User Service
export const userService = {
  login: async (username, password) => {
    const response = await api.post('/users/login', { username, password });
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  create: async (username, password, email, currentUsername, department_id) => {
    const response = await api.post('/users', { username, password, email, admin_username: currentUsername, department_id });
    return response.data;
  },
  update: async (id, role, is_active, currentUsername) => {
    const response = await api.put(`/users/${id}`, { role, is_active, admin_username: currentUsername });
    return response.data;
  },
  delete: async (id, currentUsername) => {
    const response = await api.delete(`/users/${id}`, { data: { admin_username: currentUsername } });
    return response.data;
  },
};

// Faculty Service
export const facultyService = {
  getAll: async (params = {}) => {
    const departmentFilter = getDepartmentFilter();
    const queryParams = { ...params };

    if (departmentFilter) {
      queryParams.department = departmentFilter;
    }

    const response = await api.get('/faculty', { params: queryParams });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/faculty/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/faculty', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/faculty/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/faculty/${id}`);
    return response.data;
  },
};

// Subject Service
export const subjectService = {
  getAll: async () => {
    const departmentFilter = getDepartmentFilter();
    const params = {};

    if (departmentFilter) {
      params.department = departmentFilter;
    }

    const response = await api.get('/subjects', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/subjects', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/subjects/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },
};

// Room Service
export const roomService = {
  getAll: async () => {
    const departmentFilter = getDepartmentFilter();
    const params = {};

    if (departmentFilter) {
      params.department = departmentFilter;
    }

    const response = await api.get('/rooms', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/rooms', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/rooms/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  },
};

// Schedule Service
export const scheduleService = {
  count: async () => {
    const response = await api.get('/schedule/count');
    return response.data;
  },
  getMaster: async () => {
    const response = await api.get('/schedule/master');
    return response.data;
  },
  generate: async (data) => {
    const response = await api.post('/schedule/generate', data);
    return response.data;
  },
  validate: async (schedule) => {
    const response = await api.post('/schedule/validate', { schedule });
    return response.data;
  },
};

// Audit Log Service
export const auditLogService = {
  getAll: async () => {
    const response = await api.get('/audit-logs');
    return response.data;
  },
  getByAction: async (action) => {
    const response = await api.get(`/audit-logs/action/${action}`);
    return response.data;
  },
};

export default api;
