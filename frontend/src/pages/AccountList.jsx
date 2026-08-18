import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Wallet, Eye, Trash2, CreditCard } from 'lucide-react';
import Badge from '../components/common/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AccountList = ({ onOpenReceivePaymentForAccount }) => {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const symbol = admin?.currencySymbol || '₹';

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [repaymentType, setRepaymentType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/accounts?search=${encodeURIComponent(search)}&status=${status}&repaymentType=${repaymentType}&page=${page}&limit=10`
      );
      if (res.success) {
        setAccounts(res.accounts);
        setTotalPages(res.pages);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [search, status, repaymentType, page]);

  const handleCancelAccount = async (id, num) => {
    if (window.confirm(`Are you sure you want to cancel account ${num}?`)) {
      try {
        await api.delete(`/accounts/${id}`);
        fetchAccounts();
      } catch (err) {
        alert(err.message || 'Failed to cancel account');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Loan Accounts Ledger</h1>
          <p className="text-xs text-slate-400">All active and completed lending accounts</p>
        </div>

        <button
          onClick={() => navigate('/accounts/add')}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Loan Account</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search account ID, borrower name, purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active</option>
            <option value="partial">Partial Paid</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={repaymentType}
            onChange={(e) => setRepaymentType(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Repayment Types</option>
            <option value="one-time">One-Time</option>
            <option value="emi">EMI</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Account ID</th>
                <th className="p-4">Borrower</th>
                <th className="p-4">Type</th>
                <th className="p-4">Given</th>
                <th className="p-4">Expected</th>
                <th className="p-4">Received</th>
                <th className="p-4">Outstanding</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {accounts.map((acc) => (
                <tr key={acc._id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-mono font-bold text-blue-400">{acc.accountNumber}</td>
                  <td className="p-4 font-bold text-white">
                    {acc.personId ? (
                      <button
                        onClick={() => navigate(`/people/${acc.personId._id}`)}
                        className="hover:text-blue-400 transition"
                      >
                        {acc.personId.name}
                      </button>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="p-4 uppercase font-bold text-purple-400">{acc.repaymentType}</td>
                  <td className="p-4 font-semibold">{symbol}{acc.amountGiven?.toLocaleString()}</td>
                  <td className="p-4 font-semibold">{symbol}{acc.expectedReturn?.toLocaleString()}</td>
                  <td className="p-4 font-bold text-emerald-400">{symbol}{acc.totalReceived?.toLocaleString()}</td>
                  <td className="p-4 font-bold text-rose-400">{symbol}{acc.outstanding?.toLocaleString()}</td>
                  <td className="p-4 text-slate-400">{new Date(acc.dueDate).toLocaleDateString('en-IN')}</td>
                  <td className="p-4">
                    <Badge status={acc.status} />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenReceivePaymentForAccount?.(acc.personId?._id, acc._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                        title="Receive Payment"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleCancelAccount(acc._id, acc.accountNumber)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Cancel Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && accounts.length === 0 && (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-slate-500">
                    No loan accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountList;
