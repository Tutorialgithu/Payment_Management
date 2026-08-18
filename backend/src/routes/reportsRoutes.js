const express = require('express');
const router = express.Router();
const {
  getCollectionReport,
  getOverdueReport,
  getEMIReport,
  getDateWiseReport
} = require('../controllers/reportsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/collection', getCollectionReport);
router.get('/overdue', getOverdueReport);
router.get('/emi', getEMIReport);
router.get('/date-wise', getDateWiseReport);

module.exports = router;
