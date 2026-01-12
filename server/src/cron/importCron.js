const cron = require('node-cron');
const { jobFetcher, jobImporter } = require('../services');
const { getQueue, addJobsToQueue } = require('../queues');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Import Cron Job
 * Runs on a configurable schedule (default: every hour)
 */
class ImportCron {
    constructor() {
        this.task = null;
        this.isRunning = false;
    }

    /**
     * Start the cron job
     */
    start() {
        if (!env.cron.enabled) {
            logger.info('Cron job is disabled via configuration');
            return;
        }

        const schedule = env.cron.schedule;

        if (!cron.validate(schedule)) {
            logger.error(`Invalid cron schedule: ${schedule}`);
            return;
        }

        this.task = cron.schedule(schedule, async () => {
            await this.runImport();
        });

        logger.info(`Cron job scheduled: ${schedule}`);
    }

    /**
     * Stop the cron job
     */
    stop() {
        if (this.task) {
            this.task.stop();
            logger.info('Cron job stopped');
        }
    }

    /**
     * Run the import process manually
     */
    async runImport() {
        if (this.isRunning) {
            logger.warn('Import already running, skipping...');
            return { skipped: true, reason: 'Already running' };
        }

        this.isRunning = true;
        const startTime = Date.now();

        logger.info('Starting scheduled import...');

        try {
            // Fetch from all sources
            const fetchResults = await jobFetcher.fetchFromAllSources();

            if (fetchResults.length === 0) {
                logger.warn('No sources to fetch from');
                return { success: true, results: [] };
            }

            const queue = getQueue();
            const importResults = [];

            // Process each source result
            for (const result of fetchResults) {
                if (!result.success) {
                    logger.warn(`Skipping failed source: ${result.url}`);
                    importResults.push({
                        sourceId: result.sourceId,
                        url: result.url,
                        success: false,
                        error: result.error,
                    });
                    continue;
                }

                // Calculate batches
                const batchSize = env.queue.batchSize;
                const totalBatches = result.jobs ? Math.ceil(result.jobs.length / batchSize) : 0;

                // Create import log for this source
                const importLog = await jobImporter.createImportLog(result.url, result.sourceId, totalBatches);

                // Add jobs to queue
                await addJobsToQueue(queue, result, importLog._id.toString());

                importResults.push({
                    sourceId: result.sourceId,
                    url: result.url,
                    success: true,
                    jobCount: result.count,
                    importLogId: importLog._id,
                });
            }

            const duration = Date.now() - startTime;
            const totalJobs = fetchResults.reduce((sum, r) => sum + (r.count || 0), 0);

            logger.info(`Import initiated: ${totalJobs} jobs queued from ${fetchResults.length} sources in ${duration}ms`);

            return {
                success: true,
                duration,
                totalSources: fetchResults.length,
                totalJobs,
                results: importResults,
            };

        } catch (error) {
            logger.error('Import failed:', error.message);
            return {
                success: false,
                error: error.message,
            };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Get cron status
     */
    getStatus() {
        return {
            enabled: env.cron.enabled,
            schedule: env.cron.schedule,
            isRunning: this.isRunning,
        };
    }
}

module.exports = new ImportCron();
