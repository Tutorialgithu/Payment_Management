const Account = require('../models/Account');
const Person = require('../models/Person');
const EMI = require('../models/EMI');
const Payment = require('../models/Payment');
const { generateEMISchedule } = require('../services/emiService');
const { logAudit } = require('../models/auditLogger');

// Generate unique account number e.g. LN-1001
const generateAccountNumber = async () => {
  const count = await Account.countDocuments();
  const nextNum = 10001 + count;
  return `LN-${nextNum}`;
};

// @desc    Get all accounts with filters
// @route   GET /api/accounts
// @access  Private
const getAccounts = async (req, res, next) => {
  try {
    const { personId, status, repaymentType, search, page = 1, limit = 10 } = req.query;
    let query = { isSoftDeleted: false };

    if (personId) query.personId = personId;
    if (status && status !== 'all') query.status = status;
    if (repaymentType && repaymentType !== 'all') query.repaymentType = repaymentType;

    if (search) {
      const matchingPeople = await Person.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      const personIds = matchingPeople.map((p) => p._id);

      query.$or = [
        { accountNumber: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } },
        { personId: { $in: personIds } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Account.countDocuments(query);

    const accounts = await Account.find(query)
      .populate('personId', 'name mobile email photo status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      accounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single Account by ID
// @route   GET /api/accounts/:id
// @access  Private
const getAccountById = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id).populate('personId');
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const emis = await EMI.find({ accountId: account._id }).sort({ emiNumber: 1 });
    const payments = await Payment.find({ accountId: account._id }).sort({ paymentDate: -1 });

    res.json({
      success: true,
      account,
      emis,
      payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Account / Loan
// @route   POST /api/accounts
// @access  Private
const createAccount = async (req, res, next) => {
  try {
    const {
      personId,
      amountGiven,
      expectedReturn,
      dateGiven,
      startDate,
      dueDate,
      purpose,
      repaymentType,
      emiAmount,
      emiFrequency,
      numberOfEmis,
      customDays,
      notes
    } = req.body;

    if (!personId || !amountGiven || !expectedReturn) {
      return res.status(400).json({ success: false, message: 'Person, Amount Given, and Expected Return are required' });
    }

    const person = await Person.findById(personId);
    if (!person) {
      return res.status(404).json({ success: false, message: 'Borrower not found' });
    }

    const accountNumber = await generateAccountNumber();
    const given = Number(amountGiven);
    const expected = Number(expectedReturn);
    const interestAmount = Math.max(0, expected - given);

    let calculatedDueDate = dueDate ? new Date(dueDate) : new Date();
    if (repaymentType === 'one-time' && !dueDate) {
      // Default to 1 month from date given if omitted
      calculatedDueDate.setMonth(calculatedDueDate.getMonth() + 1);
    }

    const account = await Account.create({
      accountNumber,
      personId,
      amountGiven: given,
      expectedReturn: expected,
      interestAmount,
      dateGiven: dateGiven || new Date(),
      startDate: startDate || dateGiven || new Date(),
      dueDate: calculatedDueDate,
      purpose: purpose || '',
      repaymentType: repaymentType || 'one-time',
      emiAmount: Number(emiAmount) || 0,
      emiFrequency: emiFrequency || 'monthly',
      numberOfEmis: Number(numberOfEmis) || 1,
      customDays: Number(customDays) || 0,
      totalReceived: 0,
      outstanding: expected,
      status: 'active',
      notes: notes || ''
    });

    // Generate EMI Schedule if repayment type is EMI
    let emis = [];
    if (repaymentType === 'emi') {
      emis = await generateEMISchedule(account);
    }

    await logAudit({
      adminId: req.admin._id,
      action: 'ACCOUNT_CREATED',
      entityType: 'Account',
      entityId: account._id,
      description: `Created loan account ${account.accountNumber} for ${person.name} (Given: ₹${given}, Expected: ₹${expected})`,
      req
    });

    res.status(201).json({
      success: true,
      account,
      emis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Account
// @route   PUT /api/accounts/:id
// @access  Private
const updateAccount = async (req, res, next) => {
  try {
    let account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const {
      amountGiven,
      expectedReturn,
      dateGiven,
      dueDate,
      purpose,
      repaymentType,
      notes,
      status
    } = req.body;

    if (purpose !== undefined) account.purpose = purpose;
    if (notes !== undefined) account.notes = notes;
    if (dateGiven) account.dateGiven = dateGiven;
    if (dueDate) account.dueDate = dueDate;
    if (repaymentType && ['one-time', 'emi'].includes(repaymentType)) {
      account.repaymentType = repaymentType;
    }

    if (amountGiven !== undefined && !isNaN(Number(amountGiven)) && Number(amountGiven) >= 0) {
      account.amountGiven = Number(amountGiven);
    }

    if (expectedReturn !== undefined && !isNaN(Number(expectedReturn)) && Number(expectedReturn) >= 0) {
      account.expectedReturn = Number(expectedReturn);
    }

    account.interestAmount = Math.max(0, (account.expectedReturn || 0) - (account.amountGiven || 0));
    account.outstanding = Math.max(0, Math.round(((account.expectedReturn || 0) - (account.totalReceived || 0)) * 100) / 100);

    if (account.outstanding <= 0) {
      account.status = 'completed';
    } else if (account.totalReceived > 0) {
      account.status = 'partial';
    } else if (status !== undefined) {
      account.status = status;
    }

    await account.save();

    await logAudit({
      adminId: req.admin._id,
      action: 'ACCOUNT_UPDATED',
      entityType: 'Account',
      entityId: account._id,
      description: `Updated account details for ${account.accountNumber}`,
      req
    });

    res.json({ success: true, account });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft Delete Account
// @route   DELETE /api/accounts/:id
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    account.isSoftDeleted = true;
    account.status = 'cancelled';
    await account.save();

    await logAudit({
      adminId: req.admin._id,
      action: 'ACCOUNT_CANCELLED',
      entityType: 'Account',
      entityId: account._id,
      description: `Soft deleted / cancelled account ${account.accountNumber}`,
      req
    });

    res.json({ success: true, message: 'Account cancelled successfully', account });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount
};
