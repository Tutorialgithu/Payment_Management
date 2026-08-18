const EMI = require('../models/EMI');
const Account = require('../models/Account');

// @desc    Get EMI schedule for account
// @route   GET /api/accounts/:id/emi
// @access  Private
const getEMIScheduleByAccount = async (req, res, next) => {
  try {
    const emis = await EMI.find({ accountId: req.params.id }).sort({ emiNumber: 1 });
    res.json({ success: true, emis });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming EMIs
// @route   GET /api/emi/upcoming
// @access  Private
const getUpcomingEMIs = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const emis = await EMI.find({
      dueDate: { $gte: today },
      status: { $in: ['upcoming', 'due_today'] }
    })
      .populate('personId', 'name mobile email')
      .populate('accountId', 'accountNumber purpose repaymentType')
      .sort({ dueDate: 1 })
      .limit(50);

    res.json({ success: true, count: emis.length, emis });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue EMIs
// @route   GET /api/emi/overdue
// @access  Private
const getOverdueEMIs = async (req, res, next) => {
  try {
    const emis = await EMI.find({ status: 'overdue' })
      .populate('personId', 'name mobile email')
      .populate('accountId', 'accountNumber purpose repaymentType')
      .sort({ dueDate: 1 });

    res.json({ success: true, count: emis.length, emis });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEMIScheduleByAccount,
  getUpcomingEMIs,
  getOverdueEMIs
};
