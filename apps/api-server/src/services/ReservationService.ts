import { ReservationRepository } from '../repositories/ReservationRepository';
import { logger } from '../utils/logger';
import {
  Reservation,
  CreateReservationInput,
  UpdateReservationInput,
  ReservationFilter,
  ReservationStatus,
  PaginationInput,
  PaginationResult,
} from '@hilton-reservation/shared-types';
import { getBusinessHours, isWithinBusinessHours, formatBusinessHours, getTimezoneInfo } from '../config/business-hours';

export class ReservationService {
  private get reservationRepository() {
    return new ReservationRepository();
  }

  async createReservation(input: CreateReservationInput): Promise<Reservation> {
    // 验证预定时间
    this.validateReservationTime(input.expectedArrivalTime);
    
    // 验证餐桌大小
    this.validateTableSize(input.tableSize);

    // 检查是否有重复预定
    await this.checkDuplicateReservation(input);

    const reservation = await this.reservationRepository.create(input);
    
    logger.info(`New reservation created: ${reservation.id} for ${reservation.guestEmail}`);
    return reservation;
  }

  async getReservation(id: string): Promise<Reservation | null> {
    return await this.reservationRepository.findById(id);
  }

  async getReservations(
    filter: ReservationFilter = {},
    pagination: PaginationInput = {}
  ): Promise<PaginationResult<Reservation>> {
    return await this.reservationRepository.findMany(filter, pagination);
  }

  async updateReservation(
    id: string,
    input: UpdateReservationInput
  ): Promise<Reservation | null> {
    const existing = await this.reservationRepository.findById(id);
    if (!existing) {
      throw new Error('Reservation not found');
    }

    // 检查可更新的状态
    if (![ReservationStatus.REQUESTED, ReservationStatus.APPROVED].includes(existing.status)) {
      throw new Error('Cannot update cancelled or completed reservation');
    }

    // 对于已确认的预订，只允许更新notes字段
    if (existing.status === ReservationStatus.APPROVED) {
      const hasNonNotesUpdates = Object.keys(input).some(key => key !== 'notes');
      if (hasNonNotesUpdates) {
        throw new Error('For approved reservations, only notes can be updated');
      }
    }

    // 验证更新的数据
    if (input.expectedArrivalTime) {
      this.validateReservationTime(input.expectedArrivalTime);
    }

    if (input.tableSize) {
      this.validateTableSize(input.tableSize);
    }

    const updatedReservation = await this.reservationRepository.update(id, input);
    
    logger.info(`Reservation updated: ${id}`);
    return updatedReservation;
  }

  async cancelReservation(id: string): Promise<Reservation | null> {
    const existing = await this.reservationRepository.findById(id);
    if (!existing) {
      throw new Error('Reservation not found');
    }

    // 只允许取消Requested或Approved状态的预定
    if (![ReservationStatus.REQUESTED, ReservationStatus.APPROVED].includes(existing.status)) {
      throw new Error('Cannot cancel reservation that is already cancelled or completed');
    }

    const updatedReservation = await this.reservationRepository.updateStatus(
      id,
      ReservationStatus.CANCELLED
    );

    logger.info(`Reservation cancelled: ${id}`);
    return updatedReservation;
  }

  async approveReservation(id: string, employeeId: string): Promise<Reservation | null> {
    const existing = await this.reservationRepository.findById(id);
    if (!existing) {
      throw new Error('Reservation not found');
    }

    if (existing.status !== ReservationStatus.REQUESTED) {
      throw new Error('Cannot approve reservation that is not in Requested status');
    }

    const updatedReservation = await this.reservationRepository.updateStatus(
      id,
      ReservationStatus.APPROVED,
      employeeId
    );

    logger.info(`Reservation approved: ${id} by employee ${employeeId}`);
    return updatedReservation;
  }

  async completeReservation(id: string, employeeId: string): Promise<Reservation | null> {
    const existing = await this.reservationRepository.findById(id);
    if (!existing) {
      throw new Error('Reservation not found');
    }

    if (existing.status !== ReservationStatus.APPROVED) {
      throw new Error('Cannot complete reservation that is not approved');
    }

    const updatedReservation = await this.reservationRepository.updateStatus(
      id,
      ReservationStatus.COMPLETED,
      employeeId
    );

    logger.info(`Reservation completed: ${id} by employee ${employeeId}`);
    return updatedReservation;
  }

