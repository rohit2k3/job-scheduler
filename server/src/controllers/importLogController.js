const { ImportLog, JobSource } = require('../models');
const { jobImporter } = require('../services');
const { getQueue, getQueueStats } = require('../queues');
const { importCron } = require('../cron');
const { asyncHandler, ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Get import logs with pagination and filtering
 * GET /api/import-logs
 */
const getImportLogs = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        sourceId,
        startDate,
        endDate,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    if (status) {
        query.status = status;
    }

    if (sourceId) {
        query.sourceId = sourceId;
    }

    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
            query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
            query.timestamp.$lte = new Date(endDate);
        }
    }

    // Execute query
    const [logs, total] = await Promise.all([
        ImportLog.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        ImportLog.countDocuments(query),
    ]);

    res.json({
        success: true,
        data: logs,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
        },
    });
});

/**
 * Get single import log by ID
 * GET /api/import-logs/:id
 */
const getImportLogById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const log = await ImportLog.findById(id);

    if (!log) {
        throw new ApiError(404, 'Import log not found');
    }

    res.json({
        success: true,
        data: log,
    });
});

/**
 * Trigger manual import
 * POST /api/import/trigger
 */
const triggerImport = asyncHandler(async (req, res) => {
    const { sourceId } = req.body;

    logger.info(`Manual import triggered${sourceId ? ` for source: ${sourceId}` : ' for all sources'}`);

    // Run import
    const result = await importCron.runImport();

    if (result.skipped) {
        throw new ApiError(409, 'Import already running');
    }

    res.json({
        success: result.success,
        message: result.success ? 'Import initiated' : 'Import failed',
        data: result,
    });
});

/**
 * Get import statistics
 * GET /api/import/stats
 */
const getImportStats = asyncHandler(async (req, res) => {
    const stats = await jobImporter.getStatistics();

    res.json({
        success: true,
        data: stats,
    });
});

/**
 * Get queue status
 * GET /api/import/queue
 */
const getImportQueueStatus = asyncHandler(async (req, res) => {
    const queue = getQueue();
    const queueStats = await getQueueStats(queue);
    const cronStatus = importCron.getStatus();

    res.json({
        success: true,
        data: {
            queue: queueStats,
            cron: cronStatus,
        },
    });
});

/**
 * Get job sources
 * GET /api/sources
 */
const getJobSources = asyncHandler(async (req, res) => {
    const sources = await JobSource.find().sort({ name: 1 });

    res.json({
        success: true,
        data: sources,
    });
});

/**
 * Toggle job source enabled status
 * PATCH /api/sources/:id/toggle
 */
const toggleJobSource = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const source = await JobSource.findById(id);

    if (!source) {
        throw new ApiError(404, 'Job source not found');
    }

    source.enabled = !source.enabled;
    await source.save();

    logger.info(`Source ${source.name} ${source.enabled ? 'enabled' : 'disabled'}`);

    res.json({
        success: true,
        data: source,
    });
});

module.exports = {
    getImportLogs,
    getImportLogById,
    triggerImport,
    getImportStats,
    getImportQueueStatus,
    getJobSources,
    toggleJobSource,
};
