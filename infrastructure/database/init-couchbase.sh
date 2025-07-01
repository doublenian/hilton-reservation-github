#!/bin/bash

# Couchbase初始化脚本
set -e

echo "Waiting for Couchbase to be ready..."
sleep 30

# 初始化集群
/opt/couchbase/bin/couchbase-cli cluster-init \
  --cluster localhost:8091 \
  --cluster-username Administrator \
  --cluster-password password \
  --cluster-ramsize 512 \
  --cluster-index-ramsize 256 \
  --services data,index,query

# 创建bucket
/opt/couchbase/bin/couchbase-cli bucket-create \
  --cluster localhost:8091 \
  --username Administrator \
  --password password \
  --bucket hilton_reservations \
  --bucket-type couchbase \
  --bucket-ramsize 256

echo "Couchbase initialization completed!" 