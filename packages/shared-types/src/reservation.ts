// 预定相关类型定义

export enum ReservationStatus {
  REQUESTED = 'Requested',
  APPROVED = 'Approved',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed'
}

export interface Reservation {
  id: string;
  guestId?: string; // 可选，因为客人可能不是注册用户
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  expectedArrivalTime: string;
  tableSize: number;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string; // 员工ID
  approvedAt?: string;
}

export interface CreateReservationInput {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  expectedArrivalTime: string;
  tableSize: number;
  notes?: string;
}

export interface UpdateReservationInput {
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  expectedArrivalTime?: string;
  tableSize?: number;
  notes?: string;
}

export interface ReservationFilter {
  status?: ReservationStatus | ReservationStatus[];
  startDate?: string;
  endDate?: string;
  guestName?: string;
  guestEmail?: string;
  tableSize?: number;
}

export interface ReservationStatusUpdate {
  status: ReservationStatus;
  employeeId?: string;
} 