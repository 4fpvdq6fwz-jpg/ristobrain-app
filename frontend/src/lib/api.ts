import axios from 'axios';

// In produzione il Next.js proxy (next.config.js rewrites) instrada /api/* → backend
// In sviluppo locale con Docker usa lo stesso meccanismo
const BASE_URL = typeof window !== 'undefined'
  ? '/api'  // client-side: usa il proxy Next.js
  : (process.env.BACKEND_URL || 'http://localhost:4000') + '/api';  // server-side SSR

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rb_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('rb_token');
      localStorage.removeItem('rb_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; fullName: string; workspaceName: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
};

// Ingredients
export const ingredientsApi = {
  list: (params?: { categoryId?: string; search?: string }) => api.get('/ingredients', { params }),
  get: (id: string) => api.get(`/ingredients/${id}`),
  create: (data: any) => api.post('/ingredients', data),
  update: (id: string, data: any) => api.put(`/ingredients/${id}`, data),
  delete: (id: string) => api.delete(`/ingredients/${id}`),
  addPrice: (id: string, data: any) => api.post(`/ingredients/${id}/prices`, data),
  categories: () => api.get('/ingredients/categories/list'),
};

// Recipes
export const recipesApi = {
  list: (params?: { categoryId?: string; search?: string }) => api.get('/recipes', { params }),
  get: (id: string) => api.get(`/recipes/${id}`),
  create: (data: any) => api.post('/recipes', data),
  update: (id: string, data: any) => api.put(`/recipes/${id}`, data),
  clone: (id: string) => api.post(`/recipes/${id}/clone`, {}),
  delete: (id: string) => api.delete(`/recipes/${id}`),
  categories: () => api.get('/recipes/categories/list'),
};

// Menus
export const menusApi = {
  list: (params?: { locationId?: string }) => api.get('/menus', { params }),
  get: (id: string) => api.get(`/menus/${id}`),
  create: (data: any) => api.post('/menus', data),
  addItem: (menuId: string, data: any) => api.post(`/menus/${menuId}/items`, data),
  updateItem: (menuId: string, itemId: string, data: any) => api.put(`/menus/${menuId}/items/${itemId}`, data),
  deleteItem: (menuId: string, itemId: string) => api.delete(`/menus/${menuId}/items/${itemId}`),
};

// Sales
export const salesApi = {
  list: (params?: { locationId?: string }) => api.get('/sales', { params }),
  get: (id: string) => api.get(`/sales/${id}`),
  create: (data: any) => api.post('/sales', data),
  delete: (id: string) => api.delete(`/sales/${id}`),
};

// Calculations
export const calcApi = {
  recipe: (id: string) => api.get(`/calc/recipe/${id}`),
  menu: (menuId: string) => api.get(`/calc/menu/${menuId}`),
  engineering: (periodId: string) => api.get(`/calc/engineering?periodId=${periodId}`),
  pricingSuggestions: (menuId: string, targetFcPct?: number) =>
    api.get(`/calc/pricing-suggestions?menuId=${menuId}${targetFcPct ? `&targetFcPct=${targetFcPct}` : ''}`),
};

// Locations & suppliers
export const locationsApi = {
  list: () => api.get('/locations'),
  create: (data: any) => api.post('/locations', data),
  update: (id: string, data: any) => api.put(`/locations/${id}`, data),
};

export const suppliersApi = {
  list: () => api.get('/suppliers'),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
};
