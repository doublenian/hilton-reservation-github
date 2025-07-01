import { Employee, CreateEmployeeInput, UserRole } from '../types/employee';
import { logger } from '../utils/logger';

// 内存存储（演示用，实际应该使用数据库）
const employees: Map<string, Employee> = new Map();

// 初始化一些测试员工
function initializeEmployees() {
  const defaultEmployees: Employee[] = [
    {
      id: 'emp_1',
      username: 'admin',
      email: 'admin@hilton.com',
      password: 'admin123', // 实际应该使用bcrypt哈希
      role: UserRole.EMPLOYEE,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'emp_2',
      username: 'manager',
      email: 'manager@hilton.com',
      password: 'manager123',
      role: UserRole.EMPLOYEE,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  defaultEmployees.forEach(emp => {
    employees.set(emp.id, emp);
  });
}

// 初始化默认员工
initializeEmployees();

export class EmployeeRepository {
  
  async findById(id: string): Promise<Employee | null> {
    const employee = employees.get(id);
    return employee || null;
  }

  async findByUsername(username: string): Promise<Employee | null> {
    for (const employee of employees.values()) {
      if (employee.username === username) {
        return employee;
      }
    }
    return null;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    for (const employee of employees.values()) {
      if (employee.email === email) {
        return employee;
      }
    }
    return null;
  }

  async create(input: CreateEmployeeInput): Promise<Employee> {
    // 检查用户名是否已存在
    const existingByUsername = await this.findByUsername(input.username);
    if (existingByUsername) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingByEmail = await this.findByEmail(input.email);
    if (existingByEmail) {
      throw new Error('邮箱已存在');
    }

    const employee: Employee = {
      id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: input.username,
      email: input.email,
      password: input.password, // 实际应该使用bcrypt哈希
      role: input.role || UserRole.EMPLOYEE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    employees.set(employee.id, employee);
    logger.info(`Created new employee: ${employee.username}`);
    
    return employee;
  }

  async findAll(): Promise<Employee[]> {
    return Array.from(employees.values());
  }

  async delete(id: string): Promise<boolean> {
    const deleted = employees.delete(id);
    if (deleted) {
      logger.info(`Deleted employee with id: ${id}`);
    }
    return deleted;
  }

  async update(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const employee = employees.get(id);
    if (!employee) {
      return null;
    }

    const updatedEmployee = {
      ...employee,
      ...updates,
      id: employee.id, // 确保ID不被覆盖
      updatedAt: new Date(),
    };

    employees.set(id, updatedEmployee);
    logger.info(`Updated employee: ${updatedEmployee.username}`);
    
    return updatedEmployee;
  }
} 