const { Worker } = require('bullmq');
const { createRedisConnection } = require('../config/redis');
const { QUEUE_NAME } = require('./jobQueue');
const { jobImporter } = require('../services');
const { ImportLog } = require('../models');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * BullMQ Worker for processing job import batches
 * Supports configurable concurrency and retry with exponential backoff
 */
const createWorker = () => {
    const connection = createRedisConnection();

    const worker = new Worker(
        QUEUE_NAME,
        async (job) => {
            const { batch, sourceId, url, importLogId, batchIndex, totalBatches } = job.data;

            logger.info(`Processing batch ${batchIndex + 1}/${totalBatches} for ${sourceId} (${batch.length} jobs)`);

            try {
                // Get or create import log
                let importLog = await ImportLog.findById(importLogId);

                if (!importLog) {
                    // Create a new import log if not found (fallback)
                    importLog = await jobImporter.createImportLog(url, sourceId);
                }

                // Process the batch
                const stats = await jobImporter.importBatch(batch, importLog);

                logger.info(`Batch ${batchIndex + 1}/${totalBatches} completed: ${stats.newJobs} new, ${stats.updatedJobs} updated, ${stats.failedJobs.length} failed`);

                // Update import log with partial results
                const updatedLog = await ImportLog.findByIdAndUpdate(importLogId, {
                    $inc: {
                        totalFetched: batch.length,
                        totalImported: stats.newJobs + stats.updatedJobs,
                        newJobs: stats.newJobs,
                        updatedJobs: stats.updatedJobs,
                        processedBatches: 1,
                    },
                    $push: {
                        failedJobs: { $each: stats.failedJobs },
                    },
                }, { new: true });

                // Check if all batches are processed
                if (updatedLog.processedBatches >= updatedLog.totalBatches) {
                    await jobImporter.completeImportLog(updatedLog, {
                        newJobs: updatedLog.newJobs,
                        updatedJobs: updatedLog.updatedJobs,
                        failedJobs: updatedLog.failedJobs,
                    }, updatedLog.totalFetched);
                }

                return {
                    success: true,
                    batchIndex,
                    stats,
                };

            } catch (error) {
                logger.error(`Batch ${batchIndex + 1}/${totalBatches} failed: ${error.message}`);

                // Update import log with error
                await ImportLog.findByIdAndUpdate(importLogId, {
                    $push: {
                        failedJobs: {
                            externalId: `batch-${batchIndex}`,
                            title: `Batch ${batchIndex + 1} failure`,
                            reason: 'db_error',
                            message: error.message,
                        },
                    },
                });

                throw error; // Re-throw to trigger retry
            }
        },
        {
            connection,
            concurrency: env.queue.concurrency,
            limiter: {
                max: 10, // Max 10 jobs per second
                duration: 1000,
            },
        }
    );

    // Event handlers
    worker.on('completed', (job, result) => {
        logger.debug(`Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, error) => {
        const attemptsRemaining = env.queue.maxRetries - job.attemptsMade;
        if (attemptsRemaining > 0) {
            logger.warn(`Job ${job.id} failed (attempt ${job.attemptsMade}/${env.queue.maxRetries}): ${error.message}`);
        } else {
            logger.error(`Job ${job.id} permanently failed after ${job.attemptsMade} attempts: ${error.message}`);
        }
    });

    worker.on('error', (error) => {
        logger.error('Worker error:', error.message);
    });

    worker.on('stalled', (jobId) => {
        logger.warn(`Job ${jobId} stalled`);
    });

    logger.info(`Worker started with concurrency ${env.queue.concurrency}`);

    return worker;
};

/**
 * Graceful shutdown
 */
const shutdownWorker = async (worker) => {
    logger.info('Shutting down worker...');
    await worker.close();
    logger.info('Worker shut down complete');
};

module.exports = {
    createWorker,
    shutdownWorker,
};
