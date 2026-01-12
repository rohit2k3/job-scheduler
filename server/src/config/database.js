const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB with retry logic
 */
const connectDatabase = async () => {
    try {
        await mongoose.connect(env.mongodbUri);
        logger.info('✅ MongoDB connected successfully');
    } catch (error) {
        logger.error('❌ MongoDB connection failed:', error.message);
        // Retry after 5 seconds
        setTimeout(connectDatabase, 5000);
    }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (error) => {
    logger.error('MongoDB error:', error);
});

module.exports = { connectDatabase, mongoose };
