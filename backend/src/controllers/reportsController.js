const Account = require('../models/Account');
const Payment = require('../models/Payment');
const EMI = require('../models/EMI');
const Person = require('../models/Person');
const { exportToExcel, exportToCSV } = require('../services/exportService');

// @desc    Get Collection Report
// @route   GET /api/reports/collection
// @access  Private
const getCollectionReport = async (req, res, next) => {
  try {
    const { format } = req.query;
    const accounts = await Account.find({ isSoftDeleted: false }).populate('personId', 'name mobile email');

    const data = accounts.map((acc) => ({
      'Account Number': acc.accountNumber,
      'Borrower Name': acc.personId ? acc.personId.name : 'N/A',
      'Mobile': acc.personId ? acc.personId.mobile : 'N/A',
      'Repayment Type': acc.repaymentType.toUpperCase(),
      'Amount Given (INR)': acc.amountGiven,
      'Expected Return (INR)': acc.expectedReturn,
      'Total Received (INR)': acc.totalReceived,
      'Outstanding (INR)': acc.outstanding,
      'Status': acc.status.toUpperCase(),
      'Date Given': new Date(acc.dateGiven).toLocaleDateString('en-IN')
    }));

    if (format === 'excel') {
      const buffer = exportToExcel(data, 'Collection Report');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=Collection_Report.xlsx');
      return res.send(buffer);
    }

    if (format === 'csv') {
      const csv = exportToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=Collection_Report.csv');
      return res.send(csv);
    }

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Overdue Report
// @route   GET /api/reports/overdue
// @access  Private
const getOverdueReport = async (req, res, next) => {
  try {
    const { format } = req.query;
    const today = new Date();

    const overdueAccounts = await Account.find({ status: 'overdue', isSoftDeleted: false }).populate('personId', 'name mobile email');

    const data = overdueAccounts.map((acc) => {
      const dueDate = new Date(acc.dueDate);
      const diffTime = Math.abs(today - dueDate);
      const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        'Account Number': acc.accountNumber,
        'Borrower Name': acc.personId ? acc.personId.name : 'N/A',
        'Mobile': acc.personId ? acc.personId.mobile : 'N/A',
        'Due Date': dueDate.toLocaleDateString('en-IN'),
        'Overdue Days': overdueDays,
        'Expected Return (INR)': acc.expectedReturn,
        'Received (INR)': acc.totalReceived,
        'Outstanding Overdue (INR)': acc.outstanding
      };
    });

    if (format === 'excel') {
      const buffer = exportToExcel(data, 'Overdue Report');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=Overdue_Report.xlsx');
      return res.send(buffer);
    }

    if (format === 'csv') {
      const csv = exportToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=Overdue_Report.csv');
      return res.send(csv);
    }

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get EMI Report
// @route   GET /api/reports/emi
// @access  Private
const getEMIReport = async (req, res, next) => {
  try {
    const { status, format } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;

    const emis = await EMI.find(query).populate('personId', 'name mobile').populate('accountId', 'accountNumber purpose');

    const data = emis.map((e) => ({
      'Account Number': e.accountId ? e.accountId.accountNumber : 'N/A',
      'Borrower Name': e.personId ? e.personId.name : 'N/A',
      'Mobile': e.personId ? e.personId.mobile : 'N/A',
      'EMI #': e.emiNumber,
      'Due Date': new Date(e.dueDate).toLocaleDateString('en-IN'),
      'EMI Amount (INR)': e.amount,
      'Paid Amount (INR)': e.paidAmount,
      'Remaining (INR)': e.remainingAmount,
      'Status': e.status.toUpperCase(),
      'Paid Date': e.paidDate ? new Date(e.paidDate).toLocaleDateString('en-IN') : '-'
    }));

    if (format === 'excel') {
      const buffer = exportToExcel(data, 'EMI Report');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=EMI_Report.xlsx');
      return res.send(buffer);
    }

    if (format === 'csv') {
      const csv = exportToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=EMI_Report.csv');
      return res.send(csv);
    }

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Date-Wise Collection Report
// @route   GET /api/reports/date-wise
// @access  Private
const getDateWiseReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const payments = await Payment.find({
      paymentDate: { $gte: start, $lte: end }
    })
      .populate('personId', 'name mobile')
      .populate('accountId', 'accountNumber purpose')
      .sort({ paymentDate: -1 });

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    const data = payments.map((p) => ({
      'Receipt No.': p.receiptNumber,
      'Payment Date': new Date(p.paymentDate).toLocaleDateString('en-IN'),
      'Borrower Name': p.personId ? p.personId.name : 'N/A',
      'Account Number': p.accountId ? p.accountId.accountNumber : 'N/A',
      'Amount Received (INR)': p.amount,
      'Payment Method': p.paymentMethod.toUpperCase(),
      'Transaction ID': p.transactionId || '-',
      'Notes': p.notes || ''
    }));

    if (format === 'excel') {
      const buffer = exportToExcel(data, 'Date-Wise Report');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=DateWise_Report.xlsx');
      return res.send(buffer);
    }

    if (format === 'csv') {
      const csv = exportToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=DateWise_Report.csv');
      return res.send(csv);
    }

    res.json({
      success: true,
      startDate: start,
      endDate: end,
      totalCollected,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCollectionReport,
  getOverdueReport,
  getEMIReport,
  getDateWiseReport
};
