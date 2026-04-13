import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { useUserStore } from '@/stores/useUserStore';

const instance: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;
    if (token) { config.headers.Authorization = `Bearer ${token}`; }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        useUserStore.getState().logout();
        window.location.href = '/login';
        message.error('登录已过期，请重新登录');
      } else {
        message.error(data?.message || '请求失败');
      }
    } else {
      message.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => instance.get(url, config) as Promise<T>,
  post: <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => instance.post(url, data, config) as Promise<T>,
  put: <T = any>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => instance.put(url, data, config) as Promise<T>,
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => instance.delete(url, config) as Promise<T>,
};

export default request;
