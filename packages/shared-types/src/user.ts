// 用户相关类型定义

export enum UserRole {
  GUEST = 'guest',
  EMPLOYEE = 'employee'
}

export interface BaseUser {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guest extends BaseUser {
  name: string;
  phone: string;
}

export interface Employee extends BaseUser {
  username: string;
  hashedPassword: string;
  role: UserRole.EMPLOYEE;
}

export interface CreateGuestInput {
  name: string;
  email: string;
  phone: string;
}

export interface CreateEmployeeInput {
  username: string;
  email: string;
  password: string;
}

export interface UpdateGuestInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface UpdateEmployeeInput {
  username?: string;
  email?: string;
  password?: string;
} 