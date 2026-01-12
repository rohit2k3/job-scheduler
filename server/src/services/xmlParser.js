const xml2js = require('xml2js');
const logger = require('../utils/logger');

/**
 * XML Parser Service
 * Converts XML feed data to JSON format
 */
class XmlParserService {
    constructor() {
        this.parser = new xml2js.Parser({
            explicitArray: false,
            ignoreAttrs: false,
            mergeAttrs: true,
            trim: true,
            normalize: true,
        });
    }

    /**
     * Parse XML string to JSON
     * @param {string} xmlString - Raw XML content
     * @returns {Promise<Object>} Parsed JSON object
     */
    async parse(xmlString) {
        try {
            const result = await this.parser.parseStringPromise(xmlString);
            return result;
        } catch (error) {
            logger.error('XML parsing error:', error.message);
            throw new Error(`Failed to parse XML: ${error.message}`);
        }
    }

    /**
     * Extract jobs from parsed Jobicy RSS feed
     * @param {Object} parsedData - Parsed XML data
     * @returns {Array} Array of job objects
     */
    extractJobicyJobs(parsedData) {
        try {
            const channel = parsedData?.rss?.channel;
            if (!channel || !channel.item) {
                logger.warn('No items found in Jobicy feed');
                return [];
            }

            const items = Array.isArray(channel.item) ? channel.item : [channel.item];

            return items.map((item) => {
                // Extract salary information if available
                let salary = null;
                if (item['job_salary']) {
                    salary = {
                        min: null,
                        max: null,
                        currency: 'USD',
                        period: 'yearly',
                        raw: item['job_salary'],
                    };
                }

                // Helper to extract text from possible object
                const getText = (val) => {
                    if (!val) return null;
                    if (typeof val === 'string') return val;
                    if (val._) return val._;
                    if (val.toString() === '[object Object]') return JSON.stringify(val); // Fallback
                    return String(val);
                };

                const guid = getText(item.guid);
                const link = getText(item.link);
                const identifier = guid || link;

                if (!identifier) logger.warn(`No identifier for job: ${item.title}`);
                const externalId = this.generateExternalId(identifier);

                return {
                    externalId,
                    title: getText(item.title) || 'Untitled',
                    company: getText(item['job_listing_company']) || 'Unknown Company',
                    location: getText(item['job_listing_location']) || getText(item['job_geo']) || 'Remote',
                    description: this.cleanDescription(getText(item.description) || getText(item['content:encoded']) || ''),
                    jobType: getText(item['job_listing_job_type']) || 'Full-time',
                    category: getText(item.category) || 'General',
                    region: getText(item['job_listing_region']) || getText(item['job_geo']) || null,
                    url: link || guid || null,
                    publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                    salary,
                    rawData: item,
                };
            });
        } catch (error) {
            logger.error('Error extracting Jobicy jobs:', error.message);
            return [];
        }
    }

    /**
     * Extract jobs from HigherEdJobs RSS feed
     * @param {Object} parsedData - Parsed XML data
     * @returns {Array} Array of job objects
     */
    extractHigherEdJobs(parsedData) {
        try {
            const channel = parsedData?.rss?.channel;
            if (!channel || !channel.item) {
                logger.warn('No items found in HigherEdJobs feed');
                return [];
            }

            const items = Array.isArray(channel.item) ? channel.item : [channel.item];

            return items.map((item) => {
                const externalId = this.generateExternalId(item.guid || item.link);

                return {
                    externalId,
                    title: item.title || 'Untitled',
                    company: 'HigherEdJobs',
                    location: 'USA',
                    description: this.cleanDescription(item.description || ''),
                    jobType: 'Full-time',
                    category: 'Education',
                    region: 'USA',
                    url: item.link || item.guid || null,
                    publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
                    salary: null,
                    rawData: item,
                };
            });
        } catch (error) {
            logger.error('Error extracting HigherEdJobs:', error.message);
            return [];
        }
    }

    /**
     * Generate a consistent external ID from a URL or GUID
     * @param {string} identifier - URL or GUID string
     * @returns {string} Hashed external ID
     */
    generateExternalId(identifier) {
        if (!identifier) {
            return `unknown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // Create a simple hash for the identifier
        let hash = 0;
        for (let i = 0; i < identifier.length; i++) {
            const char = identifier.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        // Return absolute value as string with prefix
        return `job-${Math.abs(hash).toString(36)}`;
    }

    /**
     * Clean HTML from description text
     * @param {string} description - Raw description with possible HTML
     * @returns {string} Cleaned description
     */
    cleanDescription(description) {
        if (!description) return '';

        // Remove HTML tags
        let cleaned = description.replace(/<[^>]*>/g, ' ');

        // Decode common HTML entities
        cleaned = cleaned
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'");

        // Normalize whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        // Limit description length
        if (cleaned.length > 5000) {
            cleaned = cleaned.substring(0, 5000) + '...';
        }

        return cleaned;
    }
}

module.exports = new XmlParserService();
