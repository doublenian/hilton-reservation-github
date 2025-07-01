# 多阶段构建 Dockerfile for Vite React SPA

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
COPY apps/guest-web ./apps/guest-web
COPY packages ./packages

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建应用
WORKDIR /app/apps/guest-web
RUN pnpm build

# 第二阶段：生产阶段
FROM nginx:alpine

# 复制自定义 nginx 配置
COPY apps/guest-web/nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物到 nginx 静态文件目录
COPY --from=builder /app/apps/guest-web/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"] 