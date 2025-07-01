import winston from 'winston';
import { CONFIG } from './config';

// 创建Winston日志实例
export const logger = winston.createLogger({
  level: CONFIG.LOG.LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hilton-reservation-api' },
  transports: [
    // 文件日志
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

// 在开发环境添加控制台输出
if (CONFIG.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 请求日志中间件
export function requestLogger() {
  return async (ctx: any, next: any) => {
    const start = Date.now();
    
    logger.info('Request started', {
      method: ctx.method,
      url: ctx.url,
      userAgent: ctx.headers['user-agent'],
      ip: ctx.ip,
    });
    
    try {
      await next();
      
      const ms = Date.now() - start;
      logger.info('Request completed', {
        method: ctx.method,
        url: ctx.url,
        status: ctx.status,
        duration: `${ms}ms`,
      });
    } catch (error) {
      const ms = Date.now() - start;
      logger.error('Request failed', {
        method: ctx.method,
        url: ctx.url,
        error: error instanceof Error ? error.message : String(error),
        duration: `${ms}ms`,
      });
      throw error;
    }
  };
} 