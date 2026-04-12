import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { useUserStore } from '@/stores/useUserStore';

const instance: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
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

export const get = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return instance.get(url, config);
};

export const post = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  return instance.post(url, data, config);
};

export const put = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  return instance.put(url, data, config);
};

export const del = <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return instance.delete(url, config);
};
