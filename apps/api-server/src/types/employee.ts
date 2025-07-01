export enum UserRole {
  GUEST = 'guest',
  EMPLOYEE = 'employee'
}

export interface Employee {
  id: string;
  username: string;
  email: string;
  password?: string; // 通常不暴露，仅用于创建和验证
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeInput {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  employee: Omit<Employee, 'password'>;
  token: string;
} 