const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const env = require('../config/env');
const logger = require('../utils/logger');

const QUEUE_NAME = 'job-import';

/**
 * BullMQ Queue for job import processing
 */
const createJobQueue = () => {
    const connection = getRedisConnection();

    const queue = new Queue(QUEUE_NAME, {
        connection,
        defaultJobOptions: {
            attempts: env.queue.maxRetries,
            backoff: {
                type: 'exponential',
                delay: 1000, // Start with 1 second
            },
            removeOnComplete: {
                count: 100, // Keep last 100 completed jobs
            },
            removeOnFail: {
                count: 500, // Keep last 500 failed jobs
            },
        },
    });

    queue.on('error', (error) => {
        logger.error('Queue error:', error.message);
    });

    return queue;
};

/**
 * Add jobs to the queue for processing
 * @param {Object} fetchResult - Result from jobFetcher
 * @param {string} importLogId - ID of the ImportLog document
 */
const addJobsToQueue = async (queue, fetchResult, importLogId) => {
    const { jobs, sourceId, url } = fetchResult;

    if (!jobs || jobs.length === 0) {
        logger.info(`No jobs to queue from ${url}`);
        return;
    }

    // Split jobs into batches
    const batchSize = env.queue.batchSize;
    const batches = [];

    for (let i = 0; i < jobs.length; i += batchSize) {
        batches.push(jobs.slice(i, i + batchSize));
    }

    logger.info(`Queueing ${jobs.length} jobs in ${batches.length} batches from ${url}`);

    // Add each batch as a queue job
    const queueJobs = batches.map((batch, index) => ({
        name: `import-batch-${sourceId}-${Date.now()}-${index}`,
        data: {
            batch,
            sourceId,
            url,
            importLogId,
            batchIndex: index,
            totalBatches: batches.length,
        },
        opts: {
            priority: 1,
        },
    }));

    await queue.addBulk(queueJobs);

    logger.info(`Added ${queueJobs.length} batch jobs to queue`);
};

/**
 * Get queue statistics
 */
const getQueueStats = async (queue) => {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
    ]);

    return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + delayed,
    };
};

/**
 * Clear all jobs from the queue
 */
const clearQueue = async (queue) => {
    await queue.obliterate({ force: true });
    logger.info('Queue cleared');
};

// Singleton queue instance
let queueInstance = null;

const getQueue = () => {
    if (!queueInstance) {
        queueInstance = createJobQueue();
    }
    return queueInstance;
};

module.exports = {
    QUEUE_NAME,
    createJobQueue,
    addJobsToQueue,
    getQueueStats,
    clearQueue,
    getQueue,
};
