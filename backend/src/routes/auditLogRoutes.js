const express = require('express');
const router = express.Router();
const { getAuditLogs, exportAuditLogs } = require('../controllers/auditLogController');
const { authenticate, authorize } = require('../middleware/auth');

// All audit log endpoints are strictly Admin-only
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAuditLogs);
router.get('/export', exportAuditLogs);

module.exports = router;
