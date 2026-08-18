import React, { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle, MessageSquare, Share2 } from 'lucide-react';
import Modal from '../components/common/Modal';
import api from '../services/api';

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Notification Modal
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [notifType, setNotifType] = useState('payment_received');
  const [customMsg, setCustomMsg] = useState('');
  const [sending, setSending] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications?limit=30');
      if (res.success) setNotifications(res.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    api.get('/people?limit=100').then((res) => {
      if (res.success) setPeople(res.people);
    });
  }, []);

  const handleSendSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPersonId) return;

    setSending(true);
    try {
      await api.post('/notifications/send', {
        personId: selectedPersonId,
        type: notifType,
        message: customMsg || null
      });
      setIsSendModalOpen(false);
      setCustomMsg('');
      fetchNotifications();
    } catch (err) {
      alert(err.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleDirectWhatsApp = () => {
    if (!selectedPersonId) {
      alert('Please select a borrower first');
      return;
    }
    const person = people.find((p) => p._id === selectedPersonId);
    const phone = person?.whatsappNumber || person?.mobile || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msgText = customMsg || `Hello ${person?.name || 'Borrower'},\n\nWe have received your payment amount. Thank you!`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msgText)}`, '_blank');
  };

  const handleResendWhatsApp = (notification) => {
    const phone = notification.recipientMobile || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(notification.message)}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Notifications Log & Dispatcher</h1>
          <p className="text-xs text-slate-400">WhatsApp and SMS message dispatch history & automated reminder logs</p>
        </div>

        <button
          onClick={() => setIsSendModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span>Send Reminder / Notice</span>
        </button>
      </div>

      {/* History Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white">Dispatched Notifications Log</h2>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div key={n._id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{n.personId?.name || 'Borrower'}</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase text-[10px]">
                    {n.type} ({n.channel})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">{new Date(n.sentAt).toLocaleString('en-IN')}</span>
                  <button
                    onClick={() => handleResendWhatsApp(n)}
                    className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold text-[10px] flex items-center gap-1 transition"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              <p className="text-slate-300 font-mono bg-slate-900 p-3 rounded-xl border border-slate-800/60 whitespace-pre-line">
                {n.message}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Recipient: {n.recipientMobile}</span>
                <span className="text-emerald-400 font-semibold">Status: Delivered (ID: {n.providerMessageId})</span>
              </div>
            </div>
          ))}

          {!loading && notifications.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-8">No notifications dispatched yet.</p>
          )}
        </div>
      </div>

      {/* Manual Send Modal */}
      <Modal isOpen={isSendModalOpen} onClose={() => setIsSendModalOpen(false)} title="Send Notification to Borrower" maxWidth="max-w-md">
        <form onSubmit={handleSendSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Borrower *</label>
            <select
              required
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
            >
              <option value="">-- Choose Borrower --</option>
              {people.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.mobile})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Notification Template / Type</label>
            <select
              value={notifType}
              onChange={(e) => setNotifType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
            >
              <option value="payment_received">Payment Received Notice</option>
              <option value="emi_reminder">EMI Reminder</option>
              <option value="due_reminder">Payment Due Today Notice</option>
              <option value="overdue">Overdue Payment Notice</option>
              <option value="account_completed">Account Settle Message</option>
              <option value="custom">Custom Message</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Custom Message Text (Optional)</label>
            <textarea
              rows="3"
              placeholder="e.g. Received your payment amount of ₹5000. Thank you!"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleDirectWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp Direct</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                {sending ? 'Sending...' : 'Send via Log'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NotificationsList;
