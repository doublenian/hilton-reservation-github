# 希尔顿餐厅预订系统 - 员工端

这是希尔顿餐厅预订管理系统的员工端Web应用，为餐厅员工提供预订管理功能。

## 功能特性

- 🔐 **员工认证** - 安全的登录和权限管理
- 📊 **仪表板** - 预订统计和概览
- 📅 **预订管理** - 查看、审批、管理所有预订
- 📱 **响应式设计** - 适配桌面端和平板设备
- 🎨 **现代UI** - 基于Ant Design的美观界面

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI组件库**: Ant Design 5
- **路由**: React Router 6
- **状态管理**: React Context + Apollo Client
- **构建工具**: Vite
- **数据通信**: GraphQL + Apollo Client

## 开发环境

### 环境要求

- Node.js >= 18.0.0
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将运行在 http://localhost:3001

### 构建生产版本

```bash
npm run build
```

### 类型检查

```bash
npm run type-check
```

### 代码检查

```bash
npm run lint
```

## 项目结构

```
src/
├── components/          # 通用组件
│   └── Layout.tsx      # 主布局组件
├── pages/              # 页面组件
│   ├── LoginPage.tsx   # 登录页面
│   └── DashboardPage.tsx # 仪表板页面
├── hooks/              # 自定义Hooks
│   └── useAuth.ts      # 认证相关Hook
├── lib/                # 工具库
│   ├── apollo-client.ts # Apollo Client配置
│   └── graphql-queries.ts # GraphQL查询定义
├── types/              # TypeScript类型定义
│   └── index.ts        # 类型定义
├── styles/             # 样式文件
│   └── global.css      # 全局样式
├── App.tsx             # 主应用组件
└── main.tsx            # 应用入口
```

## 功能模块

### 1. 认证系统
- 员工登录/退出
- 基于JWT的会话管理
- 路由权限保护

### 2. 仪表板
- 预订统计概览
- 待处理预订提醒
- 最近预订列表

### 3. 预订管理（规划中）
- 预订列表查看
- 预订状态管理（审批/拒绝/完成）
- 预订详情编辑
- 客人信息管理

## 开发说明

### 测试账号

开发环境可使用以下测试账号：
- 用户名: `admin`
- 密码: `password123`

### API端点

- GraphQL API: http://localhost:4000/graphql
- 健康检查: http://localhost:4000/health

### 环境变量

创建 `.env.local` 文件配置环境变量：

```env
VITE_API_URL=http://localhost:4000
```

## 待实现功能

- [ ] 预订管理页面
- [ ] 客人信息管理
- [ ] 预订统计报表
- [ ] 实时通知
- [ ] 多语言支持
- [ ] 移动端适配优化

## 注意事项

1. 确保后端API服务器已启动（端口4000）
2. 开发过程中请保持TypeScript类型检查
3. 遵循Ant Design设计规范
4. 注意响应式布局的兼容性

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 