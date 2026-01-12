require('dotenv').config();

const env = {
  // Server
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/job-importer',
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  // Queue Configuration
  queue: {
    batchSize: parseInt(process.env.BATCH_SIZE) || 100,
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY) || 5,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  },
  
  // Cron
  cron: {
    enabled: process.env.CRON_ENABLED === 'true',
    schedule: process.env.CRON_SCHEDULE || '0 * * * *', // Every hour
  },
};

module.exports = env;
