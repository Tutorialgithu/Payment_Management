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
  Clock,
  Edit2,
  Check,
  X,
  Loader2,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { compressImageFile } from '../utils/imageReducer';
import { getImageUrl } from '../utils/imageHelper';

const PersonDetail = ({ onOpenReceivePaymentForPerson, onOpenAddAccountForPerson }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useAuth();

  const [personData, setPersonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEmiAccountId, setSelectedEmiAccountId] = useState('all');
  const [previewImage, setPreviewImage] = useState(null);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editFormError, setEditFormError] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    mobile: '',
    whatsappNumber: '',
    alternateMobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    idProofType: '',
    idProofNumber: '',
    profileImage: '',
    idProofImage: '',
    chequeImage: '',
    notes: ''
  });

  const [selectedFiles, setSelectedFiles] = useState({
    profileImage: null,
    idProofImage: null,
    chequeImage: null
  });

  const [imageWarnings, setImageWarnings] = useState({
    profileImage: '',
    idProofImage: '',
    chequeImage: ''
  });
  const [imageSizes, setImageSizes] = useState({
    profileImage: null,
    idProofImage: null,
    chequeImage: null
  });
  const [compressing, setCompressing] = useState({
    profileImage: false,
    idProofImage: false,
    chequeImage: false
  });

  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [editError, setEditError] = useState('');

  const handleOpenEditProfile = () => {
    if (!personData?.person) return;
    const p = personData.person;
    const profImg = p.profileImage || p.photo || '';
    const idImg = p.idProofImage || '';
    const chqImg = p.chequeImage || '';

    setSelectedFiles({ profileImage: null, idProofImage: null, chequeImage: null });
    setEditFormData({
      name: p.name || '',
      mobile: p.mobile || '',
      whatsappNumber: p.whatsappNumber || '',
      alternateMobile: p.alternateMobile || '',
      email: p.email || '',
      address: p.address || '',
      city: p.city || '',
      state: p.state || '',
      pincode: p.pincode || '',
      idProofType: p.idProofType || '',
      idProofNumber: p.idProofNumber || '',
      profileImage: profImg,
      idProofImage: idImg,
      chequeImage: chqImg,
      notes: p.notes || ''
    });
    setImageWarnings({ profileImage: '', idProofImage: '', chequeImage: '' });
    setImageSizes({
      profileImage: profImg ? Math.round((profImg.length * 0.75) / 1024) : null,
      idProofImage: idImg ? Math.round((idImg.length * 0.75) / 1024) : null,
      chequeImage: chqImg ? Math.round((chqImg.length * 0.75) / 1024) : null
    });
    setEditFormError('');
    setIsEditModalOpen(true);
  };

  const handleSimpleFileSelect = (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditFormData((prev) => ({
        ...prev,
        [fieldName]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitEditProfile = async (e) => {
    e.preventDefault();
    setEditFormError('');
    setSubmittingEdit(true);

    try {
      await api.put(`/people/${id}`, editFormData);
      setIsEditModalOpen(false);
      fetchPersonProfile(false);
    } catch (err) {
      setEditFormError(err.message || 'Failed to update borrower profile');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const fetchPersonProfile = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get(`/people/${id}`);
      if (res.success) {
        setPersonData(res);
      }
    } catch (err) {
      console.error('Error fetching person profile:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleUpdatePayment = async (paymentId) => {
    const newAmountNum = Number(editAmount);
    if (editAmount === '' || isNaN(newAmountNum) || newAmountNum < 0) {
      setEditError('Enter a valid non-negative amount');
      return;
    }

    setUpdatingPayment(true);
    setEditError('');

    // Optimistic Update locally in state for instant UI update without page reload/loading screen
    setPersonData((prev) => {
      if (!prev) return prev;
      const updatedPayments = (prev.payments || []).map((p) =>
        p._id === paymentId ? { ...p, amount: newAmountNum } : p
      );
      return {
        ...prev,
        payments: updatedPayments
      };
    });

    setEditingPaymentId(null);

    try {
      const res = await api.put(`/payments/${paymentId}`, { amount: newAmountNum });
      if (res.success) {
        setEditAmount('');
        // Silent background sync without triggering full page loading screen
        await fetchPersonProfile(false);
      } else {
        setEditError(res.message || 'Failed to update payment');
        await fetchPersonProfile(false);
      }
    } catch (err) {
      console.error('Error updating payment:', err);
      setEditError(err.message || 'Failed to update payment');
      await fetchPersonProfile(false);
    } finally {
      setUpdatingPayment(false);
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
  console.log('person', person);
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
          {person.profileImage || person.photo ? (
            console.log('profile', person.profileImage),
            <div className="relative group shrink-0">
              <img
                // src={getImageUrl(person.profileImage || person.photo)}
                src={(person.profileImage || person.photo)}
                alt={person.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-blue-500/40 shadow-2xl cursor-pointer group-hover:scale-105 group-hover:border-blue-400 transition-all duration-300"
                onClick={() => setPreviewImage({ url: getImageUrl(person.profileImage || person.photo), title: `${person.name}'s Profile Photo` })}
              />
              <div
                onClick={() => setPreviewImage({ url: getImageUrl(person.profileImage || person.photo), title: `${person.name}'s Profile Photo` })}
                className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg shadow-lg cursor-pointer transition border border-blue-400/40"
                title="View Full Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-3xl shadow-2xl shrink-0 border border-blue-500/30">
              {person.name.charAt(0)}
            </div>
          )}

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

            {/* Document Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {person.idProofImage && (
                <button
                  onClick={() => setPreviewImage({ url: person.idProofImage, title: `${person.name}'s ID Proof (${person.idProofType || 'ID'})` })}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>ID Proof 📄</span>
                </button>
              )}

              {person.chequeImage && (
                <button
                  onClick={() => setPreviewImage({ url: person.chequeImage, title: `${person.name}'s Guarantee Cheque Image` })}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>Cheque 🏷️</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenEditProfile}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 font-bold text-xs shadow-lg transition flex items-center gap-1.5"
            title="Edit Borrower Profile & Documents"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

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

      {/* Borrower Identity & Document Gallery Card */}
      {/* <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>📸 Borrower Identity & Document Gallery</span>
            </h3>
            <p className="text-xs text-slate-400">Profile photo, official ID proof, and guarantee cheque attachments</p>
          </div>

          <button
            onClick={handleOpenEditProfile}
            className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Upload / Edit Photos</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between gap-3 text-center group hover:border-blue-500/40 transition">
            <span className="text-xs font-bold text-slate-300">Profile Photo</span>
            {person.profileImage || person.photo ? (
              <div
                className="relative overflow-hidden rounded-2xl border-2 border-blue-500/30 group-hover:border-blue-500 transition cursor-pointer"
                onClick={() => setPreviewImage({ url: getImageUrl(person.profileImage || person.photo), title: `${person.name}'s Profile Photo` })}
              >
                <img src={getImageUrl(person.profileImage || person.photo)} alt="Profile" className="w-28 h-28 object-cover rounded-xl" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs">
                  🔍 View Full
                </div>
              </div>
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-slate-900 border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-2">
                <span>No Profile Photo</span>
              </div>
            )}
            <span className="text-[10px] text-slate-400 font-semibold">{person.name}</span>
          </div>

         
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between gap-3 text-center group hover:border-purple-500/40 transition">
            <span className="text-xs font-bold text-slate-300">ID Proof ({person.idProofType || 'Identity'})</span>
            {person.idProofImage ? (
              <div
                className="relative overflow-hidden rounded-2xl border-2 border-purple-500/30 group-hover:border-purple-500 transition cursor-pointer"
                onClick={() => setPreviewImage({ url: getImageUrl(person.idProofImage), title: `${person.name}'s ID Proof (${person.idProofType || 'ID'})` })}
              >
                <img src={getImageUrl(person.idProofImage)} alt="ID Proof" className="w-28 h-28 object-cover rounded-xl" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs">
                  🔍 View Full
                </div>
              </div>
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-slate-900 border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-2">
                <span>No ID Proof Photo</span>
              </div>
            )}
            <span className="text-[10px] text-slate-400 font-mono">{person.idProofNumber || 'No ID Number'}</span>
          </div>

          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between gap-3 text-center group hover:border-amber-500/40 transition">
            <span className="text-xs font-bold text-slate-300">Guarantee Cheque Photo</span>
            {person.chequeImage ? (
              <div
                className="relative overflow-hidden rounded-2xl border-2 border-amber-500/30 group-hover:border-amber-500 transition cursor-pointer"
                onClick={() => setPreviewImage({ url: getImageUrl(person.chequeImage), title: `${person.name}'s Guarantee Cheque Photo` })}
              >
                <img src={getImageUrl(person.chequeImage)} alt="Guarantee Cheque" className="w-28 h-28 object-cover rounded-xl" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs">
                  🔍 View Full
                </div>
              </div>
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-slate-900 border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-2">
                <span>No Cheque Photo</span>
              </div>
            )}
            <span className="text-[10px] text-slate-400 font-semibold">Security Document</span>
          </div>
        </div>
      </div> */}

      {/* Financial Summary Grid */}
      {(() => {
        const overallPaymentsSum = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const displayTotalReceived = payments.length > 0 ? overallPaymentsSum : (Number(summary.totalReceived) || 0);
        const displayExpectedReturn = Number(summary.expectedReturn) || 0;
        const displayOutstanding = Math.max(0, displayExpectedReturn - displayTotalReceived);

        return (
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
              <p className="text-xl font-extrabold text-purple-400 mt-1">{symbol}{displayExpectedReturn.toLocaleString()}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Received</span>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">{symbol}{displayTotalReceived.toLocaleString()}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Outstanding</span>
              <p className="text-xl font-extrabold text-amber-400 mt-1">{symbol}{displayOutstanding.toLocaleString()}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">Overdue</span>
              <p className="text-xl font-extrabold text-rose-400 mt-1">{symbol}{summary.overdue?.toLocaleString()}</p>
            </div>
          </div>
        );
      })()}

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 font-semibold text-xs transition border-b-2 whitespace-nowrap ${activeTab === t.id
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
            <div className="bg-slate-900 border border-slate-800 rounded-lg md:rounded-3xl p-3  md:p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-white">Active Loans & Accounts Breakdown</h2>
                <span className="text-xs text-slate-400 font-medium">Total Loans: {accounts.length}</span>
              </div>

              {updatingPayment && (
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 rounded-xl animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
                  <span>Updating received amount in backend... Please wait.</span>
                </div>
              )}

              {accounts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No loan accounts found for this borrower.</p>
              ) : (
                <div className="space-y-6">
                  {accounts.map((acc, idx) => {
                    const accountPayments = payments
                      .filter((p) => {
                        if (!p.accountId) return false;
                        const pAccId = typeof p.accountId === 'object' ? (p.accountId._id || p.accountId) : p.accountId;
                        const matchId = pAccId && String(pAccId) === String(acc._id);
                        const matchAccNum = p.accountId?.accountNumber && acc.accountNumber && (p.accountId.accountNumber === acc.accountNumber);
                        return matchId || matchAccNum;
                      })
                      .sort((a, b) => new Date(a.paymentDate || a.createdAt || 0) - new Date(b.paymentDate || b.createdAt || 0));

                    // Direct sum from actual payments array
                    const accountPaymentsSum = accountPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                    const totalReceivedVal = accountPayments.length > 0 ? accountPaymentsSum : (Number(acc.totalReceived) || 0);

                    const amountGivenVal = Number(acc.amountGiven) || 0;
                    const expectedReturnVal = Number(acc.expectedReturn) || 0;
                    const outstandingVal = Math.max(0, expectedReturnVal - totalReceivedVal);

                    // Filter EMIs for this loan account
                    const accountEmis = emis.filter((e) => {
                      if (!e.accountId) return false;
                      const eAccId = typeof e.accountId === 'object' ? (e.accountId._id || e.accountId) : e.accountId;
                      return eAccId && String(eAccId) === String(acc._id);
                    });

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // Identify overdue / missed EMIs
                    const overdueEmis = accountEmis.filter((e) => {
                      const isOverdueStatus = e.status === 'overdue';
                      const isPastDue = new Date(e.dueDate) < today && Number(e.remainingAmount) > 0 && e.status !== 'paid';
                      return isOverdueStatus || isPastDue;
                    });

                    // Calculate Total Bounce Amount
                    let accountBounceVal = 0;
                    if (acc.repaymentType === 'emi') {
                      accountBounceVal = overdueEmis.reduce((sum, e) => sum + (Number(e.remainingAmount) || Number(e.amount) || 0), 0);
                    } else {
                      const isPastDue = acc.dueDate && new Date(acc.dueDate) < today;
                      accountBounceVal = (isPastDue && outstandingVal > 0) ? outstandingVal : 0;
                    }

                    // Build unified history ledger (Received Payments + Bounced/Missed Payment Dates)
                    const historyItems = [];

                    accountPayments.forEach((p) => {
                      historyItems.push({
                        id: p._id,
                        isReceived: true,
                        date: p.paymentDate || p.createdAt,
                        receiptNumber: p.receiptNumber || 'N/A',
                        method: p.paymentMethod || 'cash',
                        transactionId: p.transactionId || '',
                        amount: Number(p.amount) || 0,
                        paymentObj: p
                      });
                    });

                    if (acc.repaymentType === 'emi') {
                      overdueEmis.forEach((e) => {
                        historyItems.push({
                          id: `bounce_${e._id}`,
                          isReceived: false,
                          date: e.dueDate,
                          receiptNumber: `EMI #${e.emiNumber}`,
                          method: 'MISSED / BOUNCED',
                          transactionId: '',
                          amount: Number(e.remainingAmount) || Number(e.amount) || 0,
                          emiObj: e
                        });
                      });
                    } else if (accountBounceVal > 0) {
                      historyItems.push({
                        id: `bounce_${acc._id}`,
                        isReceived: false,
                        date: acc.dueDate,
                        receiptNumber: `DUE DATE MISSED`,
                        method: 'OVERDUE / BOUNCED',
                        transactionId: '',
                        amount: accountBounceVal,
                        accObj: acc
                      });
                    }

                    // Sort chronologically (oldest date first, latest at bottom)
                    historyItems.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

                    return (
                      <div key={acc._id} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 md:p-5 space-y-4">
                        {/* Loan Account Header Banner */}
                        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] md:text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                              Loan #{idx + 1}: {acc.accountNumber}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {acc.purpose || 'General Loan'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenReceivePaymentForPerson?.(person._id, acc._id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold text-xs transition flex items-center gap-1"
                              title="Receive Payment for this Loan"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Receive Payment</span>
                            </button>
                            <span className="text-[10px] font-bold text-blue-400 uppercase bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                              {acc.repaymentType}
                            </span>
                            <Badge status={acc.status} />
                          </div>
                        </div>

                        {/* Summary Cards above table */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 md:gap-2.5">
                          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-1 md:p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Given Amount</span>
                            <p className="text-xs font-extrabold text-white mt-0.5">{symbol}{amountGivenVal.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 md:p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Expected Return</span>
                            <p className="text-xs font-extrabold text-purple-400 mt-0.5">{symbol}{expectedReturnVal.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 md:p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Total Received</span>
                            <p className="text-xs font-extrabold text-emerald-400 mt-0.5">{symbol}{totalReceivedVal.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 md:p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Remaining</span>
                            <p className="text-xs font-extrabold text-rose-400 mt-0.5">{symbol}{outstandingVal.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 md:p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Bounce Amount</span>
                            <p className="text-xs font-extrabold text-rose-500 mt-0.5">{symbol}{accountBounceVal.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 md:p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Given Date</span>
                            <p className="text-xs font-semibold text-slate-200 mt-1">
                              {acc.dateGiven ? new Date(acc.dateGiven).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Due Date</span>
                            <p className="text-xs font-semibold text-slate-200 mt-1">
                              {acc.dueDate ? new Date(acc.dueDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Received & Bounced Ledger Table */}
                        <div className="pt-2">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-slate-300">History & Payment Ledger</h3>
                            <div className="flex items-center gap-3 text-[11px] font-semibold">
                              <span className="text-emerald-400">
                                Total Received: {symbol}{totalReceivedVal.toLocaleString()}
                              </span>
                              {accountBounceVal > 0 && (
                                <span className="text-rose-400">
                                  Total Bounced: {symbol}{accountBounceVal.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {editError && editingPaymentId && (
                            <p className="text-[11px] text-rose-400 mb-2 font-medium">{editError}</p>
                          )}

                          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                            {historyItems.length === 0 ? (
                              <p className="text-xs text-slate-500 text-center py-4 italic">No payments or bounced records for this loan account yet.</p>
                            ) : (
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
                                  <tr>
                                    <th className="p-3 text-center w-12">S.No.</th>
                                    <th className="p-3">Receipt / Event</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Payment Method / Status</th>
                                    <th className="p-3 text-right">Amount</th>
                                    <th className="p-3 text-center">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                  {historyItems.map((item, pIdx) => {
                                    if (item.isReceived) {
                                      const p = item.paymentObj;
                                      return (
                                        <tr key={item.id} className="hover:bg-slate-900/60 transition">
                                          <td className="p-2 text-center font-mono font-medium text-slate-400">
                                            {pIdx + 1}
                                          </td>
                                          <td className="p-2 font-mono text-blue-400 font-semibold">
                                            {p.receiptNumber || 'N/A'}
                                          </td>
                                          <td className="p-2 text-slate-200 font-medium">
                                            {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'}
                                          </td>
                                          <td className="p-2 text-slate-400 uppercase font-medium text-[11px]">
                                            {p.paymentMethod || 'cash'} {p.transactionId ? `(${p.transactionId})` : ''}
                                          </td>
                                          <td className="p-2 text-right font-extrabold text-emerald-400 text-sm">
                                            {editingPaymentId === p._id ? (
                                              <div className="flex items-center justify-end gap-1">
                                                <span className="text-slate-400 text-xs">{symbol}</span>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  step="any"
                                                  value={editAmount}
                                                  onChange={(e) => setEditAmount(e.target.value)}
                                                  className="w-24 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-white text-xs font-bold focus:outline-none"
                                                  autoFocus
                                                />
                                              </div>
                                            ) : (
                                              `+${symbol}${p.amount?.toLocaleString()}`
                                            )}
                                          </td>
                                          <td className="p-2 text-center">
                                            {editingPaymentId === p._id ? (
                                              <div className="flex items-center justify-center gap-1">
                                                <button
                                                  disabled={updatingPayment}
                                                  onClick={() => handleUpdatePayment(p._id)}
                                                  className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 flex items-center justify-center"
                                                  title="Save Amount"
                                                >
                                                  {updatingPayment ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                                  ) : (
                                                    <Check className="w-3.5 h-3.5" />
                                                  )}
                                                </button>
                                                <button
                                                  disabled={updatingPayment}
                                                  onClick={() => {
                                                    setEditingPaymentId(null);
                                                    setEditError('');
                                                  }}
                                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                                  title="Cancel"
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => {
                                                  setEditingPaymentId(p._id);
                                                  setEditAmount(p.amount);
                                                  setEditError('');
                                                }}
                                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 transition"
                                                title="Edit Received Amount"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    } else {
                                      return (
                                        <tr key={item.id} className="bg-rose-950/20 hover:bg-rose-950/30 transition">
                                          <td className="p-2 text-center font-mono font-medium text-slate-400">
                                            {pIdx + 1}
                                          </td>
                                          <td className="p-2 font-mono text-rose-400 font-semibold">
                                            {item.receiptNumber}
                                          </td>
                                          <td className="p-2 text-slate-200 font-medium">
                                            {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                                          </td>
                                          <td className="p-2">
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                                              <span>MISSED / BOUNCED</span>
                                            </span>
                                          </td>
                                          <td className="p-2 text-right font-extrabold text-rose-400 text-sm">
                                            -{symbol}{item.amount?.toLocaleString()}
                                          </td>
                                          <td className="p-2 text-center">
                                            <button
                                              onClick={() => onOpenReceivePaymentForPerson?.(person._id, acc._id)}
                                              className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold text-[11px] transition"
                                              title="Receive Payment for this Bounced Date"
                                            >
                                              Pay Now
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    }
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              {[...payments]
                .sort((a, b) => new Date(a.paymentDate || a.createdAt || 0) - new Date(b.paymentDate || b.createdAt || 0))
                .map((p, pIdx) => (
                  <div key={p._id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-mono font-bold text-slate-500">{pIdx + 1}</span>
                      <div>
                        <span className="font-mono font-bold text-blue-400">{p.receiptNumber}</span>
                        <p className="text-slate-400">
                          {new Date(p.paymentDate).toLocaleDateString()} • {p.paymentMethod.toUpperCase()} {p.transactionId ? `(${p.transactionId})` : ''}
                        </p>
                      </div>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            {/* Header & Loan Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-bold text-white">EMI Installments Schedule</h2>
                <p className="text-xs text-slate-400">Filter loan account to view its specific EMI installment schedule</p>
              </div>

              {/* Loan Selection Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold shrink-0">Select Loan:</span>
                <select
                  value={selectedEmiAccountId}
                  onChange={(e) => setSelectedEmiAccountId(e.target.value)}
                  className="bg-slate-950 border border-blue-500/40 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 shadow-sm min-w-[200px]"
                >
                  <option value="all">All Loans ({accounts.length})</option>
                  {accounts.map((acc, idx) => (
                    <option key={acc._id} value={acc._id}>
                      Loan #{idx + 1}: {acc.accountNumber} {acc.purpose ? `(${acc.purpose})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Loan Selection Filter Pills */}
            {accounts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedEmiAccountId('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${selectedEmiAccountId === 'all'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 border border-blue-400/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                >
                  All Loans ({accounts.length})
                </button>

                {accounts.map((acc, idx) => (
                  <button
                    key={acc._id}
                    onClick={() => setSelectedEmiAccountId(acc._id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${selectedEmiAccountId === acc._id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 border border-blue-400/30'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                  >
                    <span>Loan #{idx + 1}: {acc.accountNumber}</span>
                    {acc.repaymentType === 'emi' && (
                      <span className="text-[10px] opacity-75 font-mono">({acc.emiFrequency || 'EMI'})</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {accounts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No loan accounts found for this borrower.</p>
            ) : (
              <div className="space-y-6">
                {accounts
                  .filter((acc) => selectedEmiAccountId === 'all' || String(acc._id) === String(selectedEmiAccountId))
                  .map((acc) => {
                    const originalIdx = accounts.findIndex((a) => a._id === acc._id);
                    const accountEmis = emis
                      .filter((e) => {
                        if (!e.accountId) return false;
                        const eAccId = typeof e.accountId === 'object' ? (e.accountId._id || e.accountId) : e.accountId;
                        const matchId = eAccId && String(eAccId) === String(acc._id);
                        const matchAccNum = e.accountId?.accountNumber && acc.accountNumber && (e.accountId.accountNumber === acc.accountNumber);
                        return matchId || matchAccNum;
                      })
                      .sort((a, b) => (a.emiNumber || 0) - (b.emiNumber || 0));

                    const paidEmisCount = accountEmis.filter((e) => e.status === 'paid').length;
                    const overdueEmisCount = accountEmis.filter((e) => e.status === 'overdue').length;

                    return (
                      <div key={acc._id} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-4">
                        {/* Loan Account Header */}
                        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                              Loan #{originalIdx + 1}: {acc.accountNumber}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {acc.purpose || 'General Loan'}
                            </span>
                            <span className="text-[10px] font-bold text-purple-400 uppercase bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                              {acc.repaymentType === 'emi' ? `${acc.emiFrequency || 'monthly'} EMI` : 'One-Time'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                            {acc.repaymentType === 'emi' && (
                              <>
                                <span className="text-slate-400">
                                  EMI Amount: <span className="text-white font-bold">{symbol}{(acc.emiAmount || 0).toLocaleString()}</span>
                                </span>
                                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                                  Paid: {paidEmisCount}/{accountEmis.length}
                                </span>
                                {overdueEmisCount > 0 && (
                                  <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[11px]">
                                    Overdue: {overdueEmisCount}
                                  </span>
                                )}
                              </>
                            )}
                            <Badge status={acc.status} />
                          </div>
                        </div>

                        {/* EMI Table for this Account */}
                        {acc.repaymentType !== 'emi' ? (
                          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400 italic">
                            This is a one-time bullet repayment loan. Full return of {symbol}{acc.expectedReturn?.toLocaleString()} is due on {acc.dueDate ? new Date(acc.dueDate).toLocaleDateString() : 'N/A'}.
                          </div>
                        ) : accountEmis.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-500 italic text-center">
                            No EMI installments schedule generated for this loan account yet.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-900 text-slate-400 font-semibold uppercase text-[10px] border-b border-slate-800">
                                <tr>
                                  <th className="p-3 text-center w-14">EMI #</th>
                                  <th className="p-3">Due Date</th>
                                  <th className="p-3">Installment</th>
                                  <th className="p-3">Paid Amount</th>
                                  <th className="p-3">Remaining</th>
                                  <th className="p-3">Paid Date</th>
                                  <th className="p-3">Status</th>
                                  <th className="p-3 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {accountEmis.map((e) => (
                                  <tr key={e._id} className="hover:bg-slate-900/60 transition">
                                    <td className="p-2.5 text-center font-mono font-extrabold text-blue-400">
                                      #{e.emiNumber}
                                    </td>
                                    <td className="p-2.5 text-slate-200 font-medium">
                                      {e.dueDate ? new Date(e.dueDate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="p-2.5 font-bold text-white">
                                      {symbol}{e.amount?.toLocaleString()}
                                    </td>
                                    <td className="p-2.5 font-bold text-emerald-400">
                                      {symbol}{e.paidAmount?.toLocaleString()}
                                    </td>
                                    <td className="p-2.5 font-bold text-rose-400">
                                      {symbol}{e.remainingAmount?.toLocaleString()}
                                    </td>
                                    <td className="p-2.5 text-slate-400 text-[11px]">
                                      {e.paidDate ? new Date(e.paidDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="p-2.5">
                                      <Badge status={e.status} />
                                    </td>
                                    <td className="p-2.5 text-center">
                                      {e.status !== 'paid' ? (
                                        <button
                                          onClick={() => onOpenReceivePaymentForPerson?.(person._id, acc._id)}
                                          className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold text-[11px] transition"
                                          title="Receive Payment for this EMI"
                                        >
                                          Pay EMI
                                        </button>
                                      ) : (
                                        <span className="text-[10px] font-bold text-emerald-500">Paid ✓</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
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

        {/* Edit Borrower Profile & Documents Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Borrower Profile & Documents"
          maxWidth="max-w-2xl"
        >
          {editFormError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {editFormError}
            </div>
          )}

          <form onSubmit={handleSubmitEditProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="9876543210"
                  value={editFormData.mobile}
                  onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={editFormData.whatsappNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, whatsappNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Address</label>
              <input
                type="text"
                placeholder="Flat / Street address..."
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">City</label>
                <input
                  type="text"
                  placeholder="Mumbai"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">State</label>
                <input
                  type="text"
                  placeholder="Maharashtra"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">PIN Code</label>
                <input
                  type="text"
                  placeholder="400053"
                  value={editFormData.pincode}
                  onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800 pt-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ID Proof Type (Optional)</label>
                <select
                  value={editFormData.idProofType}
                  onChange={(e) => setEditFormData({ ...editFormData, idProofType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Select ID Type --</option>
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ID Proof Number</label>
                <input
                  type="text"
                  placeholder="Number string..."
                  value={editFormData.idProofNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, idProofNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Photo & Document Upload Section */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <label className="block text-slate-300 font-bold text-xs uppercase tracking-wider">
                Borrower Photos & Documents
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Profile Photo */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 text-center">
                  <span className="text-slate-300 font-semibold block text-xs">Profile Photo</span>
                  {editFormData.profileImage ? (
                    <div className="relative group w-20 h-20 mx-auto">
                      <img src={getImageUrl(editFormData.profileImage)} alt="Profile" className="w-20 h-20 rounded-xl object-cover border border-blue-500/40" />
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, profileImage: '' })}
                        className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-500 transition shadow"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-800 hover:border-blue-500/60 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition min-h-[80px]">
                      <Camera className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-medium">Upload Profile</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSimpleFileSelect(e, 'profileImage')} />
                    </label>
                  )}
                </div>

                {/* ID Proof Photo */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 text-center">
                  <span className="text-slate-300 font-semibold block text-xs">ID Proof Photo</span>
                  {editFormData.idProofImage ? (
                    <div className="relative group w-20 h-20 mx-auto">
                      <img src={getImageUrl(editFormData.idProofImage)} alt="ID Proof" className="w-20 h-20 rounded-xl object-cover border border-purple-500/40" />
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, idProofImage: '' })}
                        className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-500 transition shadow"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-800 hover:border-purple-500/60 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition min-h-[80px]">
                      <ImageIcon className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-medium">Upload ID Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSimpleFileSelect(e, 'idProofImage')} />
                    </label>
                  )}
                </div>

                {/* Cheque Photo */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 text-center">
                  <span className="text-slate-300 font-semibold block text-xs">Cheque Photo</span>
                  {editFormData.chequeImage ? (
                    <div className="relative group w-20 h-20 mx-auto">
                      <img src={getImageUrl(editFormData.chequeImage)} alt="Cheque" className="w-20 h-20 rounded-xl object-cover border border-amber-500/40" />
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, chequeImage: '' })}
                        className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-500 transition shadow"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-800 hover:border-amber-500/60 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition min-h-[80px]">
                      <FileText className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-medium">Upload Cheque</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSimpleFileSelect(e, 'chequeImage')} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Notes / Relationship Details</label>
              <textarea
                rows="2"
                placeholder="Internal remarks..."
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingEdit}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-900/30"
              >
                {submittingEdit ? 'Saving...' : 'Update Borrower Profile'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Full Image Preview Modal */}
        {previewImage && (
          <Modal
            isOpen={!!previewImage}
            onClose={() => setPreviewImage(null)}
            title={previewImage.title || 'Document Preview'}
            maxWidth="max-w-lg"
          >
            <div className="text-center space-y-4 py-2">
              <img src={previewImage.url} alt="Document" className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-800" />
              <button
                onClick={() => setPreviewImage(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Close Preview
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default PersonDetail;
