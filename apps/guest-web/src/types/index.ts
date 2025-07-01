export interface Guest {
  id?: string;
  name: string;
  email: string;
  phone: string;
}

export interface Reservation {
  id?: string;
  guestId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  expectedArrivalTime: string;
  tableSize: number;
  notes?: string;
  status: ReservationStatus;
  createdAt?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export enum ReservationStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ReservationFilter {
  status?: ReservationStatus[];
  startDate?: string;
  endDate?: string;
  guestName?: string;
  guestEmail?: string;
  tableSize?: number;
} 