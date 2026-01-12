const { Job } = require('../models');
const { asyncHandler, ApiError } = require('../utils/errorHandler');

/**
 * Get jobs with pagination and filtering
 * GET /api/jobs
 */
const getJobs = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        sourceId,
        category,
        jobType,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    if (sourceId) {
        query.sourceId = sourceId;
    }

    if (category) {
        query.category = category;
    }

    if (jobType) {
        query.jobType = jobType;
    }

    if (search) {
        query.$text = { $search: search };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [jobs, total] = await Promise.all([
        Job.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .select('-rawData') // Exclude raw data for performance
            .lean(),
        Job.countDocuments(query),
    ]);

    res.json({
        success: true,
        data: jobs,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
        },
    });
});

/**
 * Get single job by ID
 * GET /api/jobs/:id
 */
const getJobById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const job = await Job.findById(id);

    if (!job) {
        throw new ApiError(404, 'Job not found');
    }

    res.json({
        success: true,
        data: job,
    });
});

/**
 * Get job statistics
 * GET /api/jobs/stats
 */
const getJobStats = asyncHandler(async (req, res) => {
    const [
        totalJobs,
        jobsByCategory,
        jobsBySource,
        jobsByType,
    ] = await Promise.all([
        Job.countDocuments(),
        Job.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]),
        Job.aggregate([
            { $group: { _id: '$sourceId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        Job.aggregate([
            { $group: { _id: '$jobType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
    ]);

    // Get jobs created in last 7 days
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentJobsByDay = await Job.aggregate([
        { $match: { createdAt: { $gte: last7Days } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    res.json({
        success: true,
        data: {
            totalJobs,
            jobsByCategory,
            jobsBySource,
            jobsByType,
            recentJobsByDay,
        },
    });
});

/**
 * Delete old jobs
 * DELETE /api/jobs/cleanup
 */
const cleanupOldJobs = asyncHandler(async (req, res) => {
    const { daysOld = 90 } = req.query;

    const cutoffDate = new Date(Date.now() - parseInt(daysOld) * 24 * 60 * 60 * 1000);

    const result = await Job.deleteMany({
        createdAt: { $lt: cutoffDate },
    });

    res.json({
        success: true,
        message: `Deleted ${result.deletedCount} jobs older than ${daysOld} days`,
        deletedCount: result.deletedCount,
    });
});

module.exports = {
    getJobs,
    getJobById,
    getJobStats,
    cleanupOldJobs,
};
