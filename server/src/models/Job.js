const mongoose = require('mongoose');

/**
 * Job Schema - Stores imported job listings
 * Designed for 1M+ records with proper indexing
 */
const jobSchema = new mongoose.Schema({
    // Unique identifier from the source (e.g., job GUID, link hash)
    externalId: {
        type: String,
        required: true,
        index: true,
    },

    // Source identifier (e.g., 'jobicy', 'higheredjobs')
    sourceId: {
        type: String,
        required: true,
        index: true,
    },

    // Job details
    title: {
        type: String,
        required: true,
    },

    company: {
        type: String,
        index: true,
    },

    location: String,

    description: String,

    jobType: {
        type: String,
        index: true,
    },

    category: {
        type: String,
        index: true,
    },

    region: String,

    salary: {
        min: Number,
        max: Number,
        currency: String,
        period: String, // hourly, monthly, yearly
    },

    url: String,

    publishedAt: {
        type: Date,
        index: true,
    },

    // Store original raw data for reference
    rawData: {
        type: mongoose.Schema.Types.Mixed,
    },

}, {
    timestamps: true, // Adds createdAt and updatedAt
});

// Compound unique index to prevent duplicates from same source
jobSchema.index({ sourceId: 1, externalId: 1 }, { unique: true });

// Index for efficient listing queries with sorting
jobSchema.index({ createdAt: -1 });
jobSchema.index({ publishedAt: -1 });

// Text index for search functionality
jobSchema.index({ title: 'text', company: 'text', description: 'text' });

// Compound indexes for common filter combinations
jobSchema.index({ category: 1, createdAt: -1 });
jobSchema.index({ jobType: 1, createdAt: -1 });
jobSchema.index({ sourceId: 1, createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
