const mongoose = require('mongoose');

/**
 * Import Log Schema - Tracks detailed import history
 * Each document represents one import run from a specific source
 */
const importLogSchema = new mongoose.Schema({
    // Timestamp when import started
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },

    // Batch tracking
    totalBatches: {
        type: Number,
        default: 0,
    },

    processedBatches: {
        type: Number,
        default: 0,
    },

    // The API URL that was fetched
    fileName: {
        type: String,
        required: true,
    },

    // Source identifier for filtering
    sourceId: {
        type: String,
        required: true,
        index: true,
    },

    // Import status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
        index: true,
    },

    // Statistics
    totalFetched: {
        type: Number,
        default: 0,
    },

    totalImported: {
        type: Number,
        default: 0,
    },

    newJobs: {
        type: Number,
        default: 0,
    },

    updatedJobs: {
        type: Number,
        default: 0,
    },

    // Failed jobs with reasons
    failedJobs: [{
        externalId: String,
        title: String,
        reason: {
            type: String,
            enum: ['validation_error', 'db_error', 'duplicate', 'parse_error', 'unknown'],
        },
        message: String,
    }],

    // Duration in milliseconds
    duration: Number,

    // Top-level error if entire import failed
    error: String,

}, {
    timestamps: true,
});

// Compound index for efficient listing with status filter
importLogSchema.index({ status: 1, timestamp: -1 });
importLogSchema.index({ sourceId: 1, timestamp: -1 });

// Virtual for failed count
importLogSchema.virtual('failedCount').get(function () {
    return this.failedJobs ? this.failedJobs.length : 0;
});

// Ensure virtuals are included in JSON output
importLogSchema.set('toJSON', { virtuals: true });
importLogSchema.set('toObject', { virtuals: true });

const ImportLog = mongoose.model('ImportLog', importLogSchema);

module.exports = ImportLog;
