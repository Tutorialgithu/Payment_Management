const mongoose = require('mongoose');

const AllocationSchema = new mongoose.Schema({
  emiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EMI'
  },
  amountAllocated: {
    type: Number,
    required: true
  }
}, { _id: false });

const PaymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      unique: true,
      required: true
    },
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Person',
      required: true
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    emiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EMI',
      default: null
    },
    allocations: [AllocationSchema],
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero']
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'other'],
      required: true,
      default: 'cash'
    },
    transactionId: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

PaymentSchema.index({ personId: 1, accountId: 1, paymentDate: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
