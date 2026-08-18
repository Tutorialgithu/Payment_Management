const Notification = require('../models/Notification');
const Person = require('../models/Person');
const Account = require('../models/Account');
const { sendNotification } = require('../services/notificationService');
const { logAudit } = require('../models/auditLogger');

// @desc    Get notification history logs
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const { personId, type, channel, page = 1, limit = 20 } = req.query;
    let query = {};

    if (personId) query.personId = personId;
    if (type && type !== 'all') query.type = type;
    if (channel && channel !== 'all') query.channel = channel;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Notification.countDocuments(query);

    const notifications = await Notification.find(query)
      .populate('personId', 'name mobile email')
      .populate('accountId', 'accountNumber purpose')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually send notification to borrower
// @route   POST /api/notifications/send
// @access  Private
const sendManualNotification = async (req, res, next) => {
  try {
    const { personId, accountId, type, message } = req.body;

    if (!personId || !type) {
      return res.status(400).json({ success: false, message: 'Person and notification type are required' });
    }

    const person = await Person.findById(personId);
    if (!person) {
      return res.status(404).json({ success: false, message: 'Person not found' });
    }

    let account = null;
    if (accountId) {
      account = await Account.findById(accountId);
    }

    const notification = await sendNotification({
      person,
      account,
      type,
      customMessage: message
    });

    await logAudit({
      adminId: req.admin._id,
      action: 'NOTIFICATION_SENT',
      entityType: 'Notification',
      entityId: notification?._id,
      description: `Sent ${type} notification to ${person.name} (${person.mobile})`,
      req
    });

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, sendManualNotification };
