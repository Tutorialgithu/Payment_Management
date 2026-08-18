const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      required: true
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    },
    type: {
      type: String,
      enum: ['payment_received', 'emi_reminder', 'due_reminder', 'overdue', 'account_completed', 'custom'],
      required: true
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'sms', 'both'],
      default: 'whatsapp'
    },
    recipientMobile: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    providerMessageId: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'sent'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

NotificationSchema.index({ personId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
