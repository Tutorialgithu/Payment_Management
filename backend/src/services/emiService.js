const EMI = require('../models/EMI');
const Account = require('../models/Account');

/**
 * Generate EMI Schedule for an account
 */
const generateEMISchedule = async (account) => {
  if (account.repaymentType !== 'emi') {
    return [];
  }

  // Remove previous unsaved EMIs for fresh initialization if any
  await EMI.deleteMany({ accountId: account._id });

  const totalReturn = Number(account.expectedReturn);
  let numberOfEmis = Number(account.numberOfEmis) || 1;
  let emiAmount = Number(account.emiAmount) || Math.round((totalReturn / numberOfEmis) * 100) / 100;

  if (emiAmount <= 0) {
    emiAmount = Math.round((totalReturn / numberOfEmis) * 100) / 100;
  } else if (!account.numberOfEmis || account.numberOfEmis <= 0) {
    numberOfEmis = Math.ceil(totalReturn / emiAmount);
  }

  const emis = [];
  let currentDate = new Date(account.startDate || account.dateGiven || Date.now());
  let runningTotal = 0;

  for (let i = 1; i <= numberOfEmis; i++) {
    let currentEmiAmount = emiAmount;

    // Adjust last EMI for rounding discrepancies
    if (i === numberOfEmis) {
      currentEmiAmount = Math.round((totalReturn - runningTotal) * 100) / 100;
    } else {
      runningTotal += currentEmiAmount;
    }

    if (currentEmiAmount < 0) currentEmiAmount = 0;

    const dueDate = new Date(currentDate);

    emis.push({
      accountId: account._id,
      personId: account.personId,
      emiNumber: i,
      dueDate,
      amount: currentEmiAmount,
      paidAmount: 0,
      remainingAmount: currentEmiAmount,
      status: 'upcoming'
    });

    // Advance date according to frequency
    switch (account.emiFrequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
      default:
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  const createdEmis = await EMI.insertMany(emis);

  // Set account's dueDate to last EMI date
  if (createdEmis.length > 0) {
    account.dueDate = createdEmis[createdEmis.length - 1].dueDate;
    await account.save();
  }

  return createdEmis;
};

/**
 * Recalculate EMI statuses based on current date
 */
const updateEMISchedulesStatus = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  // 1. Due Today
  await EMI.updateMany(
    {
      status: 'upcoming',
      dueDate: { $gte: today, $lte: endOfToday }
    },
    { status: 'due_today' }
  );

  // 2. Overdue
  await EMI.updateMany(
    {
      status: { $in: ['upcoming', 'due_today', 'partial'] },
      dueDate: { $lt: today },
      remainingAmount: { $gt: 0 }
    },
    { status: 'overdue' }
  );
};

/**
 * Allocate payment against account EMIs
 */
const allocatePaymentToEMIs = async (account, paymentAmount, targetEmiId = null, paymentDate = null) => {
  let unallocated = Number(paymentAmount);
  const allocations = [];
  const actualPaidDate = paymentDate ? new Date(paymentDate) : new Date();

  // Fetch all active EMIs for account sorted by dueDate
  let emis = await EMI.find({ accountId: account._id }).sort({ dueDate: 1, emiNumber: 1 });

  if (emis.length === 0) {
    return { allocations, remainingUnallocated: unallocated };
  }

  // If targeted specific EMI first (Manual Allocation)
  if (targetEmiId) {
    const targetEmiIndex = emis.findIndex((e) => e._id.toString() === targetEmiId.toString());
    if (targetEmiIndex !== -1) {
      const targetEmi = emis[targetEmiIndex];
      if (targetEmi.remainingAmount > 0) {
        const allocate = Math.min(unallocated, targetEmi.remainingAmount);
        targetEmi.paidAmount += allocate;
        targetEmi.remainingAmount = Math.round((targetEmi.amount - targetEmi.paidAmount) * 100) / 100;

        if (targetEmi.remainingAmount <= 0) {
          targetEmi.remainingAmount = 0;
          targetEmi.status = 'paid';
        } else {
          targetEmi.status = 'partial';
        }
        targetEmi.paidDate = actualPaidDate;
        await targetEmi.save();

        unallocated -= allocate;
        allocations.push({ emiId: targetEmi._id, amountAllocated: allocate });
      }
    }
  }

  // Auto Allocate remaining unallocated amount to oldest pending/partial/overdue EMIs
  for (let emi of emis) {
    if (unallocated <= 0) break;
    if (emi.remainingAmount <= 0) continue;

    const allocate = Math.min(unallocated, emi.remainingAmount);
    emi.paidAmount = Math.round((emi.paidAmount + allocate) * 100) / 100;
    emi.remainingAmount = Math.round((emi.amount - emi.paidAmount) * 100) / 100;

    if (emi.remainingAmount <= 0) {
      emi.remainingAmount = 0;
      emi.status = 'paid';
    } else {
      emi.status = 'partial';
    }
    emi.paidDate = actualPaidDate;
    await emi.save();

    unallocated -= allocate;
    allocations.push({ emiId: emi._id, amountAllocated: allocate });
  }

  // Re-eval account totals
  account.totalReceived = Math.round((account.totalReceived + paymentAmount) * 100) / 100;
  account.outstanding = Math.round((account.expectedReturn - account.totalReceived) * 100) / 100;

  if (account.outstanding <= 0) {
    account.outstanding = 0;
    account.status = 'completed';
  } else {
    // Check if any EMI is overdue
    const overdueCount = await EMI.countDocuments({ accountId: account._id, status: 'overdue' });
    if (overdueCount > 0) {
      account.status = 'overdue';
    } else if (account.totalReceived > 0) {
      account.status = 'partial';
    } else {
      account.status = 'active';
    }
  }

  await account.save();

  return { allocations, remainingUnallocated: unallocated };
};

module.exports = {
  generateEMISchedule,
  updateEMISchedulesStatus,
  allocatePaymentToEMIs
};
