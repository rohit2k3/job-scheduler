const mongoose = require('mongoose');

/**
 * Job Source Schema - Manages external job feed sources
 * Allows dynamic addition/removal of feed sources
 */
const jobSourceSchema = new mongoose.Schema({
    // Human-readable name
    name: {
        type: String,
        required: true,
    },

    // The feed URL
    url: {
        type: String,
        required: true,
        unique: true,
    },

    // Feed format type
    type: {
        type: String,
        enum: ['xml', 'json', 'rss'],
        default: 'xml',
    },

    // Source identifier used in Job documents
    sourceId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    // Category for grouping
    category: String,

    // Whether this source is active
    enabled: {
        type: Boolean,
        default: true,
        index: true,
    },

    // Last successful fetch time
    lastFetchedAt: Date,

    // Last fetch status
    lastFetchStatus: {
        type: String,
        enum: ['success', 'failed', 'pending'],
    },

    // Last fetch error message
    lastFetchError: String,

    // Additional metadata for parsing
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },

}, {
    timestamps: true,
});

const JobSource = mongoose.model('JobSource', jobSourceSchema);

module.exports = JobSource;
