import axios from 'axios';

// In produzione il Next.js proxy (next.config.js rewrites) instrada /api/* → backend
const BASE_URL = typeof window !== 'undefined'
  ? '/api'
  : (process.env.BACKEND_URL || 'http://localhost:4000') + '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rb_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('rb_token');
      localStorage.removeItem('rb_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; fullName: string; workspaceName: string; phone: string; referralCode?: string; }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  resendVerification: () => api.post('/auth/resend-verification'),
  deleteAccount: (password: string) =>
    api.delete('/auth/account', { data: { password } }),
  exportData: () => api.get('/auth/export'),
};

// Admin (riservato master)
export const adminApi = {
  getReferralCodes: () => api.get('/admin/referral-codes'),
  createReferralCode: (data: { code: string; referrerName: string; amountCents?: number; ownerEmail?: string }) => api.post('/admin/referral-codes', data),
  toggleReferralCode: (data: { code: string; active: boolean }) => api.post('/admin/referral-codes/toggle', data),
  setPlan: (data: { email?: string; userId?: string; plan: string }) => api.post('/admin/set-plan', data),
  stats: () => api.get('/auth/admin/stats'),
  deleteAccount: (userId: string) => api.post('/auth/admin/delete-account', { userId }),
};

// Billing
export const referralApi = {
  me: () => api.get('/referral/me'),
  request: () => api.post('/referral/request'),
  publicStatus: (code: string) => api.get('/referral/public/' + encodeURIComponent(code)),
};

export const teamApi = {
  getMembers: () => api.get('/team/members'),
  addMember: (data: { email: string; password: string; fullName: string; role?: string }) => api.post('/team/members', data),
  removeMember: (userId: string) => api.delete(`/team/members/${userId}`),
};

export const billingApi = {
  status: () => api.get('/billing/status'),
  createCheckout: (plan?: string) => api.post('/billing/checkout', plan ? { plan } : {}),
  createPortal: () => api.post('/billing/portal'),
};

// AI Consulente
export const aiApi = {
  uploadKnowledgeFile: (formData: FormData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('rb_token') : null;
    return fetch(BASE_URL + '/kb/upload', {
      method: 'POST',
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      body: formData,
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { const err: any = new Error((data && data.error) || 'Errore caricamento'); err.response = { data, status: r.status }; throw err; }
      return { data };
    });
  },
  suggest: (question: string, provider?: string, history?: { role: string; content: string }[]) => api.post('/ai/suggest', { question, provider, history }),
  listKnowledge: () => api.get('/ai/knowledge'),
  addKnowledge: (data: { title: string; content: string; source_type?: string }) =>
    api.post('/ai/knowledge', data),
  deleteKnowledge: (id: string) => api.delete(`/ai/knowledge/${id}`),
};

// Ingredients
export const ingredientsApi = {
  list: (params?: { categoryId?: string; search?: string }) => api.get('/ingredients', { params }),
  get: (id: string) => api.get(`/ingredients/${id}`),
  create: (data: any) => api.post('/ingredients', data),
  update: (id: string, data: any) => api.put(`/ingredients/${id}`, data),
  delete: (id: string) => api.delete(`/ingredients/${id}`),
  addPrice: (id: string, data: any) => api.post(`/ingredients/${id}/prices`, data),
  priceAlerts: (threshold?: number) => api.get('/ingredients/alerts/prices', { params: { threshold } }),
  restock: () => api.get('/ingredients/restock'),
  menuAllergens: (menuId: string) => api.get('/ingredients/menu-allergens', { params: { menuId } }),
  categories: () => api.get('/ingredients/categories/list'),
};

// Invoices (caricamento fatture → prezzi automatici)
export const invoicesApi = {
  parse: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/invoices/parse', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  confirm: (data: { validFrom?: string; lines: any[] }) => api.post('/invoices/confirm', data),
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

// Motore Creatività Menu
export const creativaApi = {
  rules: () => api.get('/creativita/rules'),
  createRule: (data: any) => api.post('/creativita/rules', data),
  updateRule: (id: string, data: any) => api.put(`/creativita/rules/${id}`, data),
  deleteRule: (id: string) => api.delete(`/creativita/rules/${id}`),
  refMenus: () => api.get('/creativita/reference-menus'),
  createRefMenu: (data: any) => api.post('/creativita/reference-menus', data),
  updateRefMenu: (id: string, data: any) => api.put(`/creativita/reference-menus/${id}`, data),
  deleteRefMenu: (id: string) => api.delete(`/creativita/reference-menus/${id}`),
  generate: (data: any) => api.post('/creativita/generate', data),
  history: () => api.get('/creativita/generations'),
};
