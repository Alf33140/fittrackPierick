const express = require('express');
const router = express.Router();
const StatsController = require('../controllers/stats.controller');
const authMiddleware = require('../middleware/auth.middleware')

// GET api/stats/progression (protected)
router.get('progression', authMiddleware, StatsController.getProgression);

module.exports = router;