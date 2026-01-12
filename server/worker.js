/**
 * Standalone Worker Process
 * 
 * Run this separately from the main API server for production use.
 * This allows scaling workers independently of the API.
 * 
 * Usage: node worker.js
 */

require('dotenv').config();

const { connectDatabase } = require('./src/config/database');
const { createWorker, shutdownWorker } = require('./src/queues');
const logger = require('./src/utils/logger');

let worker = null;

const startWorker = async () => {
    try {
        logger.info('Starting job import worker...');

        // Connect to MongoDB (required for updating import logs)
        await connectDatabase();

        // Create and start worker
        worker = createWorker();

        logger.info('Worker is running and waiting for jobs...');

    } catch (error) {
        logger.error('Failed to start worker:', error.message);
        process.exit(1);
    }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal} signal`);

    if (worker) {
        await shutdownWorker(worker);
    }

    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the worker
startWorker();
