import React, { useState, useEffect } from 'react';
import { Search, CreditCard, Download, FileText } from 'lucide-react';
import api from '../services/api';
import ReceiptModal from '../components/receipt/ReceiptModal';
import { useAuth } from '../context/AuthContext';

const PaymentsList = ({ onOpenReceivePayment }) => {
  const { admin } = useAuth();
  const symbol = admin?.currencySymbol || '₹';

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/payments?paymentMethod=${paymentMethod}&page=${page}&limit=10`);
      if (res.success) {
        setPayments(res.payments);
        setTotalPages(res.pages);
      }
    } catch (err) {
      console.error('Failed to fetch payments ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [paymentMethod, page]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Payment Ledger</h1>
          <p className="text-xs text-slate-400">Complete historical register of all payments received</p>
        </div>

        <button
          onClick={onOpenReceivePayment}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          <span>Receive Payment</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center text-xs">
        <span className="text-slate-400 font-semibold">Filter Payment Method:</span>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
        >
          <option value="all">All Methods</option>
          <option value="upi">UPI</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cheque">Cheque</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Receipt No</th>
                <th className="p-4">Borrower</th>
                <th className="p-4">Account ID</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment Date</th>
                <th className="p-4">Method</th>
                <th className="p-4">Transaction ID</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-mono font-bold text-blue-400">{p.receiptNumber}</td>
                  <td className="p-4 font-bold text-white">{p.personId ? p.personId.name : 'N/A'}</td>
                  <td className="p-4 text-slate-300">{p.accountId ? p.accountId.accountNumber : 'N/A'}</td>
                  <td className="p-4 font-extrabold text-emerald-400">{symbol}{p.amount?.toLocaleString()}</td>
                  <td className="p-4 text-slate-400">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                  <td className="p-4 uppercase font-semibold">{p.paymentMethod}</td>
                  <td className="p-4 text-slate-400 font-mono">{p.transactionId || '-'}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedReceiptPayment(p)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition inline-flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && payments.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-500">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceiptPayment && (
        <ReceiptModal
          isOpen={!!selectedReceiptPayment}
          onClose={() => setSelectedReceiptPayment(null)}
          payment={selectedReceiptPayment}
          person={selectedReceiptPayment.personId}
          account={selectedReceiptPayment.accountId}
          adminSettings={admin}
        />
      )}
    </div>
  );
};

export default PaymentsList;
