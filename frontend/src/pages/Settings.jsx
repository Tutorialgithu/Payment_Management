import React, { useState, useEffect } from 'react';
import { User, Lock, Building, Bell, Receipt, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { admin, updateAdminState } = useAuth();

  const [activeSection, setActiveSection] = useState('business');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [profileForm, setProfileForm] = useState({
    name: admin?.name || '',
    mobile: admin?.mobile || '',
    businessName: admin?.businessName || '',
    businessAddress: admin?.businessAddress || '',
    businessPhone: admin?.businessPhone || '',
    currencySymbol: admin?.currencySymbol || '₹',
    receiptPrefix: admin?.receiptPrefix || 'REC-',
    receiptFooterText: admin?.receiptFooterText || 'Thank you for your timely payment!'
  });

  // Password Form State
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification Settings State
  const [notifForm, setNotifForm] = useState(
    admin?.notificationSettings || {
      sendPaymentReceived: true,
      sendEmiReminder: true,
      sendDueReminder: true,
      sendOverdueReminder: true,
      sendAccountCompleted: true,
      reminderDaysBefore: 3,
      whatsappEnabled: true,
      smsEnabled: false,
      whatsappApiKey: '',
      smsApiKey: ''
    }
  );

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.put('/settings', {
        ...profileForm,
        notificationSettings: notifForm
      });

      if (res.success) {
        setSuccessMsg('Settings updated successfully!');
        updateAdminState(res.settings);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (passForm.newPassword !== passForm.confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });

      if (res.success) {
        setSuccessMsg('Password changed successfully!');
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Admin System Settings</h1>
        <p className="text-xs text-slate-400">Configure business information, security credentials, receipt styling, and notification channels</p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveSection('business')}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition ${
            activeSection === 'business' ? 'border-blue-500 text-blue-400 bg-slate-900/40' : 'border-transparent text-slate-400'
          }`}
        >
          Business & Receipt
        </button>

        <button
          onClick={() => setActiveSection('security')}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition ${
            activeSection === 'security' ? 'border-blue-500 text-blue-400 bg-slate-900/40' : 'border-transparent text-slate-400'
          }`}
        >
          Security & Password
        </button>

        <button
          onClick={() => setActiveSection('notification')}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition ${
            activeSection === 'notification' ? 'border-blue-500 text-blue-400 bg-slate-900/40' : 'border-transparent text-slate-400'
          }`}
        >
          Notifications & WhatsApp
        </button>
      </div>

      {/* BUSINESS & RECEIPT SETTINGS */}
      {activeSection === 'business' && (
        <form onSubmit={handleUpdateSettings} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 text-xs">
          <h2 className="text-sm font-bold text-white">Business Details & Receipt Header</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Admin Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Admin Mobile</label>
              <input
                type="text"
                value={profileForm.mobile}
                onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Business / Firm Name</label>
              <input
                type="text"
                value={profileForm.businessName}
                onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Currency Symbol</label>
              <input
                type="text"
                value={profileForm.currencySymbol}
                onChange={(e) => setProfileForm({ ...profileForm, currencySymbol: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Business Address</label>
            <input
              type="text"
              value={profileForm.businessAddress}
              onChange={(e) => setProfileForm({ ...profileForm, businessAddress: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Receipt Prefix</label>
              <input
                type="text"
                value={profileForm.receiptPrefix}
                onChange={(e) => setProfileForm({ ...profileForm, receiptPrefix: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Receipt Footer Note</label>
              <input
                type="text"
                value={profileForm.receiptFooterText}
                onChange={(e) => setProfileForm({ ...profileForm, receiptFooterText: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-900/30"
            >
              {loading ? 'Saving...' : 'Save Business Settings'}
            </button>
          </div>
        </form>
      )}

      {/* SECURITY SETTINGS */}
      {activeSection === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-xs">
          <h2 className="text-sm font-bold text-white">Change Admin Security Password</h2>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={passForm.currentPassword}
              onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">New Password *</label>
              <input
                type="password"
                required
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition shadow-lg shadow-purple-900/30"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}

      {/* NOTIFICATION SETTINGS */}
      {activeSection === 'notification' && (
        <form onSubmit={handleUpdateSettings} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 text-xs">
          <h2 className="text-sm font-bold text-white">Automated Reminders & Messaging Gateways</h2>

          <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifForm.sendPaymentReceived}
                onChange={(e) => setNotifForm({ ...notifForm, sendPaymentReceived: e.target.checked })}
                className="rounded accent-blue-600"
              />
              <span className="font-semibold text-white">Send Payment Received Receipt Message</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifForm.sendEmiReminder}
                onChange={(e) => setNotifForm({ ...notifForm, sendEmiReminder: e.target.checked })}
                className="rounded accent-blue-600"
              />
              <span className="font-semibold text-white">Send EMI Reminder Before Due Date</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifForm.sendDueReminder}
                onChange={(e) => setNotifForm({ ...notifForm, sendDueReminder: e.target.checked })}
                className="rounded accent-blue-600"
              />
              <span className="font-semibold text-white">Send Due Date Today Notice</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifForm.sendOverdueReminder}
                onChange={(e) => setNotifForm({ ...notifForm, sendOverdueReminder: e.target.checked })}
                className="rounded accent-blue-600"
              />
              <span className="font-semibold text-white">Send Overdue Notice</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Reminder Days Before Due Date</label>
              <input
                type="number"
                value={notifForm.reminderDaysBefore}
                onChange={(e) => setNotifForm({ ...notifForm, reminderDaysBefore: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition"
            >
              {loading ? 'Saving...' : 'Save Notification Rules'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Settings;
