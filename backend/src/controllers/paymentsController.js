const Payment = require('../models/Payment');
const Account = require('../models/Account');
const Person = require('../models/Person');
const EMI = require('../models/EMI');
const Admin = require('../models/Admin');
const { allocatePaymentToEMIs } = require('../services/emiService');
const { generatePaymentReceiptPDF } = require('../services/pdfService');
const { sendNotification } = require('../services/notificationService');
const { logAudit } = require('../models/auditLogger');

const generateReceiptNumber = async () => {
  const admin = await Admin.findOne();
  const prefix = admin?.receiptPrefix || 'REC-';
  const count = await Payment.countDocuments();
  const numStr = String(count + 1).padStart(6, '0');
  return `${prefix}${numStr}`;
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res, next) => {
  try {
    const { personId, accountId, paymentMethod, page = 1, limit = 10 } = req.query;
    let query = {};

    if (personId) query.personId = personId;
    if (accountId) query.accountId = accountId;
    if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate('personId', 'name mobile email')
      .populate('accountId', 'accountNumber purpose')
      .populate('emiId', 'emiNumber dueDate')
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment detail
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('personId')
      .populate('accountId')
      .populate('emiId');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment receipt not found' });
    }

    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Receive / Record New Payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res, next) => {
  try {
    const {
      personId,
      accountId,
      amount,
      paymentDate,
      paymentMethod,
      transactionId,
      emiId,
      notes,
      allocationType = 'auto' // 'auto' or 'manual'
    } = req.body;

    if (!personId || !accountId || !amount) {
      return res.status(400).json({ success: false, message: 'Person, Account, and Amount are required' });
    }

    const payAmount = Number(amount);
    if (payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const person = await Person.findById(personId);
    if (!person) {
      return res.status(404).json({ success: false, message: 'Borrower not found' });
    }

    const receiptNumber = await generateReceiptNumber();
    let allocations = [];

    // If repaymentType === 'emi', run EMI allocation engine
    if (account.repaymentType === 'emi') {
      const targetEmiId = allocationType === 'manual' ? emiId : null;
      const result = await allocatePaymentToEMIs(account, payAmount, targetEmiId);
      allocations = result.allocations;
    } else {
      // One-Time repayment calculations
      account.totalReceived = Math.round((account.totalReceived + payAmount) * 100) / 100;
      account.outstanding = Math.round((account.expectedReturn - account.totalReceived) * 100) / 100;

      if (account.outstanding <= 0) {
        account.outstanding = 0;
        account.status = 'completed';
      } else {
        account.status = 'partial';
      }
      await account.save();
    }

    // Create immutable Payment Record
    const payment = await Payment.create({
      receiptNumber,
      personId,
      accountId,
      emiId: emiId || (allocations.length > 0 ? allocations[0].emiId : null),
      allocations,
      amount: payAmount,
      paymentDate: paymentDate || new Date(),
      paymentMethod: paymentMethod || 'cash',
      transactionId: transactionId || '',
      notes: notes || ''
    });

    // Send Automatic Notification (Payment Received / Account Completed)
    const notificationType = account.status === 'completed' ? 'account_completed' : 'payment_received';
    await sendNotification({
      person,
      account,
      payment,
      type: notificationType
    });

    await logAudit({
      adminId: req.admin._id,
      action: 'PAYMENT_RECEIVED',
      entityType: 'Payment',
      entityId: payment._id,
      description: `Received payment ${receiptNumber} of ₹${payAmount} from ${person.name} (${account.accountNumber})`,
      req
    });

    res.status(201).json({
      success: true,
      payment,
      account
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download / Stream Payment Receipt PDF
// @route   GET /api/payments/:id/pdf
// @access  Private
const downloadReceiptPDF = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    const person = await Person.findById(payment.personId);
    const account = await Account.findById(payment.accountId);
    const adminSettings = await Admin.findOne();

    generatePaymentReceiptPDF(payment, person, account, adminSettings, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  downloadReceiptPDF
};
