const logger = require('./logger');

/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;

    // Default to 500 if no statusCode
    if (!statusCode) {
        statusCode = 500;
    }

    // Log error
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`);

    if (err.stack) {
        logger.debug(err.stack);
    }

    // Don't expose internal errors in production
    if (statusCode === 500 && process.env.NODE_ENV === 'production') {
        message = 'Internal Server Error';
    }

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
};

/**
 * Handle 404 - Route not found
 */
const notFound = (req, res, next) => {
    const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
    next(error);
};

module.exports = {
    ApiError,
    asyncHandler,
    errorHandler,
    notFound,
};
