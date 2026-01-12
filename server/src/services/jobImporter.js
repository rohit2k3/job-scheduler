const { Job, ImportLog } = require('../models');
const logger = require('../utils/logger');

/**
 * Job Importer Service
 * Handles atomic upsert logic and import statistics tracking
 */
class JobImporterService {
    /**
     * Import a batch of jobs with atomic upsert
     * @param {Array} jobs - Array of job objects to import
     * @param {Object} importLog - The ImportLog document for this run
     * @returns {Promise<Object>} Import statistics
     */
    async importBatch(jobs, importLog) {
        const stats = {
            newJobs: 0,
            updatedJobs: 0,
            failedJobs: [],
        };

        if (!jobs || jobs.length === 0) {
            return stats;
        }

        // Process jobs in parallel with controlled concurrency
        const results = await Promise.allSettled(
            jobs.map(job => this.upsertJob(job))
        );

        // Aggregate results
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const job = jobs[i];

            if (result.status === 'fulfilled') {
                if (result.value.isNew) {
                    stats.newJobs++;
                } else {
                    stats.updatedJobs++;
                }
            } else {
                // Categorize the error
                const reason = this.categorizeError(result.reason);
                stats.failedJobs.push({
                    externalId: job.externalId,
                    title: job.title,
                    reason: reason.type,
                    message: reason.message,
                });
            }
        }

        return stats;
    }

    /**
     * Upsert a single job with atomic operation
     * @param {Object} jobData - Job data to upsert
     * @returns {Promise<Object>} Result with isNew flag
     */
    async upsertJob(jobData) {
        // Validate required fields
        if (!jobData.externalId || !jobData.sourceId) {
            throw new Error('Missing required fields: externalId or sourceId');
        }

        try {
            // Use findOneAndUpdate with upsert for atomic operation
            const result = await Job.findOneAndUpdate(
                {
                    sourceId: jobData.sourceId,
                    externalId: jobData.externalId,
                },
                {
                    $set: {
                        title: jobData.title,
                        company: jobData.company,
                        location: jobData.location,
                        description: jobData.description,
                        jobType: jobData.jobType,
                        category: jobData.category,
                        region: jobData.region,
                        salary: jobData.salary,
                        url: jobData.url,
                        publishedAt: jobData.publishedAt,
                        rawData: jobData.rawData,
                        updatedAt: new Date(),
                    },
                    $setOnInsert: {
                        createdAt: new Date(),
                    },
                },
                {
                    upsert: true,
                    new: true,
                    rawResult: true, // Get the raw result to check if upserted
                }
            );

            // Check if this was a new document or an update
            const isNew = result.lastErrorObject?.upserted !== undefined;

            return { isNew, job: result.value };

        } catch (error) {
            // Handle duplicate key error (race condition)
            if (error.code === 11000) {
                // Try to update instead
                const existingJob = await Job.findOne({
                    sourceId: jobData.sourceId,
                    externalId: jobData.externalId,
                });

                if (existingJob) {
                    Object.assign(existingJob, {
                        title: jobData.title,
                        company: jobData.company,
                        location: jobData.location,
                        description: jobData.description,
                        jobType: jobData.jobType,
                        category: jobData.category,
                        region: jobData.region,
                        salary: jobData.salary,
                        url: jobData.url,
                        publishedAt: jobData.publishedAt,
                        rawData: jobData.rawData,
                    });
                    await existingJob.save();
                    return { isNew: false, job: existingJob };
                }
            }

            throw error;
        }
    }

    /**
     * Categorize error for logging purposes
     * @param {Error} error - The error to categorize
     * @returns {Object} Error type and message
     */
    categorizeError(error) {
        if (!error) {
            return { type: 'unknown', message: 'Unknown error' };
        }

        const message = error.message || String(error);

        // Validation errors
        if (message.includes('validation') || message.includes('required') || message.includes('Missing')) {
            return { type: 'validation_error', message };
        }

        // Duplicate key errors
        if (error.code === 11000 || message.includes('duplicate')) {
            return { type: 'duplicate', message };
        }

        // MongoDB/Database errors
        if (message.includes('Mongo') || message.includes('connection') || message.includes('timeout')) {
            return { type: 'db_error', message };
        }

        // Parse errors
        if (message.includes('parse') || message.includes('invalid')) {
            return { type: 'parse_error', message };
        }

        return { type: 'unknown', message };
    }

    /**
     * Create a new import log entry
     * @param {string} fileName - The source URL
     * @param {string} sourceId - The source identifier
     * @param {number} totalBatches - Total number of batches (optional, default 1)
     * @returns {Promise<Object>} The created ImportLog document
     */
    async createImportLog(fileName, sourceId, totalBatches = 0) {
        const importLog = new ImportLog({
            timestamp: new Date(),
            fileName,
            sourceId,
            status: 'processing',
            totalFetched: 0,
            totalImported: 0,
            newJobs: 0,
            updatedJobs: 0,
            failedJobs: [],
            totalBatches,
            processedBatches: 0,
        });

        await importLog.save();
        return importLog;
    }

    /**
     * Complete an import log with final statistics
     * @param {Object} importLog - The ImportLog document
     * @param {Object} stats - Final import statistics
     * @param {number} totalFetched - Total jobs fetched
     * @param {string} error - Optional error message
     */
    async completeImportLog(importLog, stats, totalFetched, error = null) {
        const endTime = new Date();
        const duration = endTime - importLog.timestamp;

        importLog.status = error ? 'failed' : 'completed';
        importLog.totalFetched = totalFetched;
        importLog.totalImported = stats.newJobs + stats.updatedJobs;
        importLog.newJobs = stats.newJobs;
        importLog.updatedJobs = stats.updatedJobs;
        importLog.failedJobs = stats.failedJobs;
        importLog.duration = duration;
        importLog.error = error;

        await importLog.save();

        logger.info(`Import completed: ${importLog.newJobs} new, ${importLog.updatedJobs} updated, ${importLog.failedJobs.length} failed`);

        return importLog;
    }

    /**
     * Get import statistics summary
     * @returns {Promise<Object>} Statistics object
     */
    async getStatistics() {
        const [
            totalJobs,
            jobsBySource,
            recentImports,
            totalImports,
        ] = await Promise.all([
            Job.countDocuments(),
            Job.aggregate([
                { $group: { _id: '$sourceId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            ImportLog.find()
                .sort({ timestamp: -1 })
                .limit(10)
                .lean(),
            ImportLog.countDocuments(),
        ]);

        // Calculate success rate
        const successfulImports = await ImportLog.countDocuments({ status: 'completed' });
        const successRate = totalImports > 0
            ? ((successfulImports / totalImports) * 100).toFixed(1)
            : 0;

        // Get jobs imported in last 24 hours
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentJobCount = await Job.countDocuments({
            createdAt: { $gte: last24Hours },
        });

        return {
            totalJobs,
            totalImports,
            successRate: parseFloat(successRate),
            recentJobCount,
            jobsBySource,
            recentImports,
        };
    }
}

module.exports = new JobImporterService();
