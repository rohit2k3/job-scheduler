const express = require('express');
const router = express.Router();
const {
    getJobs,
    getJobById,
    getJobStats,
    cleanupOldJobs,
} = require('../controllers/jobController');

// Jobs
router.get('/', getJobs);
router.get('/stats', getJobStats);
router.get('/:id', getJobById);
router.delete('/cleanup', cleanupOldJobs);

module.exports = router;
