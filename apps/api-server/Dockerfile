# 多阶段构建 Dockerfile for API Server with pnpm workspace

# 第一阶段：构建阶段
FROM node:18-alpine AS builder


# 切换npm源到淘宝镜像
RUN npm config set registry https://registry.npmmirror.com
# 安装 pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制 workspace 配置
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmrc ./

# 复制应用源代码
COPY apps/api-server ./apps/api-server
COPY packages ./packages

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建共享类型包
RUN pnpm --filter shared-types build

# 构建API服务器
RUN pnpm --filter api-server build

# 第二阶段：生产阶段
FROM node:18-alpine AS production

# 安装 pnpm
RUN npm install -g pnpm

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 复制 workspace 配置
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmrc ./

# 复制应用配置
COPY apps/api-server/package.json ./apps/api-server/
COPY packages/shared-types/package.json ./packages/shared-types/

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 复制构建产物
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/api-server/dist ./apps/api-server/dist

# 创建日志目录并设置整个工作目录的权限
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 4000

# 启动命令
CMD ["node", "apps/api-server/dist/app.js"] 