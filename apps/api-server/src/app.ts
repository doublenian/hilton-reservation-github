import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from 'koa-cors';
import helmet from 'koa-helmet';
import { ApolloServer } from 'apollo-server-koa';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { connectDatabase, disconnectDatabase } from './utils/database';
import { CONFIG, validateConfig } from './utils/config';
import { logger, requestLogger } from './utils/logger';
import { authRoutes } from './routes/auth';
import { EmployeeService } from './services/EmployeeService';

async function createApp(): Promise<Koa> {
  // 验证配置
  validateConfig();
  
  // 连接数据库
  await connectDatabase();
  
  // 创建Koa应用
  const app = new Koa();
  
  // 基础中间件
  app.use(helmet());
  app.use(cors({
    origin: '*', // 开发环境允许所有源，生产环境应该配置具体域名
    credentials: CONFIG.CORS.CREDENTIALS,
  }));
  app.use(bodyParser());
  app.use(requestLogger());
  
  // 错误处理中间件
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      logger.error('Unhandled error:', error);
      ctx.status = error instanceof Error && 'status' in error ? (error as any).status : 500;
      ctx.body = {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
    }
  });
  
  // 健康检查端点
  app.use(async (ctx, next) => {
    if (ctx.path === '/health') {
      ctx.body = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      };
      return;
    }
    await next();
  });

  // 添加认证路由
  app.use(authRoutes.routes());
  app.use(authRoutes.allowedMethods());
  
  // 创建Apollo GraphQL服务器
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ ctx }) => {
      // 从请求头获取Authorization token
      const authHeader = ctx.request.headers.authorization;
      let user = null;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.slice(7); // 移除 "Bearer " 前缀
          const employeeService = new EmployeeService();
          const employee = await employeeService.verifyToken(token);
          
          if (employee) {
            // 格式化用户信息以匹配GraphQL User类型
            user = {
              id: employee.id,
              email: employee.email,
              role: employee.role,
              name: employee.username,
              username: employee.username
            };
            logger.debug(`GraphQL authenticated user: ${user.username}`);
          }
        } catch (error) {
          logger.warn('Invalid token in GraphQL request:', error);
        }
      }
      
      return {
        user,
        request: ctx.request,
      };
    },
    introspection: CONFIG.NODE_ENV !== 'production',
  });
  
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });
  
  logger.info(`GraphQL server ready at /graphql`);
  
  return app;
}

async function startServer() {
  try {
    const app = await createApp();
    
    const server = app.listen(CONFIG.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${CONFIG.PORT}`);
      logger.info(`📊 GraphQL Playground available at http://localhost:${CONFIG.PORT}/graphql`);
      logger.info(`🏥 Health check available at http://localhost:${CONFIG.PORT}/health`);
    });
    
    // 优雅关闭
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await disconnectDatabase();
          logger.info('Database disconnected');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 启动服务器
if (require.main === module) {
  startServer();
}

export { createApp };