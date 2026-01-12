const axios = require('axios');
const logger = require('../utils/logger');
const xmlParser = require('./xmlParser');
const { JobSource } = require('../models');

/**
 * Job Fetcher Service
 * Fetches job feeds from external XML APIs
 */
class JobFetcherService {
    constructor() {
        this.axiosInstance = axios.create({
            timeout: 30000, // 30 second timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/xml, text/xml, */*',
            },
        });
    }

    /**
     * Fetch jobs from a single source URL
     * @param {Object} source - Job source configuration
     * @returns {Promise<Object>} Fetch result with jobs array
     */
    async fetchFromSource(source) {
        const startTime = Date.now();

        try {
            logger.info(`Fetching jobs from: ${source.url}`);

            const response = await this.axiosInstance.get(source.url);
            const xmlData = response.data;

            // Parse XML to JSON
            const parsedData = await xmlParser.parse(xmlData);

            // Extract jobs based on source type
            let jobs = [];

            if (source.url.includes('jobicy.com')) {
                jobs = xmlParser.extractJobicyJobs(parsedData);
            } else if (source.url.includes('higheredjobs.com')) {
                jobs = xmlParser.extractHigherEdJobs(parsedData);
            } else {
                // Generic RSS parsing
                jobs = xmlParser.extractJobicyJobs(parsedData);
            }

            // Add sourceId to each job
            jobs = jobs.map(job => ({
                ...job,
                sourceId: source.sourceId,
            }));

            const duration = Date.now() - startTime;

            logger.info(`Fetched ${jobs.length} jobs from ${source.name} in ${duration}ms`);

            // Update source last fetch info
            await JobSource.findByIdAndUpdate(source._id, {
                lastFetchedAt: new Date(),
                lastFetchStatus: 'success',
                lastFetchError: null,
            });

            return {
                success: true,
                sourceId: source.sourceId,
                sourceName: source.name,
                url: source.url,
                jobs,
                count: jobs.length,
                duration,
            };

        } catch (error) {
            const duration = Date.now() - startTime;

            logger.error(`Failed to fetch from ${source.url}: ${error.message}`);

            // Update source with error
            await JobSource.findByIdAndUpdate(source._id, {
                lastFetchedAt: new Date(),
                lastFetchStatus: 'failed',
                lastFetchError: error.message,
            });

            return {
                success: false,
                sourceId: source.sourceId,
                sourceName: source.name,
                url: source.url,
                jobs: [],
                count: 0,
                duration,
                error: error.message,
            };
        }
    }

    /**
     * Fetch jobs from all enabled sources
     * @returns {Promise<Array>} Array of fetch results
     */
    async fetchFromAllSources() {
        try {
            const sources = await JobSource.find({ enabled: true });

            if (sources.length === 0) {
                logger.warn('No enabled job sources found');
                return [];
            }

            logger.info(`Fetching from ${sources.length} enabled sources`);

            // Fetch from all sources in parallel
            const results = await Promise.all(
                sources.map(source => this.fetchFromSource(source))
            );

            const totalJobs = results.reduce((sum, r) => sum + r.count, 0);
            const successCount = results.filter(r => r.success).length;

            logger.info(`Fetched ${totalJobs} total jobs from ${successCount}/${results.length} sources`);

            return results;

        } catch (error) {
            logger.error('Error fetching from all sources:', error.message);
            throw error;
        }
    }

    /**
     * Initialize default job sources if none exist
     */
    async initializeDefaultSources() {
        const existingCount = await JobSource.countDocuments();

        if (existingCount > 0) {
            logger.info(`${existingCount} job sources already exist`);
            return;
        }

        const defaultSources = [
            {
                name: 'Jobicy - All Jobs',
                url: 'https://jobicy.com/?feed=job_feed',
                type: 'xml',
                sourceId: 'jobicy-all',
                category: 'general',
                enabled: true,
            },
            {
                name: 'Jobicy - Social Media Marketing',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time',
                type: 'xml',
                sourceId: 'jobicy-smm',
                category: 'marketing',
                enabled: true,
            },
            {
                name: 'Jobicy - Sales France',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france',
                type: 'xml',
                sourceId: 'jobicy-sales-france',
                category: 'sales',
                enabled: true,
            },
            {
                name: 'Jobicy - Design & Multimedia',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia',
                type: 'xml',
                sourceId: 'jobicy-design',
                category: 'design',
                enabled: true,
            },
            {
                name: 'Jobicy - Data Science',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=data-science',
                type: 'xml',
                sourceId: 'jobicy-data-science',
                category: 'data-science',
                enabled: true,
            },
            {
                name: 'Jobicy - Copywriting',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=copywriting',
                type: 'xml',
                sourceId: 'jobicy-copywriting',
                category: 'writing',
                enabled: true,
            },
            {
                name: 'Jobicy - Business',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=business',
                type: 'xml',
                sourceId: 'jobicy-business',
                category: 'business',
                enabled: true,
            },
            {
                name: 'Jobicy - Management',
                url: 'https://jobicy.com/?feed=job_feed&job_categories=management',
                type: 'xml',
                sourceId: 'jobicy-management',
                category: 'management',
                enabled: true,
            },
            {
                name: 'HigherEdJobs - Articles Feed',
                url: 'https://www.higheredjobs.com/rss/articleFeed.cfm',
                type: 'xml',
                sourceId: 'higheredjobs',
                category: 'education',
                enabled: true,
            },
        ];

        try {
            await JobSource.insertMany(defaultSources);
            logger.info(`Initialized ${defaultSources.length} default job sources`);
        } catch (error) {
            logger.error('Error initializing default sources:', error.message);
            throw error;
        }
    }
}

module.exports = new JobFetcherService();
