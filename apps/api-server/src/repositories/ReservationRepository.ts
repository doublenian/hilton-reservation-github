import { v4 as uuidv4 } from 'uuid';
import { getCollection, getCluster } from '../utils/database';
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

export class ReservationRepository {
  private get collection() {
    return getCollection();
  }
  
  private get cluster() {
    return getCluster();
  }

  async create(input: CreateReservationInput): Promise<Reservation> {
    try {
      const id = uuidv4();
      const now = new Date();
      
      const reservation: Reservation = {
        id,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        expectedArrivalTime: input.expectedArrivalTime,
        tableSize: input.tableSize,
        status: ReservationStatus.REQUESTED,
        specialRequests: input.specialRequests,
        createdAt: now,
        updatedAt: now,
      };

      // 添加文档类型标识
      const document = {
        ...reservation,
        type: 'reservation',
        // 转换Date为ISO字符串存储
        expectedArrivalTime: input.expectedArrivalTime.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await this.collection.insert(id, document);
      
      logger.info(`Created reservation: ${id}`);
      return reservation;
    } catch (error) {
      logger.error('Error creating reservation:', error);
      throw new Error('Failed to create reservation');
    }
  }

  async findById(id: string): Promise<Reservation | null> {
    try {
      const result = await this.collection.get(id);
      const data = result.content;
      
      if (data.type !== 'reservation') {
        return null;
      }

      // 移除type字段并转换日期字符串为Date对象
      const { type, ...reservationData } = data;
      const reservation: Reservation = {
        ...reservationData,
        expectedArrivalTime: new Date(reservationData.expectedArrivalTime),
        createdAt: new Date(reservationData.createdAt),
        updatedAt: new Date(reservationData.updatedAt),
        approvedAt: reservationData.approvedAt ? new Date(reservationData.approvedAt) : undefined,
        cancelledAt: reservationData.cancelledAt ? new Date(reservationData.cancelledAt) : undefined,
        completedAt: reservationData.completedAt ? new Date(reservationData.completedAt) : undefined,
      };
      return reservation;
    } catch (error: any) {
      if (error.code === 'DOCUMENT_NOT_FOUND') {
        return null;
      }
      logger.error(`Error finding reservation ${id}:`, error);
      throw new Error('Failed to find reservation');
    }
  }

  async findMany(
    filter: ReservationFilter = {},
    pagination: PaginationInput = {}
  ): Promise<PaginationResult<Reservation>> {
    try {
      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;

      // 构建查询条件
      let whereClause = 'WHERE type = "reservation"';
      const queryParams: any = {};

      if (filter.status) {
        if (Array.isArray(filter.status)) {
          whereClause += ' AND status IN $statuses';
          queryParams.statuses = filter.status;
        } else {
          whereClause += ' AND status = $status';
          queryParams.status = filter.status;
        }
      }

      if (filter.startDate) {
        whereClause += ' AND expectedArrivalTime >= $startDate';
        queryParams.startDate = filter.startDate.toISOString();
      }

      if (filter.endDate) {
        whereClause += ' AND expectedArrivalTime <= $endDate';
        queryParams.endDate = filter.endDate.toISOString();
      }

      if (filter.guestName) {
        whereClause += ' AND LOWER(guestName) LIKE $guestName';
        queryParams.guestName = `%${filter.guestName.toLowerCase()}%`;
      }

      if (filter.guestEmail) {
        whereClause += ' AND LOWER(guestEmail) LIKE $guestEmail';
        queryParams.guestEmail = `%${filter.guestEmail.toLowerCase()}%`;
      }

      if (filter.tableSize) {
        whereClause += ' AND tableSize = $tableSize';
        queryParams.tableSize = filter.tableSize;
      }

      // 查询数据
      const dataQuery = `
        SELECT META().id, *
        FROM \`hilton_reservations\`
        ${whereClause}
        ORDER BY createdAt DESC
        LIMIT $limit OFFSET $offset
      `;

      // 查询总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM \`hilton_reservations\`
        ${whereClause}
      `;

      const [dataResult, countResult] = await Promise.all([
        this.cluster.query(dataQuery, {
          parameters: { ...queryParams, limit, offset },
        }),
        this.cluster.query(countQuery, {
          parameters: queryParams,
        }),
      ]);

      const reservations = dataResult.rows.map((row: any) => {
        // 处理Couchbase返回的嵌套结构 - 数据在 hilton_reservations 属性中
        const bucketData = row.hilton_reservations || row;
        const { type, ...reservationData } = bucketData;
        
        // 确保id字段正确设置（从META()获取的id）
        if (row.id && !reservationData.id) {
          reservationData.id = row.id;
        }
        
        const processed = {
          ...reservationData,
          expectedArrivalTime: new Date(reservationData.expectedArrivalTime),
          createdAt: new Date(reservationData.createdAt),
          updatedAt: new Date(reservationData.updatedAt),
          approvedAt: reservationData.approvedAt ? new Date(reservationData.approvedAt) : undefined,
          cancelledAt: reservationData.cancelledAt ? new Date(reservationData.cancelledAt) : undefined,
          completedAt: reservationData.completedAt ? new Date(reservationData.completedAt) : undefined,
        } as Reservation;
        
        return processed;
      });

      const total = countResult.rows[0]?.total || 0;

      return {
        data: reservations,
        total,
        page,
        limit,
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error('Error finding reservations:', error);
      throw new Error('Failed to find reservations');
    }
  }

  async update(id: string, input: UpdateReservationInput): Promise<Reservation | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const updatedReservation: Reservation = {
        ...existing,
        ...input,
        updatedAt: new Date(),
      };

      const document = {
        ...updatedReservation,
        type: 'reservation',
        // 转换Date为ISO字符串存储
        expectedArrivalTime: updatedReservation.expectedArrivalTime.toISOString(),
        createdAt: updatedReservation.createdAt.toISOString(),
        updatedAt: updatedReservation.updatedAt.toISOString(),
        approvedAt: updatedReservation.approvedAt?.toISOString(),
        cancelledAt: updatedReservation.cancelledAt?.toISOString(),
        completedAt: updatedReservation.completedAt?.toISOString(),
      };

      await this.collection.replace(id, document);
      
      logger.info(`Updated reservation: ${id}`);
      return updatedReservation;
    } catch (error) {
      logger.error(`Error updating reservation ${id}:`, error);
      throw new Error('Failed to update reservation');
    }
  }

  async updateStatus(
    id: string,
    status: ReservationStatus,
    employeeId?: string
  ): Promise<Reservation | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const now = new Date();
      const updatedReservation: Reservation = {
        ...existing,
        status,
        updatedAt: now,
      };

      if (status === ReservationStatus.APPROVED && employeeId) {
        updatedReservation.approvedBy = employeeId;
        updatedReservation.approvedAt = now;
      }

      if (status === ReservationStatus.COMPLETED && employeeId) {
        updatedReservation.completedBy = employeeId;
        updatedReservation.completedAt = now;
      }

      if (status === ReservationStatus.CANCELLED) {
        updatedReservation.cancelledAt = now;
      }

      const document = {
        ...updatedReservation,
        type: 'reservation',
        // 转换Date为ISO字符串存储
        expectedArrivalTime: updatedReservation.expectedArrivalTime.toISOString(),
        createdAt: updatedReservation.createdAt.toISOString(),
        updatedAt: updatedReservation.updatedAt.toISOString(),
        approvedAt: updatedReservation.approvedAt?.toISOString(),
        cancelledAt: updatedReservation.cancelledAt?.toISOString(),
        completedAt: updatedReservation.completedAt?.toISOString(),
      };

      await this.collection.replace(id, document);
      
      logger.info(`Updated reservation status: ${id} -> ${status}`);
      return updatedReservation;
    } catch (error) {
      logger.error(`Error updating reservation status ${id}:`, error);
      throw new Error('Failed to update reservation status');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.collection.remove(id);
      logger.info(`Deleted reservation: ${id}`);
      return true;
    } catch (error: any) {
      if (error.code === 'DOCUMENT_NOT_FOUND') {
        return false;
      }
      logger.error(`Error deleting reservation ${id}:`, error);
      throw new Error('Failed to delete reservation');
    }
  }

  async findByEmail(email: string): Promise<Reservation[]> {
    try {
      const query = `
        SELECT META().id, *
        FROM \`hilton_reservations\`
        WHERE type = "reservation" AND guestEmail = $email
        ORDER BY createdAt DESC
      `;

      const result = await this.cluster.query(query, {
        parameters: { email },
      });

      return result.rows.map((row: any) => {
        // 处理Couchbase返回的嵌套结构 - 数据在 hilton_reservations 属性中
        const bucketData = row.hilton_reservations || row;
        const { type, ...reservationData } = bucketData;
        
        // 确保id字段正确设置（从META()获取的id）
        if (row.id && !reservationData.id) {
          reservationData.id = row.id;
        }
        
        const processed = {
          ...reservationData,
          expectedArrivalTime: new Date(reservationData.expectedArrivalTime),
          createdAt: new Date(reservationData.createdAt),
          updatedAt: new Date(reservationData.updatedAt),
          approvedAt: reservationData.approvedAt ? new Date(reservationData.approvedAt) : undefined,
          cancelledAt: reservationData.cancelledAt ? new Date(reservationData.cancelledAt) : undefined,
          completedAt: reservationData.completedAt ? new Date(reservationData.completedAt) : undefined,
        } as Reservation;
        
        return processed;
      });
    } catch (error) {
      logger.error(`Error finding reservations by email ${email}:`, error);
      throw new Error('Failed to find reservations by email');
    }
  }
} 