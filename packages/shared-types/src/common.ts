// 通用类型定义

export interface PaginationInput {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FilterInput {
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
} 