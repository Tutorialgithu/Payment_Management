const express = require('express');
const router = express.Router();
const { getUpcomingEMIs, getOverdueEMIs } = require('../controllers/emiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/upcoming', getUpcomingEMIs);
router.get('/overdue', getOverdueEMIs);

module.exports = router;
