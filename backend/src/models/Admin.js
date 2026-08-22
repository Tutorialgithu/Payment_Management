const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true,
      default: 'Administrator'
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    mobile: {
      type: String,
      trim: true,
      default: ''
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    businessName: {
      type: String,
      default: 'Lending Tracker Admin'
    },
    businessLogo: {
      type: String,
      default: ''
    },
    businessAddress: {
      type: String,
      default: ''
    },
    businessPhone: {
      type: String,
      default: ''
    },
    currencySymbol: {
      type: String,
      default: '₹'
    },
    receiptPrefix: {
      type: String,
      default: 'REC-'
    },
    receiptFooterText: {
      type: String,
      default: 'Thank you for your timely payment!'
    },
    notificationSettings: {
      sendPaymentReceived: { type: Boolean, default: true },
      sendEmiReminder: { type: Boolean, default: true },
      sendDueReminder: { type: Boolean, default: true },
      sendOverdueReminder: { type: Boolean, default: true },
      sendAccountCompleted: { type: Boolean, default: true },
      reminderDaysBefore: { type: Number, default: 3 },
      whatsappEnabled: { type: Boolean, default: true },
      smsEnabled: { type: Boolean, default: false },
      whatsappApiKey: { type: String, default: '' },
      smsApiKey: { type: String, default: '' }
    },
    otpCode: {
      type: String,
      default: null
    },
    otpExpiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

AdminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

AdminSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

module.exports = mongoose.model('Admin', AdminSchema);
