import React, { useState, useEffect } from 'react';
import { Wallet, Calendar, DollarSign, Edit3, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '../components/common/Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatDateForInput = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EditAccountModal = ({ isOpen, onClose, account, onSuccess }) => {
  const { admin } = useAuth();
  const symbol = admin?.currencySymbol || '₹';

  const [formData, setFormData] = useState({
    purpose: '',
    amountGiven: '',
    expectedReturn: '',
    repaymentType: 'one-time',
    dateGiven: '',
    dueDate: '',
    status: 'active',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (account && isOpen) {
      setError('');
      setFormData({
        purpose: account.purpose || '',
        amountGiven: account.amountGiven !== undefined ? String(account.amountGiven) : '',
        expectedReturn: account.expectedReturn !== undefined ? String(account.expectedReturn) : '',
        repaymentType: account.repaymentType || 'one-time',
        dateGiven: formatDateForInput(account.dateGiven),
        dueDate: formatDateForInput(account.dueDate),
        status: account.status || 'active',
        notes: account.notes || ''
      });
    }
  }, [account, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account?._id) return;

    const givenNum = Number(formData.amountGiven);
    const expectedNum = Number(formData.expectedReturn);

    if (isNaN(givenNum) || givenNum < 0) {
      setError('Amount Given must be a valid non-negative number');
      return;
    }
    if (isNaN(expectedNum) || expectedNum < 0) {
      setError('Expected Return must be a valid non-negative number');
      return;
    }
    if (!formData.dueDate) {
      setError('Due Date is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.put(`/accounts/${account._id}`, {
        purpose: formData.purpose,
        amountGiven: givenNum,
        expectedReturn: expectedNum,
        repaymentType: formData.repaymentType,
        dateGiven: formData.dateGiven,
        dueDate: formData.dueDate,
        status: formData.status,
        notes: formData.notes
      });

      if (res.success) {
        onSuccess?.(res.account);
        onClose();
      } else {
        setError(res.message || 'Failed to update loan account');
      }
    } catch (err) {
      console.error('Error updating loan account:', err);
      setError(err.message || 'Failed to update loan account');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !account) return null;

  const borrowerName = account.personId?.name || 'N/A';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Loan Account (${account.accountNumber || 'Account'})`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Borrower & Account ID Card Header */}
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Borrower</span>
            <p className="text-xs font-bold text-white">{borrowerName}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500">Account ID</span>
            <p className="text-xs font-mono font-bold text-blue-400">{account.accountNumber}</p>
          </div>
        </div>

        {/* Purpose / Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Purpose / Loan Title
          </label>
          <input
            type="text"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            placeholder="e.g. Business Loan, Personal Emergency"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Amount Given & Expected Return */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Amount Given ({symbol})
            </label>
            <input
              type="number"
              name="amountGiven"
              min="0"
              step="any"
              value={formData.amountGiven}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Expected Return ({symbol})
            </label>
            <input
              type="number"
              name="expectedReturn"
              min="0"
              step="any"
              value={formData.expectedReturn}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Repayment Type & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Repayment Type
            </label>
            <select
              name="repaymentType"
              value={formData.repaymentType}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 uppercase font-semibold"
            >
              <option value="one-time">One-Time</option>
              <option value="emi">EMI</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Account Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="partial">Partial Paid</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Dates: Date Given & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Date Given
            </label>
            <input
              type="date"
              name="dateGiven"
              value={formData.dateGiven}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Notes / Internal Remarks
          </label>
          <textarea
            name="notes"
            rows="2"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any internal comments or notes..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          ></textarea>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-900/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Update Account</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditAccountModal;
