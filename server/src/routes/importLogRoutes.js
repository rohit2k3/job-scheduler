const express = require('express');
const router = express.Router();
const {
    getImportLogs,
    getImportLogById,
    triggerImport,
    getImportStats,
    getImportQueueStatus,
    getJobSources,
    toggleJobSource,
} = require('../controllers/importLogController');

// Import logs
router.get('/import-logs', getImportLogs);
router.get('/import-logs/:id', getImportLogById);

// Import actions
router.post('/import/trigger', triggerImport);
router.get('/import/stats', getImportStats);
router.get('/import/queue', getImportQueueStatus);

// Job sources
router.get('/sources', getJobSources);
router.patch('/sources/:id/toggle', toggleJobSource);

module.exports = router;
