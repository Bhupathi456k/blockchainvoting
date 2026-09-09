const express = require('express');
const router = express.Router();
const { getSystemSummary, getElectionReports, exportReport } = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

// All report endpoints are strictly Admin-only
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/summary', getSystemSummary);
router.get('/elections', getElectionReports);
router.get('/export', exportReport);

module.exports = router;
