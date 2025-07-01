import React, { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import Cookies from 'js-cookie';
import axios from 'axios';
import { Employee, LoginCredentials, AuthResponse, UserRole } from '../types';
import { GET_CURRENT_EMPLOYEE } from '../lib/graphql-queries';

interface AuthContextType {
  employee: Employee | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 配置axios默认设置
const authAPI = axios.create({
  baseURL: `${window.location.protocol}//${window.location.hostname}:4000/api/auth`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // 检查初始认证状态
  const hasToken = !!Cookies.get('auth-token');

  // 使用GraphQL查询获取当前用户信息
  const { data, loading: queryLoading, error } = useQuery(GET_CURRENT_EMPLOYEE, {
    skip: !hasToken, // 没有token时跳过查询
    onCompleted: (data) => {
      if (data?.me) {
        setEmployee(data.me);
        setIsAuthenticated(true);
      }
    },
    onError: (error) => {
      console.error('获取用户信息失败:', error);
      // Token可能已过期，清除认证状态
      Cookies.remove('auth-token');
      setEmployee(null);
      setIsAuthenticated(false);
    }
  });

  // RESTful API登录
  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true);
    try {
      const response = await authAPI.post<AuthResponse>('/login', credentials);
      
      if (response.data && response.data.token) {
        const { employee: emp, token } = response.data;
        
        // 保存token到cookie
        Cookies.set('auth-token', token, { 
          expires: 7, // 7天过期
          secure: false, // 开发环境设为false
          sameSite: 'strict'
        });
        
        // 更新状态
        setEmployee(emp);
        setIsAuthenticated(true);
        setAuthLoading(false);
        
        return { success: true };
      } else {
        setAuthLoading(false);
        return { success: false, error: '登录响应格式错误' };
      }
    } catch (error: any) {
      setAuthLoading(false);
      
      if (error.response?.status === 401) {
        return { success: false, error: '用户名或密码错误' };
      } else if (error.response?.status === 404) {
        return { success: false, error: '认证服务不可用，请稍后重试' };
      } else if (error.code === 'ECONNREFUSED') {
        return { success: false, error: '无法连接到服务器，请检查网络连接' };
      } else {
        return { success: false, error: error.response?.data?.message || '登录失败，请重试' };
      }
    }
  };

  const logout = () => {
    // 清除token
    Cookies.remove('auth-token');
    
    // 重置状态
    setEmployee(null);
    setIsAuthenticated(false);
    
    // 清除Apollo Client缓存
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  // 监听token变化
  useEffect(() => {
    const token = Cookies.get('auth-token');
    if (!token && isAuthenticated) {
      // Token被清除但状态仍为已认证，重置状态
      setEmployee(null);
      setIsAuthenticated(false);
    }
  }, [isAuthenticated]);

  const value: AuthContextType = {
    employee,
    loading: authLoading || queryLoading,
    login,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 