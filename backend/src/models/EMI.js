const mongoose = require('mongoose');

const EMISchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      required: true
    },
    emiNumber: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['upcoming', 'due_today', 'paid', 'partial', 'overdue', 'cancelled'],
      default: 'upcoming'
    },
    paidDate: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

EMISchema.index({ accountId: 1, emiNumber: 1 });
EMISchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('EMI', EMISchema);
