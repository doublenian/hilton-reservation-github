import { GraphQLScalarType, Kind, ValueNode } from 'graphql';
import { ReservationService } from '../services/ReservationService';
import { EmployeeService } from '../services/EmployeeService';
import { logger } from '../utils/logger';
import { UserRole } from '@hilton-reservation/shared-types';

// DateTime标量类型解析器
const DateTimeType = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  },
  parseValue(value: any) {
    logger.info(`DateTime parseValue input: ${value} (type: ${typeof value})`);
    const date = new Date(value);
    logger.info(`DateTime parseValue output: ${date.toISOString()} (local: ${date.toString()})`);
    return date;
  },
  parseLiteral(ast: ValueNode) {
    if (ast.kind === Kind.STRING) {
      logger.info(`DateTime parseLiteral input: ${ast.value}`);
      const date = new Date(ast.value);
      logger.info(`DateTime parseLiteral output: ${date.toISOString()} (local: ${date.toString()})`);
      return date;
    }
    return null;
  },
});

// 获取服务实例的函数
function getReservationService() {
  return new ReservationService();
}

function getEmployeeService() {
  return new EmployeeService();
}

// 权限检查辅助函数
function requireAuth(context: any) {
  if (!context.user) {
    throw new Error('Authentication required');
  }
  return context.user;
}

function requireEmployee(context: any) {
  const user = requireAuth(context);
  if (user.role !== UserRole.EMPLOYEE) {
    throw new Error('Employee access required');
  }
  return user;
}

function requireGuest(context: any) {
  const user = requireAuth(context);
  if (user.role !== UserRole.GUEST) {
    throw new Error('Guest access required');
  }
  return user;
}

