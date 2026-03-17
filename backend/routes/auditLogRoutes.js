const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');

router.get('/', auditLogController.getAll);
router.get('/action/:action', auditLogController.getByAction);

module.exports = router;
