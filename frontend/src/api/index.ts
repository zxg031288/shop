import axios from 'axios';

const BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || '网络错误，请稍后重试';
    return Promise.reject(new Error(message));
  }
);

// ============ 商品相关 ============
export const getProducts = (params?: { category?: string; keyword?: string }) =>
  api.get<any, any>('/products', { params });

export const getProduct = (id: number) =>
  api.get<any, any>(`/products/${id}`);

export const getCategories = () =>
  api.get<any, any>('/products/meta/categories');

export const getHomeBanner = () =>
  api.get<any, any>('/products/meta/home-banner');

// ============ 购物车相关 ============
export const getCart = () =>
  api.get<any, any>('/cart');

export const addCart = (product_id: number, quantity = 1) =>
  api.post<any, any>('/cart', { product_id, quantity });

export const updateCart = (id: number, quantity: number) =>
  api.put<any, any>(`/cart/${id}`, { quantity });

export const deleteCart = (id: number) =>
  api.delete<any, any>(`/cart/${id}`);

export const clearCart = () =>
  api.delete<any, any>('/cart');

// ============ 订单相关 ============
export const getOrders = () =>
  api.get<any, any>('/orders');

export const getOrder = (id: number) =>
  api.get<any, any>(`/orders/${id}`);

export const createOrder = (data: {
  buyer_name: string;
  buyer_phone: string;
  buyer_addr: string;
  buyer_province?: string;
  buyer_city?: string;
  buyer_district?: string;
  pay_method: 'wechat' | 'alipay';
  cart_item_ids?: number[];
}) => api.post<any, any>('/orders', data);

// ============ 商家管理相关 ============
export const adminLogin = (username: string, password: string) =>
  api.post<any, any>('/admin/login', { username, password });

export const adminGetProducts = () =>
  api.get<any, any>('/admin/products');

export const adminCreateProduct = (formData: FormData) =>
  api.post<any, any>('/admin/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const adminUpdateProduct = (id: number, formData: FormData) =>
  api.put<any, any>(`/admin/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const adminUpdateProductStatus = (id: number, status: 'active' | 'off') =>
  api.put<any, any>(`/admin/products/${id}/status`, { status });

export const adminDeleteProduct = (id: number) =>
  api.delete<any, any>(`/admin/products/${id}`);

export const adminGetHomeBanner = () =>
  api.get<any, any>('/admin/home-banner');

export const adminUpdateHomeBanner = (data: {
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  badge: string;
  emoji: string;
  linkUrl?: string;
}) => api.put<any, any>('/admin/home-banner', data);

export const adminGetOrders = (status?: string) =>
  api.get<any, any>('/admin/orders', { params: { status } });

export const adminShipOrder = (id: number, status: 'paid' | 'shipped' | 'done') =>
  api.post<any, any>(`/admin/orders/${id}/ship`, { status });

export const adminGetStats = () =>
  api.get<any, any>('/admin/stats');

// 导出订单 CSV（返回 blob）
export const adminExportOrders = (status?: string) =>
  api.get<any, any>('/admin/orders/export', { params: { status }, responseType: 'blob' });

// ============ 用户认证相关 ============
export const userRegister = (data: { username: string; password: string; nickname?: string; phone?: string }) =>
  api.post<any, any>('/auth/register', data);

export const userLogin = (username: string, password: string) =>
  api.post<any, any>('/auth/login', { username, password });

export const getCurrentUser = () =>
  api.get<any, any>('/auth/me');

export const userLogout = () =>
  api.post<any, any>('/auth/logout');

// ============ 收货地址相关 ============
export const getAddresses = () =>
  api.get<any, any>('/addresses');

export const createAddress = (data: {
  name: string; phone: string; province: string; city: string; district: string;
  detail: string; is_default?: number;
}) => api.post<any, any>('/addresses', data);

export const updateAddress = (id: number, data: {
  name: string; phone: string; province: string; city: string; district: string;
  detail: string; is_default?: number;
}) => api.put<any, any>(`/addresses/${id}`, data);

export const deleteAddress = (id: number) =>
  api.delete<any, any>(`/addresses/${id}`);

export const setDefaultAddress = (id: number) =>
  api.put<any, any>(`/addresses/${id}/default`);

// ============ 支付凭证相关 ============
export const confirmPayment = (data: FormData) =>
  api.post<any, any>('/pay/confirm', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const getPayStatus = (orderNo: string) =>
  api.get<any, any>(`/pay/status/${orderNo}`);

export default api;
