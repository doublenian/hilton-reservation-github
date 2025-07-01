import { config } from 'dotenv';

// 加载环境变量
config();

export const CONFIG = {
  // 服务器配置
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // 数据库配置
  COUCHBASE: {
    CONNECTION_STRING: process.env.COUCHBASE_CONNECTION_STRING || 'couchbase://localhost',
    USERNAME: process.env.COUCHBASE_USERNAME || 'Administrator',
    PASSWORD: process.env.COUCHBASE_PASSWORD || 'password',
    BUCKET_NAME: process.env.COUCHBASE_BUCKET_NAME || 'hilton_reservations',
  },
  
  // JWT配置
  JWT: {
    SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // CORS配置
  CORS: {
    ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001',
    CREDENTIALS: true,
  },
  
  // 日志配置
  LOG: {
    LEVEL: process.env.LOG_LEVEL || 'info',
  },
} as const;

// 验证必要的环境变量
export function validateConfig() {
  const missing: string[] = [];
  
  if (CONFIG.NODE_ENV === 'production') {
    // 在生产环境中，检查是否有自定义的 JWT_SECRET（不是默认值）
    if (CONFIG.JWT.SECRET === 'your-super-secret-jwt-key-change-in-production') {
      console.warn('警告: 使用默认的 JWT_SECRET，请在生产环境中更改！');
    }
    
    // 验证生产环境必需的环境变量
    const requiredVars = [
      'COUCHBASE_CONNECTION_STRING',
      'COUCHBASE_USERNAME', 
      'COUCHBASE_PASSWORD'
    ];
    
    const prodMissing = requiredVars.filter(varName => !process.env[varName]);
    missing.push(...prodMissing);
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
} 