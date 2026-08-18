const Person = require('../models/Person');
const Account = require('../models/Account');
const Payment = require('../models/Payment');
const EMI = require('../models/EMI');
const Notification = require('../models/Notification');
const { logAudit } = require('../models/auditLogger');

// @desc    Get all people with financial summaries
// @route   GET /api/people
// @access  Private
const getPeople = async (req, res, next) => {
  try {
    const { search, status = 'active', page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let query = {};
    if (status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const total = await Person.countDocuments(query);
    const peopleList = await Person.find(query).sort(sort).skip(skip).limit(Number(limit));

    // Aggregate stats for each person across their separate accounts
    const peopleWithStats = await Promise.all(
      peopleList.map(async (person) => {
        const accounts = await Account.find({ personId: person._id, isSoftDeleted: false });
        
        let totalGiven = 0;
        let expectedReturn = 0;
        let totalReceived = 0;
        let outstanding = 0;
        let overdue = 0;
        let activeAccountsCount = 0;

        for (let acc of accounts) {
          totalGiven += Number(acc.amountGiven) || 0;
          expectedReturn += Number(acc.expectedReturn) || 0;
          totalReceived += Number(acc.totalReceived) || 0;
          outstanding += Number(acc.outstanding) || 0;

          if (acc.status === 'overdue') {
            overdue += Number(acc.outstanding) || 0;
          }
          if (acc.status === 'active' || acc.status === 'partial' || acc.status === 'overdue') {
            activeAccountsCount++;
          }
        }

        return {
          ...person.toObject(),
          totalGiven,
          expectedReturn,
          totalReceived,
          outstanding,
          overdue,
          activeAccountsCount,
          totalAccountsCount: accounts.length
        };
      })
    );

    res.json({
      success: true,
      count: peopleWithStats.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      people: peopleWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single Person detailed financial profile
// @route   GET /api/people/:id
// @access  Private
const getPersonById = async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ success: false, message: 'Person not found' });
    }

    // Accounts
    const accounts = await Account.find({ personId: person._id, isSoftDeleted: false }).sort({ createdAt: -1 });

    // Auto-sync and aggregate metrics for each account
    let totalGiven = 0;
    let expectedReturn = 0;
    let totalReceived = 0;
    let outstanding = 0;
    let overdue = 0;

    for (let acc of accounts) {
      const accPayments = await Payment.find({ accountId: acc._id });
      const actualReceived = Math.round(accPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) * 100) / 100;
      const actualOutstanding = Math.max(0, Math.round((acc.expectedReturn - actualReceived) * 100) / 100);

      if (acc.totalReceived !== actualReceived || acc.outstanding !== actualOutstanding) {
        acc.totalReceived = actualReceived;
        acc.outstanding = actualOutstanding;
        if (acc.outstanding <= 0) {
          acc.status = 'completed';
        } else if (acc.totalReceived > 0) {
          acc.status = 'partial';
        } else {
          acc.status = 'active';
        }
        await acc.save();
      }

      totalGiven += Number(acc.amountGiven) || 0;
      expectedReturn += Number(acc.expectedReturn) || 0;
      totalReceived += actualReceived;
      outstanding += actualOutstanding;
      if (acc.status === 'overdue') {
        overdue += actualOutstanding;
      }
    }

    // Payments
    const payments = await Payment.find({ personId: person._id }).populate('accountId', 'accountNumber purpose').sort({ paymentDate: -1 });

    // EMI Schedule across all accounts
    const emis = await EMI.find({ personId: person._id }).populate('accountId', 'accountNumber purpose').sort({ dueDate: 1 });

    // Notifications
    const notifications = await Notification.find({ personId: person._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      person,
      summary: {
        totalAccounts: accounts.length,
        totalGiven,
        expectedReturn,
        totalReceived,
        outstanding,
        overdue
      },
      accounts,
      payments,
      emis,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Person
// @route   POST /api/people
// @access  Private
const createPerson = async (req, res, next) => {
  try {
    const { name, mobile } = req.body;
    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: 'Full name and mobile number are required' });
    }

    const person = await Person.create(req.body);

    await logAudit({
      adminId: req.admin._id,
      action: 'PERSON_CREATED',
      entityType: 'Person',
      entityId: person._id,
      description: `Added new borrower: ${person.name} (${person.mobile})`,
      req
    });

    res.status(201).json({ success: true, person });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Person
// @route   PUT /api/people/:id
// @access  Private
const updatePerson = async (req, res, next) => {
  try {
    let person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ success: false, message: 'Person not found' });
    }

    person = await Person.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await logAudit({
      adminId: req.admin._id,
      action: 'PERSON_UPDATED',
      entityType: 'Person',
      entityId: person._id,
      description: `Updated profile for: ${person.name}`,
      req
    });

    res.json({ success: true, person });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive / Soft Delete Person
// @route   DELETE /api/people/:id
// @access  Private
const deletePerson = async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ success: false, message: 'Person not found' });
    }

    person.status = 'archived';
    await person.save();

    await logAudit({
      adminId: req.admin._id,
      action: 'PERSON_ARCHIVED',
      entityType: 'Person',
      entityId: person._id,
      description: `Archived person record: ${person.name}`,
      req
    });

    res.json({ success: true, message: 'Person archived successfully', person });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson
};
