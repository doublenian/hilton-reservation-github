#!/bin/bash

# Hilton 预订系统自动启动脚本
set -e

echo "🏨 启动 Hilton 预订系统..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker Desktop"
    exit 1
fi

# 停止之前的容器（如果存在）
echo "🧹 清理之前的容器..."
docker-compose down --remove-orphans || true

# 构建服务
echo "🔨 构建服务..."
docker-compose build

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务就绪
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 等待 Couchbase 初始化完成
echo "⏳ 等待 Couchbase 初始化完成..."
while [ "$(docker-compose ps -q couchbase-init)" ]; do
    echo "   正在初始化 Couchbase..."
    sleep 5
done

# 检查初始化结果
if docker logs hilton-couchbase-init | grep -q "🎉 Couchbase 自动化初始化完成！"; then
    echo "✅ Couchbase 初始化成功！"
else
    echo "❌ Couchbase 初始化可能失败，请检查日志："
    echo "   docker logs hilton-couchbase-init"
fi

echo ""
echo "🎉 系统启动完成！"
echo ""
echo "📍 访问地址："
echo "   客人端：   http://localhost:3000"
echo "   员工端：   http://localhost:3001"
echo "   API：      http://localhost:4000/graphql"
echo "   Couchbase：http://localhost:8091"
echo ""
echo "🔧 有用的命令："
echo "   查看日志： docker-compose logs -f [service-name]"
echo "   停止服务： docker-compose down"
echo "   重启服务： docker-compose restart [service-name]"
echo ""
