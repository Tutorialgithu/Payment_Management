import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Calendar, FileText, CheckCircle, MessageSquare, Share2 } from 'lucide-react';
import Modal from '../components/common/Modal';
import api from '../services/api';

const ReceivePaymentModal = ({ isOpen, onClose, onSuccess, initialPersonId = null, initialAccountId = null }) => {
  const [people, setPeople] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [emis, setEmis] = useState([]);

  const [selectedPersonId, setSelectedPersonId] = useState(initialPersonId || '');
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId || '');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [transactionId, setTransactionId] = useState('');
  const [allocationType, setAllocationType] = useState('auto');
  const [selectedEmiId, setSelectedEmiId] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdPaymentInfo, setCreatedPaymentInfo] = useState(null);

  // Fetch people on mount
  useEffect(() => {
    if (isOpen) {
      setCreatedPaymentInfo(null);
      api.get('/people?limit=100').then((res) => {
        if (res.success) setPeople(res.people);
      });
    }
  }, [isOpen]);

  // Fetch accounts when person changes
  useEffect(() => {
    if (selectedPersonId) {
      api.get(`/accounts?personId=${selectedPersonId}`).then((res) => {
        if (res.success) {
          setAccounts(res.accounts);
          if (res.accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(res.accounts[0]._id);
          }
        }
      });
    } else {
      setAccounts([]);
    }
  }, [selectedPersonId]);

  // Fetch EMIs when account changes
  useEffect(() => {
    if (selectedAccountId) {
      const selectedAcc = accounts.find((a) => a._id === selectedAccountId);
      if (selectedAcc && selectedAcc.repaymentType === 'emi') {
        api.get(`/accounts/${selectedAccountId}/emi`).then((res) => {
          if (res.success) setEmis(res.emis);
        });
      } else {
        setEmis([]);
      }
    }
  }, [selectedAccountId, accounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPersonId || !selectedAccountId || !amount) {
      setError('Please select Person, Account and enter Amount');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/payments', {
        personId: selectedPersonId,
        accountId: selectedAccountId,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        transactionId,
        allocationType,
        emiId: selectedEmiId || null,
        notes
      });

      if (res.success) {
        const person = people.find((p) => p._id === selectedPersonId);
        const account = accounts.find((a) => a._id === selectedAccountId);
        setCreatedPaymentInfo({
          payment: res.payment,
          person,
          account
        });
        if (onSuccess) onSuccess(res.payment);
      }
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setCreatedPaymentInfo(null);
    setAmount('');
    setTransactionId('');
    setNotes('');
    onClose();
  };

  const currentAccount = accounts.find((a) => a._id === selectedAccountId);

  if (createdPaymentInfo) {
    const { payment, person, account } = createdPaymentInfo;
    const remOutstanding = Math.max(0, (account?.outstanding || 0) - (payment.amount || 0));
    const message = `Hello *${person?.name || 'Borrower'}*,\n\nWe have received your payment of *₹${payment.amount?.toLocaleString('en-IN')}* on *${new Date(payment.paymentDate).toLocaleDateString('en-IN')}*.\nReceipt No: *${payment.receiptNumber}*\nPayment Method: ${payment.paymentMethod.toUpperCase()}\nRemaining Balance: *₹${remOutstanding.toLocaleString('en-IN')}*\n\nThank you!`;

    const handleSendWhatsApp = () => {
      const phone = person?.whatsappNumber || person?.mobile || '';
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
      <Modal isOpen={isOpen} onClose={handleCloseSuccess} title="Payment Recorded Successfully" maxWidth="max-w-md">
        <div className="text-center space-y-4 py-2 text-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Payment Received Successfully!</h3>
            <p className="text-xs text-slate-400 mt-0.5">Receipt No: <span className="font-mono text-blue-400 font-semibold">{payment.receiptNumber}</span></p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Borrower:</span>
              <span className="font-bold text-white">{person?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Amount Paid:</span>
              <span className="font-extrabold text-emerald-400 text-sm">₹{payment.amount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payment Date:</span>
              <span className="text-slate-200">{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          {/* WhatsApp Confirmation Banner */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 space-y-3 text-left">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <MessageSquare className="w-4 h-4" />
              <span>Send Receipt via WhatsApp</span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800 whitespace-pre-line leading-relaxed">
              {message}
            </p>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Send WhatsApp Receipt Message</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCloseSuccess}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Done / Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receive Payment" maxWidth="max-w-xl">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Borrower Select */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Select Borrower / Person *</label>
          <select
            value={selectedPersonId}
            onChange={(e) => {
              setSelectedPersonId(e.target.value);
              setSelectedAccountId('');
            }}
            required
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">-- Choose Borrower --</option>
            {people.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.mobile})
              </option>
            ))}
          </select>
        </div>

        {/* Account Select */}
        {selectedPersonId && (
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Select Loan Account *</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Choose Account --</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.accountNumber} - Outstanding: ₹{acc.outstanding?.toLocaleString()} ({acc.repaymentType.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Current Account Summary Banner */}
        {currentAccount && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-400">Total Expected: ₹{currentAccount.expectedReturn?.toLocaleString()}</span>
              <p className="text-emerald-400 font-bold">Received: ₹{currentAccount.totalReceived?.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Outstanding</span>
              <p className="text-rose-400 font-bold text-sm">₹{currentAccount.outstanding?.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Payment Amount (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Payment Date *</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Payment Method & Transaction ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer (NEFT / IMPS)</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Transaction Ref / ID (Optional)</label>
            <input
              type="text"
              placeholder="e.g. UPI12345678"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Allocation Strategy (If EMI account) */}
        {currentAccount?.repaymentType === 'emi' && (
          <div className="border-t border-slate-800 pt-3">
            <label className="block text-slate-300 font-semibold mb-2">EMI Allocation Mode</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="allocation"
                  value="auto"
                  checked={allocationType === 'auto'}
                  onChange={() => setAllocationType('auto')}
                  className="accent-blue-500"
                />
                <span>Auto Allocate (Oldest Pending EMI First)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="allocation"
                  value="manual"
                  checked={allocationType === 'manual'}
                  onChange={() => setAllocationType('manual')}
                  className="accent-blue-500"
                />
                <span>Manual Select EMI</span>
              </label>
            </div>

            {allocationType === 'manual' && (
              <div>
                <select
                  value={selectedEmiId}
                  onChange={(e) => setSelectedEmiId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Select EMI Installment --</option>
                  {emis.map((e) => (
                    <option key={e._id} value={e._id}>
                      EMI #{e.emiNumber} - Due: {new Date(e.dueDate).toLocaleDateString()} - Amount: ₹{e.amount} (Remaining: ₹{e.remainingAmount})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Notes / Internal Remarks</label>
          <textarea
            rows="2"
            placeholder="Add payment notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
          ></textarea>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-900/30 flex items-center gap-2"
          >
            {loading ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Save Payment & Issue Receipt</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReceivePaymentModal;
