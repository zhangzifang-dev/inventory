export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  status: number;
  roles: Role[];
  permissions: Permission[];
  createdAt: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: User;
}
