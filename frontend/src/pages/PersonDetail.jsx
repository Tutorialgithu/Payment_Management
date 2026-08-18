import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Plus,
  CreditCard,
  Send,
  ArrowLeft,
  Wallet,
  Calendar,
  Bell,
  Clock
} from 'lucide-react';
import Badge from '../components/common/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PersonDetail = ({ onOpenReceivePaymentForPerson, onOpenAddAccountForPerson }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useAuth();

  const [personData, setPersonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchPersonProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/people/${id}`);
      if (res.success) {
        setPersonData(res);
      }
    } catch (err) {
      console.error('Error fetching person profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonProfile();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading borrower financial profile...</div>;
  }

  if (!personData || !personData.person) {
    return <div className="p-8 text-center text-rose-400">Borrower record not found.</div>;
  }

  const { person, summary, accounts = [], payments = [], emis = [], notifications = [] } = personData;
  const symbol = admin?.currencySymbol || '₹';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'accounts', label: `Accounts (${accounts.length})` },
    { id: 'payments', label: `Payments (${payments.length})` },
    { id: 'emi', label: `EMI Schedule (${emis.length})` },
    { id: 'notifications', label: `Notifications (${notifications.length})` },
    { id: 'notes', label: 'Notes' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation Back Button */}
      <button
        onClick={() => navigate('/people')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to People Directory</span>
      </button>

      {/* Profile Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-xl shrink-0">
            {person.name.charAt(0)}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-white">{person.name}</h1>
              <Badge status={person.status} />
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                {person.mobile}
              </span>

              {person.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  {person.email}
                </span>
              )}

              {person.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {person.city}, {person.state}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenReceivePaymentForPerson?.(person._id)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span>Receive Payment</span>
          </button>

          <button
            onClick={() => onOpenAddAccountForPerson?.(person._id)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Loan Account</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Accounts</span>
          <p className="text-xl font-extrabold text-white mt-1">{summary.totalAccounts}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Given</span>
          <p className="text-xl font-extrabold text-blue-400 mt-1">{symbol}{summary.totalGiven?.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400">Expected Return</span>
          <p className="text-xl font-extrabold text-purple-400 mt-1">{symbol}{summary.expectedReturn?.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Received</span>
          <p className="text-xl font-extrabold text-emerald-400 mt-1">{symbol}{summary.totalReceived?.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400">Outstanding</span>
          <p className="text-xl font-extrabold text-amber-400 mt-1">{symbol}{summary.outstanding?.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] uppercase font-bold text-slate-400">Overdue</span>
          <p className="text-xl font-extrabold text-rose-400 mt-1">{symbol}{summary.overdue?.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 font-semibold text-xs transition border-b-2 whitespace-nowrap ${
              activeTab === t.id
                ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-sm font-bold text-white mb-4">Active Loans & Accounts Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map((acc) => (
                  <div key={acc._id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">{acc.accountNumber}</span>
                      <Badge status={acc.status} />
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <p>Purpose: <span className="text-white font-medium">{acc.purpose || 'General Loan'}</span></p>
                      <p>Repayment: <span className="text-blue-400 font-bold uppercase">{acc.repaymentType}</span></p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400">Given</span>
                        <p className="font-bold text-white">{symbol}{acc.amountGiven?.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Received</span>
                        <p className="font-bold text-emerald-400">{symbol}{acc.totalReceived?.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Remaining</span>
                        <p className="font-bold text-rose-400">{symbol}{acc.outstanding?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNTS TAB */}
        {activeTab === 'accounts' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white">All Accounts ({accounts.length})</h2>
              <button
                onClick={() => onOpenAddAccountForPerson?.(person._id)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                + Add Loan Account
              </button>
            </div>

            <div className="divide-y divide-slate-800">
              {accounts.map((acc) => (
                <div key={acc._id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{acc.accountNumber}</span>
                      <Badge status={acc.status} />
                    </div>
                    <p className="text-slate-400 mt-1">
                      Given Date: {new Date(acc.dateGiven).toLocaleDateString()} | Due: {new Date(acc.dueDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-6 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400">Expected</span>
                      <p className="font-bold text-white">{symbol}{acc.expectedReturn?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Received</span>
                      <p className="font-bold text-emerald-400">{symbol}{acc.totalReceived?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Outstanding</span>
                      <p className="font-bold text-rose-400">{symbol}{acc.outstanding?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-sm font-bold text-white mb-4">Payment Ledger History</h2>
            <div className="divide-y divide-slate-800">
              {payments.map((p) => (
                <div key={p._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-400">{p.receiptNumber}</span>
                    <p className="text-slate-400">
                      {new Date(p.paymentDate).toLocaleDateString()} • {p.paymentMethod.toUpperCase()} {p.transactionId ? `(${p.transactionId})` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-400">
                      +{symbol}{p.amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}

              {payments.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">No payments recorded for this borrower yet.</p>
              )}
            </div>
          </div>
        )}

        {/* EMI SCHEDULE TAB */}
        {activeTab === 'emi' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-sm font-bold text-white mb-4">EMI Installments Schedule</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">EMI #</th>
                    <th className="p-3">Account</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Paid</th>
                    <th className="p-3">Remaining</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {emis.map((e) => (
                    <tr key={e._id}>
                      <td className="p-3 font-bold text-white">#{e.emiNumber}</td>
                      <td className="p-3 text-slate-400">{e.accountId?.accountNumber || 'Account'}</td>
                      <td className="p-3">{new Date(e.dueDate).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold text-slate-200">{symbol}{e.amount?.toLocaleString()}</td>
                      <td className="p-3 font-bold text-emerald-400">{symbol}{e.paidAmount?.toLocaleString()}</td>
                      <td className="p-3 font-bold text-rose-400">{symbol}{e.remainingAmount?.toLocaleString()}</td>
                      <td className="p-3"><Badge status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-sm font-bold text-white mb-4">Sent Notifications Log</h2>
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n._id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-blue-400 uppercase">{n.type} via {n.channel}</span>
                    <span className="text-[10px] text-slate-500">{new Date(n.sentAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-300 font-mono whitespace-pre-line">{n.message}</p>
                </div>
              ))}

              {notifications.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">No notifications sent yet.</p>
              )}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-xs space-y-4">
            <h2 className="text-sm font-bold text-white">Admin Remarks & Notes</h2>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300">
              {person.notes || 'No remarks added for this borrower.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonDetail;
