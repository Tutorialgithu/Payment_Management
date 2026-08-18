const cron = require('node-cron');
const EMI = require('../models/EMI');
const Account = require('../models/Account');
const Admin = require('../models/Admin');
const { updateEMISchedulesStatus } = require('./emiService');
const { sendNotification } = require('./notificationService');

const initCronJobs = () => {
  // Run daily at 09:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron Job]: Starting Daily EMI & Due Date Status Update...');
    try {
      // 1. Update EMI statuses
      await updateEMISchedulesStatus();

      const admin = await Admin.findOne();
      const settings = admin?.notificationSettings || {};

      if (!settings.sendEmiReminder && !settings.sendDueReminder && !settings.sendOverdueReminder) {
        console.log('[Cron Job]: Notifications are disabled in settings.');
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Reminder days before
      const daysBefore = settings.reminderDaysBefore || 3;
      const targetReminderDate = new Date(today);
      targetReminderDate.setDate(targetReminderDate.getDate() + daysBefore);
      targetReminderDate.setHours(23, 59, 59, 999);

      const reminderStart = new Date(today);
      reminderStart.setDate(reminderStart.getDate() + daysBefore);
      reminderStart.setHours(0, 0, 0, 0);

      // Send EMI Reminders (X days before due)
      if (settings.sendEmiReminder) {
        const upcomingEmis = await EMI.find({
          status: 'upcoming',
          dueDate: { $gte: reminderStart, $lte: targetReminderDate }
        }).populate('personId accountId');

        for (let emi of upcomingEmis) {
          if (emi.personId && emi.accountId) {
            await sendNotification({
              person: emi.personId,
              account: emi.accountId,
              type: 'emi_reminder'
            });
          }
        }
      }

      // Send Due Reminders (Due today)
      if (settings.sendDueReminder) {
        const dueTodayEmis = await EMI.find({ status: 'due_today' }).populate('personId accountId');
        for (let emi of dueTodayEmis) {
          if (emi.personId && emi.accountId) {
            await sendNotification({
              person: emi.personId,
              account: emi.accountId,
              type: 'due_reminder'
            });
          }
        }
      }

      // Send Overdue Reminders
      if (settings.sendOverdueReminder) {
        const overdueAccounts = await Account.find({ status: 'overdue' }).populate('personId');
        for (let account of overdueAccounts) {
          if (account.personId) {
            await sendNotification({
              person: account.personId,
              account,
              type: 'overdue'
            });
          }
        }
      }

      console.log('[Cron Job]: Daily Notification Sweep Completed Successfully.');
    } catch (err) {
      console.error('[Cron Job Error]:', err.message);
    }
  });

  console.log('[Cron Service]: Background Reminder Scheduler Initialized.');
};

module.exports = { initCronJobs };
