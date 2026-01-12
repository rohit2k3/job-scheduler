const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

/**
 * Create Redis connection for BullMQ
 */
const createRedisConnection = () => {
    const connection = new Redis({
        host: env.redis.host,
        port: env.redis.port,
        password: env.redis.password || undefined,
        maxRetriesPerRequest: null, // Required for BullMQ
        enableReadyCheck: false,
    });

    connection.on('connect', () => {
        logger.info('✅ Redis connected successfully');
    });

    connection.on('error', (error) => {
        logger.error('❌ Redis connection error:', error.message);
    });

    connection.on('close', () => {
        logger.warn('⚠️ Redis connection closed');
    });

    return connection;
};

// Shared connection for the queue
let sharedConnection = null;

const getRedisConnection = () => {
    if (!sharedConnection) {
        sharedConnection = createRedisConnection();
    }
    return sharedConnection;
};

module.exports = { createRedisConnection, getRedisConnection };
