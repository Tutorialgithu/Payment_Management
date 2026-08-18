const Notification = require('../models/Notification');
const Admin = require('../models/Admin');

/**
 * Send and log notification (WhatsApp / SMS)
 */
const sendNotification = async ({
  person,
  account = null,
  payment = null,
  type,
  customMessage = null
}) => {
  try {
    const admin = await Admin.findOne();
    const settings = admin?.notificationSettings || {};
    const symbol = admin?.currencySymbol || '₹';

    let message = customMessage;

    if (!message) {
      switch (type) {
        case 'payment_received':
          message = `Payment Received\n\nHello ${person.name},\n\nYour payment of ${symbol}${payment?.amount?.toLocaleString('en-IN')} has been received successfully.\n\nTotal Received: ${symbol}${account?.totalReceived?.toLocaleString('en-IN')}\nRemaining Outstanding: ${symbol}${account?.outstanding?.toLocaleString('en-IN')}\n\nThank you!`;
          break;
        case 'emi_reminder':
          message = `EMI Reminder\n\nHello ${person.name},\n\nYour EMI of ${symbol}${account?.emiAmount?.toLocaleString('en-IN')} for Account #${account?.accountNumber} is due on ${new Date(account?.dueDate).toLocaleDateString('en-IN')}.\n\nPlease make your payment on or before the due date.`;
          break;
        case 'due_reminder':
          message = `Payment Due Today\n\nHello ${person.name},\n\nYour payment of ${symbol}${account?.emiAmount || account?.outstanding} is due today (${new Date().toLocaleDateString('en-IN')}).\n\nPlease settle your payment.`;
          break;
        case 'overdue':
          message = `Payment Overdue Notice\n\nHello ${person.name},\n\nYour payment for Account #${account?.accountNumber} is currently OVERDUE.\nOutstanding Amount: ${symbol}${account?.outstanding?.toLocaleString('en-IN')}.\n\nPlease contact us immediately to complete your payment.`;
          break;
        case 'account_completed':
          message = `Account Fully Settled!\n\nHello ${person.name},\n\nCongratulations! Your account #${account?.accountNumber} is now fully paid and settled.\n\nTotal Paid: ${symbol}${account?.expectedReturn?.toLocaleString('en-IN')}.\n\nThank you for your trust!`;
          break;
        default:
          message = `Hello ${person.name}, this is a notification from ${admin?.businessName || 'Lending Tracker'}.`;
      }
    }

    const channel = settings.whatsappEnabled ? 'whatsapp' : settings.smsEnabled ? 'sms' : 'whatsapp';
    const recipientMobile = person.whatsappNumber || person.mobile;

    // Create Notification document
    const notification = await Notification.create({
      personId: person._id,
      accountId: account?._id || null,
      paymentId: payment?._id || null,
      type,
      channel,
      recipientMobile,
      message,
      status: 'sent',
      providerMessageId: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sentAt: new Date(),
      providerResponse: { success: true, channel, simulated: true }
    });

    console.log(`[Notification Dispatcher] Sent ${type} via ${channel} to ${person.name} (${recipientMobile})`);
    return notification;
  } catch (error) {
    console.error('[Notification Service Error]:', error.message);
    return null;
  }
};

module.exports = { sendNotification };
