require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();

const { connectDatabase } = require('./src/config/database');
const { importLogRoutes, jobRoutes } = require('./src/routes');
const { errorHandler, notFound } = require('./src/utils/errorHandler');
const { jobFetcher } = require('./src/services');
const { importCron } = require('./src/cron');
const { createWorker } = require('./src/queues');
const logger = require('./src/utils/logger');
const env = require('./src/config/env');

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    logger.http(`${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Job Importer API',
        version: '1.0.0',
        health: '/health',
    });
});

// API routes
app.use('/api', importLogRoutes);
app.use('/api/jobs', jobRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Initialize default job sources
        await jobFetcher.initializeDefaultSources();

        // Start cron job
        importCron.start();

        // Start worker (simplified for single-instance deployment)
        createWorker();

        // Start Express server
        app.listen(env.port, () => {
            logger.info(`🚀 Server running on port ${env.port}`);
            logger.info(`📊 Environment: ${env.nodeEnv}`);
            logger.info(`📝 API available at http://localhost:${env.port}/api`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

// Graceful shutdown
const gracefulShutdown = async () => {
    logger.info('Received shutdown signal');

    importCron.stop();

    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
startServer();

module.exports = app;
