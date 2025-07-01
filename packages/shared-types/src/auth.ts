// 认证相关类型定义

import { UserRole } from './user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string; // Guest的name
  username?: string; // Employee的username
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
} 