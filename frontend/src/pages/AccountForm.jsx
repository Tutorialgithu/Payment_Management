import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Wallet, Calendar, DollarSign, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AccountForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPersonId = searchParams.get('personId') || '';

  const { admin } = useAuth();
  const symbol = admin?.currencySymbol || '₹';

  const [people, setPeople] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(true);

  const [formData, setFormData] = useState({
    personId: initialPersonId,
    amountGiven: '',
    expectedReturn: '',
    dateGiven: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    purpose: '',
    repaymentType: 'emi', // 'one-time' or 'emi'
    emiAmount: '',
    emiFrequency: 'monthly',
    numberOfEmis: '12',
    notes: ''
  });

  const [schedulePreview, setSchedulePreview] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/people?limit=100').then((res) => {
      if (res.success) setPeople(res.people);
      setLoadingPeople(false);
    });
  }, []);

  // Auto calculate interest and auto preview EMI schedule
  useEffect(() => {
    const given = Number(formData.amountGiven) || 0;
    const expected = Number(formData.expectedReturn) || 0;

    if (formData.repaymentType === 'emi' && expected > 0) {
      const numEmis = Number(formData.numberOfEmis) || 1;
      let calculatedEmiAmount = Number(formData.emiAmount);

      if (!calculatedEmiAmount || calculatedEmiAmount <= 0) {
        calculatedEmiAmount = Math.round((expected / numEmis) * 100) / 100;
      }

      // Build live preview array
      const preview = [];
      let currentDate = new Date(formData.startDate || Date.now());
      let running = 0;

      for (let i = 1; i <= numEmis; i++) {
        let currentAmt = calculatedEmiAmount;
        if (i === numEmis) {
          currentAmt = Math.round((expected - running) * 100) / 100;
        } else {
          running += currentAmt;
        }

        preview.push({
          emiNumber: i,
          dueDate: new Date(currentDate).toLocaleDateString('en-IN'),
          amount: currentAmt
        });

        switch (formData.emiFrequency) {
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
      setSchedulePreview(preview);
    } else {
      setSchedulePreview([]);
    }
  }, [formData.amountGiven, formData.expectedReturn, formData.repaymentType, formData.numberOfEmis, formData.emiAmount, formData.emiFrequency, formData.startDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.personId || !formData.amountGiven || !formData.expectedReturn) {
      setError('Borrower, Amount Given, and Expected Return are required');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/accounts', formData);
      if (res.success) {
        navigate('/accounts');
      }
    } catch (err) {
      setError(err.message || 'Failed to create loan account');
    } finally {
      setSubmitting(false);
    }
  };

  const given = Number(formData.amountGiven) || 0;
  const expected = Number(formData.expectedReturn) || 0;
  const profitMargin = Math.max(0, expected - given);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <button
        onClick={() => navigate('/accounts')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Loan Accounts</span>
      </button>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-white">Create New Loan Account</h1>
          <p className="text-xs text-slate-400">Configure financial lending parameters, return details, and repayment schedule</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Section 1: Borrower & Basic Details */}
          <div className="space-y-4">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-blue-400">1. Basic Loan Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Borrower Person *</label>
                <select
                  required
                  value={formData.personId}
                  onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Borrower --</option>
                  {people.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.mobile})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Purpose / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Business expansion, emergency"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amount Given ({symbol}) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="50000"
                  value={formData.amountGiven}
                  onChange={(e) => setFormData({ ...formData, amountGiven: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Date Given *</label>
                <input
                  type="date"
                  required
                  value={formData.dateGiven}
                  onChange={(e) => setFormData({ ...formData, dateGiven: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financial Return & Repayment Type */}
          <div className="space-y-4 border-t border-slate-800 pt-6">
            <h2 className="text-xs uppercase font-extrabold tracking-wider text-purple-400">2. Financial Return & Structure</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Expected Return Amount ({symbol}) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="60000"
                  value={formData.expectedReturn}
                  onChange={(e) => setFormData({ ...formData, expectedReturn: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-bold focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Calculated Profit / Interest</span>
                <span className="text-base font-extrabold text-emerald-400">{symbol}{profitMargin.toLocaleString()}</span>
              </div>
            </div>

            {/* Repayment Type Switcher */}
            <div>
              <label className="block text-slate-300 font-semibold mb-2">Repayment Structure *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, repaymentType: 'one-time' })}
                  className={`p-4 rounded-2xl border text-left transition ${
                    formData.repaymentType === 'one-time'
                      ? 'bg-blue-600/15 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-sm">One-Time Payment</p>
                  <p className="text-[11px] mt-0.5">Entire expected amount returned on single due date.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, repaymentType: 'emi' })}
                  className={`p-4 rounded-2xl border text-left transition ${
                    formData.repaymentType === 'emi'
                      ? 'bg-blue-600/15 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold text-sm">EMI Installments</p>
                  <p className="text-[11px] mt-0.5">Returned periodically in fixed EMI schedule.</p>
                </button>
              </div>
            </div>

            {/* One-Time Due Date */}
            {formData.repaymentType === 'one-time' && (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Final Due Date *</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* EMI Parameters */}
            {formData.repaymentType === 'emi' && (
              <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Frequency</label>
                    <select
                      value={formData.emiFrequency}
                      onChange={(e) => setFormData({ ...formData, emiFrequency: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-Weekly (14 days)</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Number of EMIs</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.numberOfEmis}
                      onChange={(e) => setFormData({ ...formData, numberOfEmis: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">First EMI Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live Preview Table */}
                {schedulePreview.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Live Generated EMI Preview</span>
                    <div className="max-h-48 overflow-y-auto mt-2 border border-slate-800 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 font-semibold sticky top-0">
                          <tr>
                            <th className="p-2">EMI #</th>
                            <th className="p-2">Due Date</th>
                            <th className="p-2 text-right">Amount ({symbol})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {schedulePreview.map((item) => (
                            <tr key={item.emiNumber}>
                              <td className="p-2 font-bold text-white">#{item.emiNumber}</td>
                              <td className="p-2 text-slate-300">{item.dueDate}</td>
                              <td className="p-2 text-right font-mono font-bold text-emerald-400">{symbol}{item.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/accounts')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-900/30 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Creating Loan Account...' : 'Initialize Loan Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountForm;
