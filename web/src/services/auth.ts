import request from './request';
import { ApiResponse } from '@/types/common';
import { LoginParams, LoginResult, User } from '@/types/user';

export const login = (params: LoginParams) => {
  return request.post<ApiResponse<LoginResult>>('/auth/login', params);
};

export const getProfile = () => {
  return request.get<ApiResponse<User>>('/auth/profile');
};
