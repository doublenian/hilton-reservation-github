// 导出所有类型定义
export * from './auth';
export * from './reservation';
export * from './user';
export * from './common';

// User types
export enum UserRole {
  GUEST = 'guest',
  EMPLOYEE = 'employee',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestProfile extends User {
  role: UserRole.GUEST;
  phone?: string;
}

export interface EmployeeProfile extends User {
  role: UserRole.EMPLOYEE;
  department?: string;
  position?: string;
}

// Reservation types
export enum ReservationStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  expectedArrivalTime: Date;
  tableSize: number;
  status: ReservationStatus;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  cancelledAt?: Date;
  completedAt?: Date;
  completedBy?: string;
}

export interface CreateReservationInput {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  expectedArrivalTime: Date;
  tableSize: number;
  specialRequests?: string;
}

export interface UpdateReservationInput {
  guestName?: string;
  guestPhone?: string;
  expectedArrivalTime?: Date;
  tableSize?: number;
  specialRequests?: string;
}

export interface ReservationFilter {
  status?: ReservationStatus[];
  date?: Date;
  dateRange?: {
    start: Date;
    end: Date;
  };
  startDate?: Date;
  endDate?: Date;
  tableSize?: number;
  guestEmail?: string;
  guestName?: string;
  search?: string;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
  stack?: string;
}

// GraphQL types
export interface GraphQLContext {
  user?: User;
  request: any;
}

// Event types for real-time updates
export interface ReservationEvent {
  type: 'created' | 'updated' | 'cancelled' | 'approved' | 'completed';
  reservation: Reservation;
  user: User;
  timestamp: Date;
}

// Configuration types
export interface DatabaseConfig {
  connectionString: string;
  username: string;
  password: string;
  bucketName: string;
}

export interface JWTConfig {
  secret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

export interface CORSConfig {
  origin: string;
  credentials: boolean;
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  jwt: JWTConfig;
  cors: CORSConfig;
}

// Utility types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Constants
export const TABLE_SIZES = [1, 2, 4, 6, 8, 10, 12] as const;
export const MAX_TABLE_SIZE = 12;
export const MIN_TABLE_SIZE = 1;

export const RESERVATION_TIME_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
] as const;

export const DEFAULT_PAGINATION_LIMIT = 20;
export const MAX_PAGINATION_LIMIT = 100; 