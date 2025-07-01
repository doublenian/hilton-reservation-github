import Router from 'koa-router';
import { AuthController } from '../controllers/AuthController';

const router = new Router({ prefix: '/api/auth' });
const authController = new AuthController();

// 登录路由
router.post('/login', async (ctx) => {
  await authController.login(ctx);
});

// 注册路由
router.post('/register', async (ctx) => {
  await authController.register(ctx);
});

// 获取当前用户信息
router.get('/me', async (ctx) => {
  await authController.me(ctx);
});

export { router as authRoutes }; 