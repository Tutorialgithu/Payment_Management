import React from 'react';
import { Download, Printer, Share2, CheckCircle2 } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../services/api';

const ReceiptModal = ({ isOpen, onClose, payment, person, account, adminSettings }) => {
  if (!payment) return null;

  const symbol = adminSettings?.currencySymbol || '₹';
  const bizName = adminSettings?.businessName || 'Payment Management & Lending Tracker';
  const bizAddress = adminSettings?.businessAddress || 'Official Lending Services';

  const handleDownloadPDF = () => {
    window.open(`/api/payments/${payment._id}/pdf`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*PAYMENT RECEIPT*\nReceipt No: ${payment.receiptNumber}\nAmount Received: ${symbol}${payment.amount}\nPerson: ${person?.name || 'Borrower'}\nDate: ${new Date(payment.paymentDate).toLocaleDateString('en-IN')}\nOutstanding: ${symbol}${account?.outstanding || 0}\n\nThank you!`
    );
    window.open(`https://wa.me/91${person?.whatsappNumber || person?.mobile}?text=${text}`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Payment Receipt: ${payment.receiptNumber}`} maxWidth="max-w-xl">
      {/* Receipt Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>

        <button
          onClick={handleShareWhatsApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Send on WhatsApp</span>
        </button>
      </div>

      {/* Printable Receipt Paper Container */}
      <div id="printable-receipt" className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-extrabold tracking-wide uppercase text-white">{bizName}</h2>
            <p className="text-xs text-slate-400">{bizAddress}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30">
              OFFICIAL RECEIPT
            </span>
          </div>
        </div>

        {/* Receipt Meta info */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Receipt No:</span>
            <p className="font-mono font-bold text-white text-sm">{payment.receiptNumber}</p>
          </div>
          <div className="text-right">
            <span className="text-slate-400">Payment Date:</span>
            <p className="font-semibold text-white">
              {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Person Info Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Received From</span>
          <p className="text-sm font-bold text-white">{person?.name}</p>
          <p className="text-xs text-slate-400">Mobile: {person?.mobile}</p>
        </div>

        {/* Amount Box */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-400">AMOUNT RECEIVED</span>
            <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">
              {symbol}{payment.amount?.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-slate-400">Payment Method</span>
            <p className="text-xs font-bold text-white uppercase mt-0.5">
              {payment.paymentMethod} {payment.transactionId ? `(${payment.transactionId})` : ''}
            </p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="border border-slate-800 rounded-lg divide-y divide-slate-800 text-xs">
          <div className="flex justify-between p-2.5">
            <span className="text-slate-400">Account Number:</span>
            <span className="font-semibold text-white">{account?.accountNumber}</span>
          </div>
          <div className="flex justify-between p-2.5">
            <span className="text-slate-400">Total Expected Return:</span>
            <span className="font-semibold text-white">{symbol}{account?.expectedReturn?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between p-2.5">
            <span className="text-slate-400">Total Received Till Date:</span>
            <span className="font-semibold text-emerald-400">{symbol}{account?.totalReceived?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between p-2.5 bg-slate-900/60 font-bold">
            <span className="text-slate-300">Remaining Outstanding:</span>
            <span className="text-rose-400">{symbol}{account?.outstanding?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 italic">
          {adminSettings?.receiptFooterText || 'Thank you for your timely payment!'}
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
