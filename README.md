# 希尔顿餐桌预定系统 (Hilton Table Reservation System)

一个现代化的餐桌预定系统，支持客人在线预定和餐厅员工管理预定。
```
员工端的测试账号是: 
* 用户名：admin
* 密码：hilton123456
```

## 🏗️ 系统架构

- **前端**: React + Next.js + TypeScript + TailwindCSS + Shadcn UI
- **后端**: Node.js + Koa.js + Apollo GraphQL + TypeScript
- **数据库**: Couchbase NoSQL
- **认证**: JWT Token
- **部署**: Docker + Docker Compose
- **架构**: Mono-Repo (pnpm Workspaces)

## 📋 功能特性

### 客人端功能
- ✅ 在线预定餐桌
- ✅ 查看预定状态
- ✅ 更新预定信息
- ✅ 取消预定

### 员工端功能
- ✅ 查看所有预定
- ✅ 按条件筛选预定
- ✅ 批准/拒绝预定
- ✅ 完成预定
- ✅ 联系客人

### 系统特性
- 🔐 JWT认证和授权
- 📱 响应式设计
- 🚀 GraphQL API
- 🐳 Docker容器化
- 📊 实时状态更新
- 🔍 高级搜索和筛选
- 📝 完整的日志记录

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd hilton-reservation

# 安装所有依赖 (使用 pnpm workspace)
pnpm install
```

### 开发环境

```bash
# 启动所有开发服务器 (推荐)
pnpm dev

# 或者分别启动各个服务
pnpm --filter api-server dev          # 启动 API 服务
pnpm --filter guest-web dev           # 启动客人端应用  
pnpm --filter employee-web dev        # 启动员工端应用
```

### pnpm Workspace 管理

```bash
# 查看所有 workspace 包
pnpm list --recursive

# 为特定应用添加依赖
pnpm --filter guest-web add axios
pnpm --filter api-server add express

# 为所有应用添加依赖
pnpm add -w typescript

# 在所有包中运行脚本
pnpm --recursive lint
pnpm --recursive test

# 清理所有 node_modules
pnpm clean

# 检查过期依赖
pnpm workspace:outdated
```

### Docker部署

```bash
# 构建并启动所有服务
pnpm docker:up

# 查看日志
pnpm docker:logs

# 停止服务
pnpm docker:down
```

## 📁 项目结构

```
hilton-reservation/
├── apps/                    # 应用层
│   ├── guest-web/          # 客人端SPA (Next.js)
│   ├── employee-web/       # 员工端SPA (Next.js)
│   └── api-server/         # 后端API服务 (Node.js + GraphQL)
├── packages/               # 共享包
│   ├── shared-types/       # 共享TypeScript类型
│   ├── ui-components/      # 共享UI组件
│   └── utils/              # 共享工具函数
├── infrastructure/         # 基础设施配置
│   ├── docker/            # Docker配置
│   ├── nginx/             # Nginx配置
│   └── database/          # 数据库脚本
├── docs/                  # 文档
├── tests/                 # E2E测试
├── pnpm-workspace.yaml    # pnpm工作区配置
├── docker-compose.yml     # 容器编排
└── README.md
```

## 🌐 服务端口

- **客人端Web**: http://localhost:3000
- **员工端Web**: http://localhost:3001
- **API服务器**: http://localhost:4000
- **GraphQL Playground**: http://localhost:4000/graphql
- **Couchbase管理**: http://localhost:8091
- **Nginx代理**: http://localhost:80

## 🔧 环境变量

### API服务器 (.env)

```env
# 服务器配置
PORT=4000
NODE_ENV=development

# 数据库配置
COUCHBASE_CONNECTION_STRING=couchbase://localhost
COUCHBASE_USERNAME=Administrator
COUCHBASE_PASSWORD=password
COUCHBASE_BUCKET_NAME=hilton_reservations

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# 日志配置
LOG_LEVEL=info
```

### 前端应用

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
NEXT_PUBLIC_APP_NAME=Hilton Guest Portal
```

## 📊 API文档

### GraphQL Schema

系统提供完整的GraphQL API，包括：

#### 查询 (Queries)
- `me` - 获取当前用户信息
- `reservation(id)` - 获取单个预定
- `reservations(filter, pagination)` - 获取预定列表
- `myReservations` - 获取当前用户的预定

#### 变更 (Mutations)
- `createReservation(input)` - 创建预定
- `updateReservation(id, input)` - 更新预定
- `cancelReservation(id)` - 取消预定
- `approveReservation(id)` - 批准预定（员工）
- `completeReservation(id)` - 完成预定（员工）

#### 订阅 (Subscriptions)
- `reservationUpdated` - 预定状态实时更新

### RESTful认证API

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh` - 刷新token
- `GET /api/auth/me` - 获取当前用户

## 🧪 测试

```bash
# 运行单元测试
pnpm test

# 运行E2E测试
pnpm test:e2e

# 运行测试覆盖率
pnpm test:coverage
```

## 🔨 开发脚本

```bash
# 开发
pnpm dev                 # 启动所有开发服务器
pnpm build               # 构建所有应用
pnpm type-check          # TypeScript类型检查
pnpm lint                # 代码检查
pnpm clean               # 清理构建文件

# Docker
pnpm docker:build        # 构建Docker镜像
pnpm docker:up           # 启动容器
pnpm docker:down         # 停止容器
pnpm docker:logs         # 查看容器日志
```

## 🚀 部署

### 生产环境部署

1. **配置环境变量**
   ```bash
   cp env.example .env
   # 编辑 .env 文件，设置生产环境配置
   ```

2. **构建和部署**
   ```bash
   pnpm docker:build
   pnpm docker:up
   ```

3. **健康检查**
   ```bash
   curl http://localhost:4000/health
   ```

### CI/CD管道

项目支持以下CI/CD流程：

1. 代码提交触发
2. 运行单元测试和集成测试
3. 构建Docker镜像
4. 运行E2E测试
5. 部署到生产环境
6. 健康检查验证

## 📈 监控和日志

- **应用监控**: 健康检查端点 `/health`
- **错误跟踪**: 结构化错误日志
- **性能监控**: 请求响应时间跟踪
- **业务监控**: 预定转化率、成功率

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 团队

- **开发团队**: Hilton Development Team
- **架构师**: [Your Name]
- **前端开发**: [Frontend Developer]
- **后端开发**: [Backend Developer]
- **DevOps**: [DevOps Engineer]

## 📞 支持

如有问题或建议，请：

1. 查看 [文档](./docs/)
2. 提交 [Issue](../../issues)
3. 联系开发团队

---

**希尔顿餐桌预定系统** - 让用餐预定变得简单高效 🍽️ 