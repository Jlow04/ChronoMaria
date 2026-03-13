import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Faculty Service
export const facultyService = {
  getAll: async () => {
    const response = await api.get('/faculty');
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
    const response = await api.get('/subjects');
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
    const response = await api.get('/rooms');
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

export default api;
