import * as couchbase from 'couchbase';
import { CONFIG } from './config';
import { logger } from './logger';

let cluster: couchbase.Cluster;
let bucket: couchbase.Bucket;
let collection: couchbase.Collection;
let isUsingMemoryStore = false;

// 简单的内存存储（仅用于开发）
class MemoryStore {
  private data: Map<string, any> = new Map();

  async insert(id: string, document: any) {
    this.data.set(id, document);
    return { success: true };
  }

  async get(id: string) {
    const content = this.data.get(id);
    if (!content) {
      throw { code: 'DOCUMENT_NOT_FOUND' };
    }
    return { content };
  }

  async replace(id: string, document: any) {
    if (!this.data.has(id)) {
      throw { code: 'DOCUMENT_NOT_FOUND' };
    }
    this.data.set(id, document);
    return { success: true };
  }

  async remove(id: string) {
    if (!this.data.has(id)) {
      throw { code: 'DOCUMENT_NOT_FOUND' };
    }
    this.data.delete(id);
    return { success: true };
  }

  // 获取所有数据用于查询
  getAllData() {
    return Array.from(this.data.entries()).map(([id, doc]) => ({
      id,
      ...doc
    }));
  }
}

class MemoryCluster {
  private store: MemoryStore;

  constructor(store: MemoryStore) {
    this.store = store;
  }

  async query(queryString: string, options?: any) {
    // 简化的查询处理，支持基本的预订查询
    logger.debug(`Memory store query: ${queryString}`);
    
    const allData = this.store.getAllData();
    
    // 处理预订相关查询
    if (queryString.includes('type = "reservation"')) {
      const reservations = allData.filter(item => item.type === 'reservation');
      
      // 处理按邮箱查询
      if (queryString.includes('guestEmail =') && options?.parameters?.email) {
        const filtered = reservations.filter(item => item.guestEmail === options.parameters.email);
        return { rows: filtered };
      }
      
      // 处理分页查询
      if (queryString.includes('LIMIT') && queryString.includes('OFFSET')) {
        return { rows: reservations };
      }
      
      // 处理计数查询
      if (queryString.includes('COUNT(*)')) {
        return { rows: [{ total: reservations.length }] };
      }
      
      return { rows: reservations };
    }
    
    return { rows: [] };
  }

  async ping() {
    return { success: true };
  }

  async close() {
    return;
  }
}

let memoryStore: MemoryStore;
let memoryCluster: MemoryCluster;

export async function connectDatabase(): Promise<void> {
  const maxRetries = 10;
  const retryDelay = 5000; // 5秒
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Attempting to connect to Couchbase (attempt ${attempt}/${maxRetries})...`);
      
      // 尝试连接到Couchbase集群
      cluster = await couchbase.connect(CONFIG.COUCHBASE.CONNECTION_STRING, {
        username: CONFIG.COUCHBASE.USERNAME,
        password: CONFIG.COUCHBASE.PASSWORD,
        timeouts: {
          connectTimeout: 30000, // 30秒连接超时
          kvTimeout: 10000,      // 10秒操作超时
        }
      });

      // 获取bucket
      bucket = cluster.bucket(CONFIG.COUCHBASE.BUCKET_NAME);
      
      // 获取默认collection
      collection = bucket.defaultCollection();

      // 简单ping测试连接
      try {
        await cluster.ping();
        logger.info('Connected to Couchbase successfully');
        isUsingMemoryStore = false;
        
        // 创建索引（如果不存在）
        await createIndexes();
        return; // 连接成功，退出重试循环
        
      } catch (pingError) {
        logger.warn('Couchbase ping failed, but connection established:', pingError);
        isUsingMemoryStore = false;
        
        // 创建索引（如果不存在）
        await createIndexes();
        return; // 连接成功，退出重试循环
      }
      
    } catch (error) {
      logger.warn(`Failed to connect to Couchbase (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        // 最后一次尝试失败
        if (CONFIG.NODE_ENV === 'production') {
          logger.warn('Max retries reached. Falling back to memory store in production (NOT RECOMMENDED)');
          // 即使在生产环境也使用内存存储作为最后的备选
          memoryStore = new MemoryStore();
          memoryCluster = new MemoryCluster(memoryStore);
          isUsingMemoryStore = true;
          logger.info('Using in-memory database as fallback (data will not persist)');
          return;
        } else {
          // 在开发环境下，使用内存存储作为后备
          memoryStore = new MemoryStore();
          memoryCluster = new MemoryCluster(memoryStore);
          isUsingMemoryStore = true;
          logger.info('Using in-memory database for development (data will not persist)');
          return;
        }
      }
      
      // 等待后重试
      logger.info(`Waiting ${retryDelay / 1000} seconds before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    if (cluster && !isUsingMemoryStore) {
      await cluster.close();
      logger.info('Disconnected from Couchbase');
    } else if (isUsingMemoryStore) {
      logger.info('Closed memory store');
    }
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
}

async function createIndexes(): Promise<void> {
  if (isUsingMemoryStore) {
    logger.info('Skipping index creation for memory store');
    return;
  }

  try {
    // 创建必要的索引
    const indexes = [
      // 预定相关索引
      {
        name: 'idx_reservation_status',
        query: 'CREATE INDEX idx_reservation_status ON `hilton_reservations`(status) WHERE type="reservation"'
      },
      {
        name: 'idx_reservation_guest_email',
        query: 'CREATE INDEX idx_reservation_guest_email ON `hilton_reservations`(guestEmail) WHERE type="reservation"'
      },
      {
        name: 'idx_reservation_arrival_time',
        query: 'CREATE INDEX idx_reservation_arrival_time ON `hilton_reservations`(expectedArrivalTime) WHERE type="reservation"'
      },
      {
        name: 'idx_reservation_created_at',
        query: 'CREATE INDEX idx_reservation_created_at ON `hilton_reservations`(createdAt) WHERE type="reservation"'
      },
      
      // 用户相关索引
      {
        name: 'idx_user_email',
        query: 'CREATE INDEX idx_user_email ON `hilton_reservations`(email) WHERE type IN ["guest", "employee"]'
      },
      {
        name: 'idx_user_type',
        query: 'CREATE INDEX idx_user_type ON `hilton_reservations`(type)'
      },
    ];

    for (const index of indexes) {
      try {
        // 使用cluster.query方法直接执行SQL++查询
        await cluster.query(index.query);
        logger.info(`Created index: ${index.name}`);
      } catch (error: any) {
        // 如果索引已存在，忽略错误
        if (error.message && (error.message.includes('already exists') || error.message.includes('Index already exists'))) {
          logger.debug(`Index ${index.name} already exists`);
        } else {
          logger.warn(`Failed to create index ${index.name}:`, error.message);
        }
      }
    }
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
}

// 导出数据库连接对象
export function getCluster(): couchbase.Cluster | MemoryCluster {
  if (isUsingMemoryStore) {
    if (!memoryCluster) {
      throw new Error('Memory store not initialized. Call connectDatabase() first.');
    }
    return memoryCluster;
  }
  
  if (!cluster) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return cluster;
}

export function getBucket(): couchbase.Bucket {
  if (isUsingMemoryStore) {
    throw new Error('Bucket not available in memory store mode');
  }
  
  if (!bucket) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return bucket;
}

export function getCollection(): couchbase.Collection | MemoryStore {
  if (isUsingMemoryStore) {
    if (!memoryStore) {
      throw new Error('Memory store not initialized. Call connectDatabase() first.');
    }
    return memoryStore;
  }
  
  if (!collection) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return collection;
} 