export const resolvers = {
  DateTime: DateTimeType,

  Query: {
    me: async (_: any, __: any, context: any) => {
      // 支持从token中获取用户信息
      if (context.user) {
        return context.user;
      }
      
      // 从请求头获取token
      const authHeader = context.request?.headers?.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Authentication required');
      }

      const token = authHeader.slice(7);
      const employeeService = getEmployeeService();
      const employee = await employeeService.verifyToken(token);
      
      if (!employee) {
        throw new Error('Invalid authentication token');
      }

      // 返回格式化的用户信息
      return {
        id: employee.id,
        email: employee.email,
        role: employee.role,
        name: employee.username,
        username: employee.username
      };
    },

    reservation: async (_: any, { id }: { id: string }, context: any) => {
      const user = requireAuth(context);
      const reservationService = getReservationService();
      
      const reservation = await reservationService.getReservation(id);
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      // 客人只能查看自己的预定
      if (user.role === UserRole.GUEST && reservation.guestEmail !== user.email) {
        throw new Error('Access denied');
      }

      return reservation;
    },

    reservations: async (
      _: any,
      { filter, pagination }: { filter?: any; pagination?: any },
      context: any
    ) => {
      // 只有员工可以查看所有预定
      requireEmployee(context);
      const reservationService = getReservationService();
      
      return await reservationService.getReservations(filter, pagination);
    },

    myReservations: async (_: any, __: any, context: any) => {
      const user = requireGuest(context);
      const reservationService = getReservationService();
      
      return await reservationService.getReservationsByEmail(user.email);
    },

    getReservationsByEmail: async (_: any, { email }: { email: string }) => {
      // 允许匿名访问，通过邮箱查询预订
      const reservationService = getReservationService();
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }
      
      return await reservationService.getReservationsByEmail(email);
    },

    reservationStats: async (_: any, __: any, context: any) => {
      // 只有员工可以查看统计信息
      requireEmployee(context);
      const reservationService = getReservationService();
      
      try {
        const stats = await reservationService.getReservationStats();
        return stats;
      } catch (error) {
        logger.error('Error getting reservation stats:', error);
        throw new Error('Failed to get reservation statistics');
      }
    },
  },

  Mutation: {
    createReservation: async (
      _: any,
      { input }: { input: any },
      context: any
    ) => {
      // 允许匿名客人创建预定，无需认证
      const reservationService = getReservationService();
      
      try {
        logger.info(`CreateReservation input:`, JSON.stringify(input, null, 2));
        logger.info(`Expected arrival time: ${input.expectedArrivalTime} (type: ${typeof input.expectedArrivalTime})`);
        
        if (input.expectedArrivalTime instanceof Date) {
          logger.info(`Date object details: ISO=${input.expectedArrivalTime.toISOString()}, Local=${input.expectedArrivalTime.toString()}, Hours=${input.expectedArrivalTime.getHours()}`);
        }
        
        const reservation = await reservationService.createReservation(input);
        
        // 这里可以添加实时订阅推送
        // pubsub.publish('RESERVATION_UPDATED', { reservationUpdated: reservation });
        
        return reservation;
      } catch (error) {
        logger.error('Error creating reservation:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create reservation');
      }
    },

    updateReservation: async (
      _: any,
      { id, input }: { id: string; input: any },
      context: any
    ) => {
      // 允许匿名更新，但需要验证预订存在
      const reservationService = getReservationService();
      
      // 验证预订是否存在
      const existing = await reservationService.getReservation(id);
      if (!existing) {
        throw new Error('Reservation not found');
      }

      // 检查预订状态是否可以修改
      if (existing.status === 'cancelled') {
        throw new Error('Cannot update cancelled reservation');
      }
      
      if (existing.status === 'completed') {
        throw new Error('Cannot update completed reservation');
      }

      try {
        const reservation = await reservationService.updateReservation(id, input);
        
        // 实时订阅推送
        // pubsub.publish('RESERVATION_UPDATED', { reservationUpdated: reservation });
        
        return reservation;
      } catch (error) {
        logger.error('Error updating reservation:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to update reservation');
      }
    },

    cancelReservation: async (
      _: any,
      { id }: { id: string },
      context: any
    ) => {
      // 允许匿名取消，但需要提供邮箱验证
      const reservationService = getReservationService();
      
      // 获取预订信息
      const existing = await reservationService.getReservation(id);
      if (!existing) {
        throw new Error('Reservation not found');
      }

      // 检查预订状态是否可以取消
      if (existing.status === 'cancelled') {
        throw new Error('Reservation is already cancelled');
      }
      
      if (existing.status === 'completed') {
        throw new Error('Cannot cancel completed reservation');
      }

      try {
        const reservation = await reservationService.cancelReservation(id);
        
        // 实时订阅推送
        // pubsub.publish('RESERVATION_UPDATED', { reservationUpdated: reservation });
        
        return reservation;
      } catch (error) {
        logger.error('Error cancelling reservation:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to cancel reservation');
      }
    },

    approveReservation: async (
      _: any,
      { id }: { id: string },
      context: any
    ) => {
      const user = requireEmployee(context);
      const reservationService = getReservationService();
      
      try {
        const reservation = await reservationService.approveReservation(id, user.id);
        
        // 实时订阅推送
        // pubsub.publish('RESERVATION_UPDATED', { reservationUpdated: reservation });
        
        return reservation;
      } catch (error) {
        logger.error('Error approving reservation:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to approve reservation');
      }
    },

    completeReservation: async (
      _: any,
      { id }: { id: string },
      context: any
    ) => {
      const user = requireEmployee(context);
      const reservationService = getReservationService();
      
      try {
        const reservation = await reservationService.completeReservation(id, user.id);
        
        // 实时订阅推送
        // pubsub.publish('RESERVATION_UPDATED', { reservationUpdated: reservation });
        
        return reservation;
      } catch (error) {
        logger.error('Error completing reservation:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to complete reservation');
      }
    },

    registerEmployee: async (
      _: any,
      { input }: { input: any },
      context: any
    ) => {
      // 只有员工可以注册新员工
      requireEmployee(context);
      const employeeService = getEmployeeService();
      
      try {
        const employee = await employeeService.register(input);
        
        // 返回员工信息（不包含密码）
        const { password: _, ...employeeWithoutPassword } = employee;
        
        logger.info(`New employee registered by ${context.user.username}: ${employee.username}`);
        
        return employeeWithoutPassword;
      } catch (error) {
        logger.error('Error registering employee:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to register employee');
      }
    },
  },

  Subscription: {
    reservationUpdated: {
      // subscribe: () => pubsub.asyncIterator(['RESERVATION_UPDATED']),
      subscribe: () => {
        throw new Error('Subscriptions not implemented yet');
      },
    },
  },
}; 