  async getReservationsByEmail(email: string): Promise<Reservation[]> {
    return await this.reservationRepository.findByEmail(email);
  }

  async getReservationStats(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    todayReservations: number;
  }> {
    try {
      // 获取所有预订
      const allReservations = await this.reservationRepository.findMany({}, { page: 1, limit: 10000 });
      const reservations = allReservations.data;

      // 计算统计信息
      const total = reservations.length;
      const pending = reservations.filter(r => r.status === ReservationStatus.REQUESTED).length;
      const confirmed = reservations.filter(r => r.status === ReservationStatus.APPROVED).length;
      const cancelled = reservations.filter(r => r.status === ReservationStatus.CANCELLED).length;

      // 计算今日预订数量
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const todayReservations = reservations.filter(r => {
        const arrivalTime = new Date(r.expectedArrivalTime);
        return arrivalTime >= todayStart && arrivalTime < todayEnd;
      }).length;

      logger.info(`Generated reservation stats: total=${total}, pending=${pending}, confirmed=${confirmed}, cancelled=${cancelled}, today=${todayReservations}`);

      return {
        total,
        pending,
        confirmed,
        cancelled,
        todayReservations
      };
    } catch (error) {
      logger.error('Error getting reservation stats:', error);
      throw new Error('Failed to calculate reservation statistics');
    }
  }

  // 私有验证方法
  private validateReservationTime(arrivalTime: Date): void {
    const arrivalDate = arrivalTime;
    const now = new Date();

    logger.info(`Validating reservation time: ${arrivalDate.toISOString()} vs now: ${now.toISOString()}`);

    if (isNaN(arrivalDate.getTime())) {
      throw new Error('Invalid arrival time format');
    }

    if (arrivalDate <= now) {
      logger.error(`Arrival time ${arrivalDate.toISOString()} is not in the future (now: ${now.toISOString()})`);
      throw new Error('Arrival time must be in the future');
    }

    // 检查预定时间是否在营业时间内
    const businessHours = getBusinessHours();
    
    // 获取业务时区的本地时间
    const localDateTime = new Date(arrivalDate.toLocaleString("en-US", {timeZone: businessHours.timezone || 'Asia/Shanghai'}));
    const localHour = localDateTime.getHours();
    const minutes = localDateTime.getMinutes();
    
    logger.info(`UTC time: ${arrivalDate.toISOString()}`);
    logger.info(`Business timezone (${businessHours.timezone}): ${localDateTime.toLocaleString()}`);
    logger.info(`Checking business hours: ${localHour}:${minutes.toString().padStart(2, '0')} (business local time)`);
    logger.info(`Business hours config: ${formatBusinessHours(businessHours)} ${getTimezoneInfo(businessHours)}`);
    
    if (!isWithinBusinessHours(arrivalDate, businessHours)) {
      const businessHoursString = formatBusinessHours(businessHours);
      const timezoneInfo = getTimezoneInfo(businessHours);
      throw new Error(`Reservations are only accepted during business hours: ${businessHoursString} ${timezoneInfo}`);
    }
    
    logger.info(`Reservation time validation passed: ${localHour}:${minutes.toString().padStart(2, '0')} (business local time)`);
  }

  private validateTableSize(tableSize: number): void {
    if (tableSize < 1 || tableSize > 12) {
      throw new Error('Table size must be between 1 and 12 people');
    }
  }

  private async checkDuplicateReservation(input: CreateReservationInput): Promise<void> {
    // 检查同一邮箱在同一时间段内是否已有预定
    const existingReservations = await this.reservationRepository.findByEmail(input.guestEmail);
    
    const arrivalTime = input.expectedArrivalTime;
    const timeWindow = 2 * 60 * 60 * 1000; // 2小时时间窗口

    const conflictingReservation = existingReservations.find(reservation => {
      if (reservation.status === ReservationStatus.CANCELLED) {
        return false;
      }

      const existingTime = new Date(reservation.expectedArrivalTime);
      const timeDiff = Math.abs(arrivalTime.getTime() - existingTime.getTime());
      
      return timeDiff < timeWindow;
    });

    if (conflictingReservation) {
      throw new Error('You already have a reservation within 2 hours of this time');
    }
  }
} 