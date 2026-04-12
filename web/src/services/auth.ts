import { get, post } from './request';
import { ApiResponse } from '@/types/common';
import { LoginParams, LoginResult, User } from '@/types/user';

export const login = (params: LoginParams): Promise<ApiResponse<LoginResult>> => {
  return post<ApiResponse<LoginResult>>('/auth/login', params);
};

export const getProfile = (): Promise<ApiResponse<User>> => {
  return get<ApiResponse<User>>('/auth/profile');
};
