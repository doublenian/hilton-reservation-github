#!/bin/bash

# 改进的 Couchbase 初始化脚本
set -e

COUCHBASE_HOST="${COUCHBASE_HOST:-couchbase:8091}"
COUCHBASE_USERNAME="${COUCHBASE_USERNAME:-Administrator}"
COUCHBASE_PASSWORD="${COUCHBASE_PASSWORD:-password}"
BUCKET_NAME="${BUCKET_NAME:-hilton_reservations}"

echo "🚀 开始 Couchbase 自动化初始化..."

# 等待 Couchbase 服务完全启动
wait_for_couchbase() {
  local max_attempts=60
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "⏳ 尝试连接 Couchbase (${attempt}/${max_attempts})..."
    
    if curl -s -I "http://${COUCHBASE_HOST}" | grep -q "Couchbase Server"; then
      echo "✅ Couchbase 服务已就绪"
      return 0
    fi
    
    echo "⏱️  等待 Couchbase 启动..."
    sleep 2
    attempt=$((attempt + 1))
  done
  
  echo "❌ Couchbase 服务启动超时"
  exit 1
}

# 检查集群是否已初始化
check_cluster_initialized() {
  local response=$(curl -s -w "%{http_code}" -u "${COUCHBASE_USERNAME}:${COUCHBASE_PASSWORD}" \
    "http://${COUCHBASE_HOST}/pools/default" 2>/dev/null || echo "000")
  
  local http_code="${response: -3}"
  
  if [ "$http_code" = "200" ]; then
    return 0  # 已初始化
  else
    return 1  # 未初始化
  fi
}

# 检查 bucket 是否存在
check_bucket_exists() {
  local response=$(curl -s -w "%{http_code}" -u "${COUCHBASE_USERNAME}:${COUCHBASE_PASSWORD}" \
    "http://${COUCHBASE_HOST}/pools/default/buckets/${BUCKET_NAME}" 2>/dev/null || echo "000")
  
  local http_code="${response: -3}"
  
  if [ "$http_code" = "200" ]; then
    return 0  # bucket 存在
  else
    return 1  # bucket 不存在
  fi
}

# 主要流程
main() {
  # 等待 Couchbase 就绪
  wait_for_couchbase
  
  # 检查并初始化集群
  if check_cluster_initialized; then
    echo "✅ Couchbase 集群已经初始化"
  else
    echo "🔧 正在初始化 Couchbase 集群..."
    if /opt/couchbase/bin/couchbase-cli cluster-init \
      --cluster "${COUCHBASE_HOST}" \
      --cluster-username "${COUCHBASE_USERNAME}" \
      --cluster-password "${COUCHBASE_PASSWORD}" \
      --cluster-ramsize 512 \
      --cluster-index-ramsize 256 \
      --services data,index,query; then
      echo "✅ 集群初始化成功"
    else
      echo "❌ 集群初始化失败"
      exit 1
    fi
  fi

  # 等待集群完全就绪
  echo "⏳ 等待集群完全就绪..."
  sleep 15

  # 检查并创建 bucket
  if check_bucket_exists; then
    echo "✅ Bucket  已存在"
  else
    echo "🔧 正在创建 bucket ..."
    if /opt/couchbase/bin/couchbase-cli bucket-create \
      --cluster "${COUCHBASE_HOST}" \
      --username "${COUCHBASE_USERNAME}" \
      --password "${COUCHBASE_PASSWORD}" \
      --bucket "${BUCKET_NAME}" \
      --bucket-type couchbase \
      --bucket-ramsize 256 \
      --bucket-replica 0; then
      echo "✅ Bucket 创建成功"
    else
      echo "❌ Bucket 创建失败"
      exit 1
    fi
  fi

  # 等待 bucket 完全就绪
  echo "⏳ 等待 bucket 完全就绪..."
  sleep 10

  echo "🎉 Couchbase 自动化初始化完成！"
}

# 执行主要流程
main
