import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Methods
export const apiService = {
  // Health check
  healthCheck: () => api.get('/health'),
  
  // Seed data
  seedData: () => api.post('/seed'),

  // Auth
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  
  // Categories
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  
  // Subcategories
  getSubcategories: (categoryId = null) => 
    api.get('/subcategories', { params: categoryId ? { category_id: categoryId } : {} }),
  createSubcategory: (data) => api.post('/subcategories', data),
  deleteSubcategory: (id) => api.delete(`/subcategories/${id}`),
  
  // Products
  getProducts: (params = {}) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateProduct: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  
  // Videos
  getVideos: (category = null) => 
    api.get('/videos', { params: category ? { category } : {} }),
  createVideo: (formData) => api.post('/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteVideo: (id) => api.delete(`/videos/${id}`),
  
  // Queries
  submitQuery: (data) => api.post('/queries', data),
  getQueries: () => api.get('/queries'),
  updateQueryStatus: (id, status) => api.put(`/queries/${id}/status`, null, { params: { status } }),
};

export default api;
