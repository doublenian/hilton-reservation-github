# 预订时间验证问题修复

## 🐛 问题描述

客人端创建预订时报错：`Reservations are only accepted between 9:00 AM and 10:00 PM`

## 🔍 根因分析

### 原始问题
- **客人端** 发送 UTC 时间格式（如：`2024-01-15T18:00:00.000Z`）
- **服务器端** 直接使用 `Date.getHours()` 获取时间，但该方法返回的是系统本地时间
- **时区差异** 导致了8小时的偏移（中国是 UTC+8）
- **营业时间验证** 基于错误的时间进行判断

### 具体示例
```
客人选择：中国时间 18:00（晚上6点）
客人端发送：2024-01-15T10:00:00.000Z (UTC)
服务器接收后转换：2024-01-15 18:00 (中国本地时间)
但验证时使用了错误的逻辑，导致时间判断错误
```

## ✅ 解决方案

### 1. 创建营业时间配置模块
- 📁 `apps/api-server/src/config/business-hours.ts`
- 🕒 支持灵活的营业时间配置：8:30 - 22:30
- 🌍 支持时区配置：`Asia/Shanghai`
- ⚙️ 支持环境变量配置

### 2. 改进时间验证逻辑
```typescript
// 时区感知的验证方法
const localDateTime = new Date(dateTime.toLocaleString("en-US", {
  timeZone: businessHours.timezone || 'Asia/Shanghai'
}));
```

### 3. 增强日志记录
- 📝 记录 UTC 时间和业务时区本地时间
- 🐛 便于调试时区转换问题
- 📊 记录验证过程的详细信息

### 4. 环境变量配置
```env
# 营业时间配置
BUSINESS_OPEN_HOUR=8
BUSINESS_OPEN_MINUTE=30
BUSINESS_CLOSE_HOUR=22
BUSINESS_CLOSE_MINUTE=30
BUSINESS_TIMEZONE=Asia/Shanghai
```

## 🧪 测试验证

### 测试用例
- ✅ 中国中午12点 (UTC 04:00) → 营业时间内
- ✅ 中国晚上7点 (UTC 11:00) → 营业时间内  
- ✅ 中国早上8:30 (UTC 00:30) → 刚好开门时间
- ✅ 中国晚上10:30 (UTC 14:30) → 刚好关门时间
- ✅ 中国早上7点 (UTC 23:00) → 营业时间外
- ✅ 中国晚上11点 (UTC 15:00) → 营业时间外

### 测试脚本
```bash
# 运行时区修复测试
node test-timezone-fix.js
```

## 📋 修改文件清单

1. **新增文件**:
   - `apps/api-server/src/config/business-hours.ts` - 营业时间配置
   - `test-timezone-fix.js` - 时区修复测试脚本
   - `docs/reservation-time-fix.md` - 本文档

2. **修改文件**:
   - `apps/api-server/src/services/ReservationService.ts` - 时间验证逻辑
   - `apps/api-server/src/graphql/resolvers.ts` - DateTime 解析器日志
   - `env.example` - 营业时间环境变量

## 🚀 部署说明

1. **更新环境变量**：
   ```bash
   # 复制并修改环境变量
   cp env.example .env
   ```

2. **重启 API 服务器**：
   ```bash
   # Docker 环境
   docker-compose restart api-server
   
   # 开发环境
   cd apps/api-server && npm run dev
   ```

3. **验证修复**：
   - 尝试在不同时间段创建预订
   - 查看服务器日志确认时区处理正确
   - 使用测试脚本验证时间逻辑

## 🔧 维护说明

### 调整营业时间
通过环境变量轻松调整：
```env
BUSINESS_OPEN_HOUR=9      # 早上9点开门
BUSINESS_OPEN_MINUTE=0    # 0分
BUSINESS_CLOSE_HOUR=21    # 晚上9点关门  
BUSINESS_CLOSE_MINUTE=0   # 0分
```

### 更改时区
```env
BUSINESS_TIMEZONE=America/New_York  # 纽约时区
BUSINESS_TIMEZONE=Europe/London     # 伦敦时区
BUSINESS_TIMEZONE=Asia/Tokyo        # 东京时区
```

## 🎯 关键改进

1. **时区感知** - 正确处理 UTC 时间到业务时区的转换
2. **配置灵活** - 支持环境变量配置营业时间
3. **日志完善** - 便于调试和监控
4. **测试完备** - 完整的测试用例覆盖
5. **文档清晰** - 详细的问题分析和解决方案

现在客人端可以正常创建预订，服务器会正确验证基于中国时区的营业时间！🎉 