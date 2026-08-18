const Account = require('../models/Account');
const Person = require('../models/Person');
const Payment = require('../models/Payment');
const EMI = require('../models/EMI');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// @desc    Get dashboard metrics, charts, and activity feeds
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Overall Aggregations
    const allAccounts = await Account.find({ isSoftDeleted: false });

    let totalGiven = 0;
    let expectedReturn = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    let activeAccountsCount = 0;
    let completedAccountsCount = 0;

    for (let acc of allAccounts) {
      totalGiven += Number(acc.amountGiven) || 0;
      expectedReturn += Number(acc.expectedReturn) || 0;
      totalReceived += Number(acc.totalReceived) || 0;
      totalOutstanding += Number(acc.outstanding) || 0;

      if (acc.status === 'overdue') {
        totalOverdue += Number(acc.outstanding) || 0;
      }
      if (acc.status === 'completed') {
        completedAccountsCount++;
      } else if (acc.status !== 'cancelled') {
        activeAccountsCount++;
      }
    }

    const totalPeople = await Person.countDocuments({ status: 'active' });

    // 2. Today's Due & Upcoming
    const todaysDueEMIs = await EMI.find({
      dueDate: { $gte: today, $lte: endOfToday },
      remainingAmount: { $gt: 0 }
    }).populate('personId accountId');

    const todaysDueTotal = todaysDueEMIs.reduce((sum, e) => sum + e.remainingAmount, 0);

    const upcomingPayments = await EMI.find({
      dueDate: { $gt: endOfToday },
      status: 'upcoming'
    })
      .populate('personId accountId')
      .sort({ dueDate: 1 })
      .limit(5);

    // 3. Payment Status Breakdown Chart Data
    const emiStatusCounts = {
      paid: await EMI.countDocuments({ status: 'paid' }),
      pending: await EMI.countDocuments({ status: { $in: ['upcoming', 'due_today'] } }),
      partial: await EMI.countDocuments({ status: 'partial' }),
      overdue: await EMI.countDocuments({ status: 'overdue' })
    };

    // 4. Monthly Collection Trends (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentPayments = await Payment.find({
      paymentDate: { $gte: sixMonthsAgo }
    });

    const monthlyMap = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo);
      d.setMonth(d.getMonth() + i);
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthlyMap[label] = { month: label, amountGiven: 0, amountReceived: 0, outstanding: 0 };
    }

    recentPayments.forEach((p) => {
      const label = new Date(p.paymentDate).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyMap[label]) {
        monthlyMap[label].amountReceived += p.amount;
      }
    });

    // Populate given amounts into monthly map
    const recentAccounts = await Account.find({ dateGiven: { $gte: sixMonthsAgo }, isSoftDeleted: false });
    recentAccounts.forEach((acc) => {
      const label = new Date(acc.dateGiven).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyMap[label]) {
        monthlyMap[label].amountGiven += acc.amountGiven;
      }
    });

    const monthlyCollectionChart = Object.values(monthlyMap);

    // 5. Highest Outstanding by Person
    const peopleList = await Person.find({ status: 'active' });
    const outstandingByPerson = await Promise.all(
      peopleList.map(async (person) => {
        const accs = await Account.find({ personId: person._id, isSoftDeleted: false });
        const sumOutstanding = accs.reduce((acc, a) => acc + a.outstanding, 0);
        return {
          name: person.name,
          mobile: person.mobile,
          outstanding: sumOutstanding
        };
      })
    );

    outstandingByPerson.sort((a, b) => b.outstanding - a.outstanding);
    const topOutstandingPeople = outstandingByPerson.slice(0, 5);

    // 6. Recent Activity Feed
    const recentActivities = await AuditLog.find().sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      kpis: {
        totalPeople,
        activeAccountsCount,
        completedAccountsCount,
        totalGiven,
        expectedReturn,
        totalReceived,
        totalOutstanding,
        totalOverdue,
        todaysDueCount: todaysDueEMIs.length,
        todaysDueTotal
      },
      charts: {
        paymentStatusBreakdown: emiStatusCounts,
        monthlyCollectionChart,
        topOutstandingPeople
      },
      upcomingPayments,
      recentActivities
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardData };
