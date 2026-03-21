const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.post('/generate', scheduleController.generateSchedule);
router.post('/validate', scheduleController.validateSchedule);

module.exports = router;
