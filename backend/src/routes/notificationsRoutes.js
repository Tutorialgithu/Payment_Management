const express = require('express');
const router = express.Router();
const { getNotifications, sendManualNotification } = require('../controllers/notificationsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.post('/send', sendManualNotification);

module.exports = router;
