import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, UserCheck, Eye, Edit, Trash2, Send, CreditCard, Wallet, Camera, FileText, Image as ImageIcon, Loader2, X, Check } from 'lucide-react';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { compressImageFile } from '../utils/imageReducer';
import { getImageUrl } from '../utils/imageHelper';

const PeopleList = ({ onOpenReceivePaymentForPerson, onOpenAddAccountForPerson }) => {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State for Add / Edit Person
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
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
  const [previewImage, setPreviewImage] = useState(null);

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/people?search=${encodeURIComponent(search)}&status=${status}&page=${page}&limit=10`);
      if (res.success) {
        setPeople(res.people);
        setTotalPages(res.pages);
      }
    } catch (err) {
      console.error('Failed to fetch people:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [search, status, page]);

  // Simple File Select Handler
  const handleSimpleFileSelect = (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAdd = () => {
    setEditingPerson(null);
    setFormData({
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
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name || '',
      mobile: person.mobile || '',
      whatsappNumber: person.whatsappNumber || '',
      alternateMobile: person.alternateMobile || '',
      email: person.email || '',
      address: person.address || '',
      city: person.city || '',
      state: person.state || '',
      pincode: person.pincode || '',
      idProofType: person.idProofType || '',
      idProofNumber: person.idProofNumber || '',
      profileImage: person.profileImage || person.photo || '',
      idProofImage: person.idProofImage || '',
      chequeImage: person.chequeImage || '',
      notes: person.notes || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editingPerson) {
        await api.put(`/people/${editingPerson._id}`, formData);
        console.log('person edit', editingPerson._id, formData);
      } else {
        await api.post('/people', formData);
      }
      setIsModalOpen(false);
      fetchPeople();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id, name) => {
    if (window.confirm(`Are you sure you want to archive ${name}?`)) {
      try {
        await api.delete(`/people/${id}`);
        fetchPeople();
      } catch (err) {
        alert(err.message || 'Failed to archive person');
      }
    }
  };

  const symbol = admin?.currencySymbol || '₹';

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">People Directory</h1>
          <p className="text-xs text-slate-400">Directory of borrowers, financial health, and KYC documents</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Borrower</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="active">Active Borrowers</option>
            <option value="archived">Archived</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Table Listing Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-4 w-12 text-center">S.No.</th>
                <th className="p-4">Borrower</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Total Given</th>
                <th className="p-4">Expected</th>
                <th className="p-4">Received</th>
                <th className="p-4">Outstanding</th>
                <th className="p-4">Overdue</th>
                <th className="p-4">Documents</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {people.map((person, index) => (
                <tr key={person._id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 text-center font-bold text-slate-400 text-xs">
                    {(page - 1) * 10 + index + 1}
                  </td>
                  <td className="p-4 font-bold text-white">
                    <div className="flex items-center gap-3">
                      {person.profileImage || person.photo ? (
                        <img
                          src={(person.profileImage || person.photo)}
                          alt={person.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow shrink-0 cursor-pointer"
                          onClick={() => setPreviewImage({ url: person.profileImage || person.photo, title: `${person.name}'s Profile Photo` })}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=2563eb&color=fff&size=64`;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow shrink-0">
                          {person.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <button
                          onClick={() => navigate(`/people/${person._id}`)}
                          className="hover:text-blue-400 transition text-left font-bold text-xs"
                        >
                          {person.name}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono">{person.mobile}</td>
                  <td className="p-4 font-semibold text-slate-200">{symbol}{(person.totalGiven || 0).toLocaleString()}</td>
                  <td className="p-4 font-semibold text-slate-200">{symbol}{(person.expectedReturn || 0).toLocaleString()}</td>
                  <td className="p-4 font-bold text-emerald-400">{symbol}{(person.totalReceived || 0).toLocaleString()}</td>
                  <td className="p-4 font-bold text-rose-400">{symbol}{(person.outstanding || 0).toLocaleString()}</td>
                  <td className="p-4 font-bold text-rose-500">
                    {person.overdue > 0 ? `${symbol}${person.overdue.toLocaleString()}` : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      {person.idProofImage ? (
                        <button
                          onClick={() => setPreviewImage({ url: getImageUrl(person.idProofImage), title: `${person.name}'s ID Proof Photo (${person.idProofType || 'ID'})` })}
                          className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold text-[10px] transition flex items-center gap-1"
                          title="View ID Proof Image"
                        >
                          <span>ID Proof 📄</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[10px] italic">No ID</span>
                      )}

                      {person.chequeImage ? (
                        <button
                          onClick={() => setPreviewImage({ url: getImageUrl(person.chequeImage), title: `${person.name}'s Guarantee Cheque Image` })}
                          className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold text-[10px] transition flex items-center gap-1"
                          title="View Cheque Image"
                        >
                          <span>Cheque 🏷️</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[10px] italic">No Cheque</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge status={person.status} />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => navigate(`/people/${person._id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenAddAccountForPerson?.(person._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition"
                        title="Add Loan Account"
                      >
                        <Wallet className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenReceivePaymentForPerson?.(person._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                        title="Receive Payment"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(person)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                        title="Edit Borrower"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleArchive(person._id, person.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Archive Person"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && people.length === 0 && (
                <tr>
                  <td colSpan="11" className="p-8 text-center text-slate-500">
                    No borrowers found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60 text-xs">
            <span className="text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Person Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPerson ? 'Edit Borrower Information' : 'Add New Borrower'}
        maxWidth="max-w-2xl"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Rahul Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mobile Number *</label>
              <input
                type="text"
                required
                placeholder="9876543210"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
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
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                placeholder="rahul@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Address</label>
            <input
              type="text"
              placeholder="Flat / Street address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">City</label>
              <input
                type="text"
                placeholder="Mumbai"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">State</label>
              <input
                type="text"
                placeholder="Maharashtra"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">PIN Code</label>
              <input
                type="text"
                placeholder="400053"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800 pt-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">ID Proof Type (Optional)</label>
              <select
                value={formData.idProofType}
                onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
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
                value={formData.idProofNumber}
                onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
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
                {formData.profileImage ? (
                  <div className="relative group w-20 h-20 mx-auto">
                    <img src={getImageUrl(formData.profileImage)} alt="Profile" className="w-20 h-20 rounded-xl object-cover border border-blue-500/40" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profileImage: '' })}
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
                {formData.idProofImage ? (
                  <div className="relative group w-20 h-20 mx-auto">
                    <img src={getImageUrl(formData.idProofImage)} alt="ID Proof" className="w-20 h-20 rounded-xl object-cover border border-purple-500/40" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, idProofImage: '' })}
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
                {formData.chequeImage ? (
                  <div className="relative group w-20 h-20 mx-auto">
                    <img src={getImageUrl(formData.chequeImage)} alt="Cheque" className="w-20 h-20 rounded-xl object-cover border border-amber-500/40" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, chequeImage: '' })}
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
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-900/30"
            >
              {submitting ? 'Saving...' : editingPerson ? 'Update Person' : 'Save Person'}
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
  );
};

export default PeopleList;
