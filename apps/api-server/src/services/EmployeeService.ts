import jwt from 'jsonwebtoken';
import { Employee, CreateEmployeeInput, LoginCredentials, AuthResponse, UserRole } from '../types/employee';
import { EmployeeRepository } from '../repositories/EmployeeRepository';
import { logger } from '../utils/logger';
import { CONFIG } from '../utils/config';

export class EmployeeService {
  private employeeRepository: EmployeeRepository;

  constructor() {
    this.employeeRepository = new EmployeeRepository();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { username, password } = credentials;
    
    // 查找员工
    const employee = await this.employeeRepository.findByUsername(username);
    if (!employee) {
      throw new Error('用户名或密码错误');
    }

    // 验证密码（简化版本，实际应该使用bcrypt比较哈希）
    if (employee.password !== password) {
      throw new Error('用户名或密码错误');
    }

    // 生成JWT token
    const token = jwt.sign(
      { 
        id: employee.id, 
        username: employee.username, 
        role: employee.role 
      },
      CONFIG.JWT.SECRET,
      { expiresIn: '7d' }
    );

    // 返回响应（不包含密码）
    const { password: _, ...employeeWithoutPassword } = employee;
    
    logger.info(`Employee logged in: ${employee.username}`);
    
    return {
      employee: employeeWithoutPassword,
      token
    };
  }

  async register(input: CreateEmployeeInput): Promise<Employee> {
    // 验证输入
    if (!input.username || input.username.length < 3) {
      throw new Error('用户名至少需要3个字符');
    }
    
    if (!input.email || !input.email.includes('@')) {
      throw new Error('请提供有效的邮箱地址');
    }
    
    if (!input.password || input.password.length < 6) {
      throw new Error('密码至少需要6个字符');
    }

    // 创建员工
    const employee = await this.employeeRepository.create(input);
    
    logger.info(`New employee registered: ${employee.username}`);
    
    return employee;
  }

  async findById(id: string): Promise<Employee | null> {
    return await this.employeeRepository.findById(id);
  }

  async findByUsername(username: string): Promise<Employee | null> {
    return await this.employeeRepository.findByUsername(username);
  }

  async findAll(): Promise<Employee[]> {
    return await this.employeeRepository.findAll();
  }

  async verifyToken(token: string): Promise<Employee | null> {
    try {
      const decoded = jwt.verify(token, CONFIG.JWT.SECRET) as any;
      const employee = await this.employeeRepository.findById(decoded.id);
      return employee;
    } catch (error) {
      logger.warn('Invalid token:', error);
      return null;
    }
  }
} 