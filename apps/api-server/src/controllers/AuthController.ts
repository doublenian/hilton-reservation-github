import { Context } from 'koa';
import { EmployeeService } from '../services/EmployeeService';
import { LoginCredentials, CreateEmployeeInput } from '../types/employee';
import { logger } from '../utils/logger';

export class AuthController {
  private employeeService: EmployeeService;

  constructor() {
    this.employeeService = new EmployeeService();
  }

  async login(ctx: Context) {
    try {
      const credentials: LoginCredentials = ctx.request.body as LoginCredentials;
      
      // 验证输入
      if (!credentials.username || !credentials.password) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: '用户名和密码不能为空'
        };
        return;
      }

      // 执行登录
      const authResponse = await this.employeeService.login(credentials);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        ...authResponse
      };
      
      logger.info(`Login successful for user: ${credentials.username}`);
      
    } catch (error) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : '登录失败'
      };
      
      logger.warn('Login failed:', error);
    }
  }

  async register(ctx: Context) {
    try {
      const input: CreateEmployeeInput = ctx.request.body as CreateEmployeeInput;
      
      // 验证输入
      if (!input.username || !input.email || !input.password) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: '用户名、邮箱和密码不能为空'
        };
        return;
      }

      // 执行注册
      const employee = await this.employeeService.register(input);
      
      // 返回员工信息（不包含密码）
      const { password: _, ...employeeWithoutPassword } = employee;
      
      ctx.status = 201;
      ctx.body = {
        success: true,
        employee: employeeWithoutPassword
      };
      
      logger.info(`Registration successful for user: ${input.username}`);
      
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : '注册失败'
      };
      
      logger.warn('Registration failed:', error);
    }
  }

  async me(ctx: Context) {
    try {
      // 从请求头获取token
      const authHeader = ctx.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          error: '未提供认证令牌'
        };
        return;
      }

      const token = authHeader.slice(7); // 移除 "Bearer " 前缀
      const employee = await this.employeeService.verifyToken(token);
      
      if (!employee) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          error: '无效的认证令牌'
        };
        return;
      }

      // 返回员工信息（不包含密码）
      const { password: _, ...employeeWithoutPassword } = employee;
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        employee: employeeWithoutPassword
      };
      
    } catch (error) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        error: '认证失败'
      };
      
      logger.warn('Token verification failed:', error);
    }
  }
} 