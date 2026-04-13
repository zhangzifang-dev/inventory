import request from './request';

export const productApi = {
  list: (params?: any) => request.get('/products', { params }),
  get: (id: number) => request.get(`/products/${id}`),
  create: (data: any) => request.post('/products', data),
  update: (id: number, data: any) => request.put(`/products/${id}`, data),
  delete: (id: number) => request.delete(`/products/${id}`),
};

export const categoryApi = {
  list: (params?: any) => request.get('/categories', { params }),
  create: (data: any) => request.post('/categories', data),
  update: (id: number, data: any) => request.put(`/categories/${id}`, data),
  delete: (id: number) => request.delete(`/categories/${id}`),
};

export const supplierApi = {
  list: (params?: any) => request.get('/suppliers', { params }),
  get: (id: number) => request.get(`/suppliers/${id}`),
  create: (data: any) => request.post('/suppliers', data),
  update: (id: number, data: any) => request.put(`/suppliers/${id}`, data),
  delete: (id: number) => request.delete(`/suppliers/${id}`),
};

export const customerApi = {
  list: (params?: any) => request.get('/customers', { params }),
  get: (id: number) => request.get(`/customers/${id}`),
  create: (data: any) => request.post('/customers', data),
  update: (id: number, data: any) => request.put(`/customers/${id}`, data),
  delete: (id: number) => request.delete(`/customers/${id}`),
};

export const purchaseOrderApi = {
  list: (params?: any) => request.get('/purchase-orders', { params }),
  get: (id: number) => request.get(`/purchase-orders/${id}`),
  create: (data: any) => request.post('/purchase-orders', data),
  update: (id: number, data: any) => request.put(`/purchase-orders/${id}`, data),
  delete: (id: number) => request.delete(`/purchase-orders/${id}`),
};

export const salesOrderApi = {
  list: (params?: any) => request.get('/sales-orders', { params }),
  get: (id: number) => request.get(`/sales-orders/${id}`),
  create: (data: any) => request.post('/sales-orders', data),
  update: (id: number, data: any) => request.put(`/sales-orders/${id}`, data),
  delete: (id: number) => request.delete(`/sales-orders/${id}`),
};

export const inventoryApi = {
  list: (params?: any) => request.get('/inventory', { params }),
  get: (productId: number) => request.get(`/inventory/${productId}`),
  update: (data: any) => request.post('/inventory/update', data),
  lowStock: (params?: any) => request.get('/inventory/low-stock', { params }),
};

export const reportApi = {
  sales: (params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'month'; status?: string }) => 
    request.get('/reports/sales', { params }),
  purchase: (params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'month'; status?: string }) => 
    request.get('/reports/purchase', { params }),
  profit: (params?: any) => request.get('/reports/profit', { params }),
};

export const userApi = {
  list: (params?: any) => request.get('/users', { params }),
  get: (id: number) => request.get(`/users/${id}`),
  create: (data: any) => request.post('/users', data),
  update: (id: number, data: any) => request.put(`/users/${id}`, data),
  delete: (id: number) => request.delete(`/users/${id}`),
};

export const roleApi = {
  list: (params?: any) => request.get('/roles', { params }),
};

export const discountApi = {
  list: (params?: any) => request.get('/discounts', { params }),
  create: (data: any) => request.post('/discounts', data),
  update: (id: number, data: any) => request.put(`/discounts/${id}`, data),
  delete: (id: number) => request.delete(`/discounts/${id}`),
};

export const couponApi = {
  list: (params?: any) => request.get('/coupons', { params }),
  create: (data: any) => request.post('/coupons', data),
  update: (id: number, data: any) => request.put(`/coupons/${id}`, data),
  delete: (id: number) => request.delete(`/coupons/${id}`),
};
