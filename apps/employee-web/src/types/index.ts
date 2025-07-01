export enum UserRole {
  GUEST = 'guest',
  EMPLOYEE = 'employee'
}

export type EmployeeRole = UserRole;

export interface Employee {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id?: string;
  name: string;
  email: string;
  phone: string;
}

export interface Reservation {
  id: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  tableSize?: number;
  expectedArrivalTime: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  partySize?: number;
  specialRequests?: string;
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface ReservationFilter {
  status?: ReservationStatus[];
  startDate?: string;
  endDate?: string;
  guestName?: string;
  guestEmail?: string;
  tableSize?: number;
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  employee: Employee;
  token: string;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export interface ReservationStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  todayReservations: number;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface ReservationFilters {
  status?: ReservationStatus;
  date?: string;
  customerEmail?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MutationResponse {
  success: boolean;
  message?: string;
} 