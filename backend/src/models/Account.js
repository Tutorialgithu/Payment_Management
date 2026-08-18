const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      unique: true,
      required: true
    },
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      required: true
    },
    amountGiven: {
      type: Number,
      required: [true, 'Amount Given is required'],
      min: [0, 'Amount must be non-negative']
    },
    expectedReturn: {
      type: Number,
      required: [true, 'Expected Return Amount is required'],
      min: [0, 'Expected return must be non-negative']
    },
    interestAmount: {
      type: Number,
      default: 0
    },
    dateGiven: {
      type: Date,
      required: true,
      default: Date.now
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: true
    },
    purpose: {
      type: String,
      default: ''
    },
    repaymentType: {
      type: String,
      enum: ['one-time', 'emi'],
      required: true,
      default: 'one-time'
    },
    // EMI details (if repaymentType === 'emi')
    emiAmount: {
      type: Number,
      default: 0
    },
    emiFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom'],
      default: 'monthly'
    },
    numberOfEmis: {
      type: Number,
      default: 1
    },
    // Financial Counters
    totalReceived: {
      type: Number,
      default: 0
    },
    outstanding: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'upcoming', 'partial', 'overdue', 'completed', 'cancelled'],
      default: 'active'
    },
    notes: {
      type: String,
      default: ''
    },
    isSoftDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

AccountSchema.index({ personId: 1, status: 1 });

module.exports = mongoose.model('Account', AccountSchema);
