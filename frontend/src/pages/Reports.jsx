import React, { useState, useEffect } from 'react';
import { FileBarChart, Download, Calendar, Filter } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const { admin } = useAuth();
  const symbol = admin?.currencySymbol || '₹';

  const [activeTab, setActiveTab] = useState('collection');

  // Collection Report State
  const [collectionData, setCollectionData] = useState([]);
  const [loadingCollection, setLoadingCollection] = useState(false);

  // Overdue Report State
  const [overdueData, setOverdueData] = useState([]);
  const [loadingOverdue, setLoadingOverdue] = useState(false);

  // EMI Report State
  const [emiData, setEmiData] = useState([]);
  const [emiStatusFilter, setEmiStatusFilter] = useState('all');

  // Date-wise Report State
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateWiseData, setDateWiseData] = useState([]);
  const [dateWiseTotal, setDateWiseTotal] = useState(0);

  useEffect(() => {
    if (activeTab === 'collection') {
      setLoadingCollection(true);
      api.get('/reports/collection').then((res) => {
        if (res.success) setCollectionData(res.data);
        setLoadingCollection(false);
      });
    } else if (activeTab === 'overdue') {
      setLoadingOverdue(true);
      api.get('/reports/overdue').then((res) => {
        if (res.success) setOverdueData(res.data);
        setLoadingOverdue(false);
      });
    } else if (activeTab === 'emi') {
      api.get(`/reports/emi?status=${emiStatusFilter}`).then((res) => {
        if (res.success) setEmiData(res.data);
      });
    } else if (activeTab === 'date-wise') {
      api.get(`/reports/date-wise?startDate=${startDate}&endDate=${endDate}`).then((res) => {
        if (res.success) {
          setDateWiseData(res.data);
          setDateWiseTotal(res.totalCollected);
        }
      });
    }
  }, [activeTab, emiStatusFilter, startDate, endDate]);

  const handleExport = (reportType, format) => {
    let url = `/api/reports/${reportType}?format=${format}`;
    if (reportType === 'emi') url += `&status=${emiStatusFilter}`;
    if (reportType === 'date-wise') url += `&startDate=${startDate}&endDate=${endDate}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Financial Reports & Exports</h1>
          <p className="text-xs text-slate-400">Generate, view, and export detailed lending & collection spreadsheets</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('collection')}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition ${
            activeTab === 'collection' ? 'border-blue-500 text-blue-400 bg-slate-900/40' : 'border-transparent text-slate-400'
          }`}
        >
          Collection Report
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition ${
            activeTab === 'overdue' ? 'border-blue-500 text-blue-400 bg-slate-900/40' : 'border-transparent text-slate-400'
          }`}
        >
          Overdue Report
        </button>

        <button
          onClick={() => setActiveTab('emi')}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition ${
            activeTab === 'emi' ? 'border-blue-500 text-blue-400 bg-slate-900/40' : 'border-transparent text-slate-400'
          }`}
        >
          EMI Breakdown Report
        </button>

        <button
          onClick={() => setActiveTab('date-wise')}
          className={`px-4 py-3 font-semibold text-xs border-b-2 transition ${
            activeTab === 'date-wise' ? 'border-blue-500 text-blue-400 bg-slate-900/40' : 'border-transparent text-slate-400'
          }`}
        >
          Date-Wise Custom Report
        </button>
      </div>

      {/* Report Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        {/* Export Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {activeTab.replace('-', ' ')} Summary
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport(activeTab, 'excel')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => handleExport(activeTab, 'csv')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* COLLECTION REPORT TAB */}
        {activeTab === 'collection' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Account No</th>
                  <th className="p-3">Borrower Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount Given</th>
                  <th className="p-3">Expected Return</th>
                  <th className="p-3">Received</th>
                  <th className="p-3">Outstanding</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {collectionData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-mono font-bold text-blue-400">{row['Account Number']}</td>
                    <td className="p-3 font-bold text-white">{row['Borrower Name']}</td>
                    <td className="p-3 uppercase font-semibold">{row['Repayment Type']}</td>
                    <td className="p-3">{symbol}{row['Amount Given (INR)']?.toLocaleString()}</td>
                    <td className="p-3">{symbol}{row['Expected Return (INR)']?.toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-400">{symbol}{row['Total Received (INR)']?.toLocaleString()}</td>
                    <td className="p-3 font-bold text-rose-400">{symbol}{row['Outstanding (INR)']?.toLocaleString()}</td>
                    <td className="p-3">{row['Status']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* OVERDUE REPORT TAB */}
        {activeTab === 'overdue' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Account No</th>
                  <th className="p-3">Borrower Name</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Overdue Days</th>
                  <th className="p-3">Outstanding Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {overdueData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-mono font-bold text-blue-400">{row['Account Number']}</td>
                    <td className="p-3 font-bold text-white">{row['Borrower Name']}</td>
                    <td className="p-3 font-mono">{row['Mobile']}</td>
                    <td className="p-3 text-slate-400">{row['Due Date']}</td>
                    <td className="p-3 font-bold text-rose-400">{row['Overdue Days']} Days</td>
                    <td className="p-3 font-extrabold text-rose-500">{symbol}{row['Outstanding Overdue (INR)']?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EMI BREAKDOWN REPORT TAB */}
        {activeTab === 'emi' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Filter Status:</span>
              <select
                value={emiStatusFilter}
                onChange={(e) => setEmiStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none"
              >
                <option value="all">All EMI Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="due_today">Due Today</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Account No</th>
                    <th className="p-3">Borrower Name</th>
                    <th className="p-3">EMI #</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">EMI Amount</th>
                    <th className="p-3">Paid Amount</th>
                    <th className="p-3">Remaining</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {emiData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-mono text-blue-400 font-bold">{row['Account Number']}</td>
                      <td className="p-3 font-bold text-white">{row['Borrower Name']}</td>
                      <td className="p-3 font-semibold">#{row['EMI #']}</td>
                      <td className="p-3">{row['Due Date']}</td>
                      <td className="p-3">{symbol}{row['EMI Amount (INR)']?.toLocaleString()}</td>
                      <td className="p-3 font-bold text-emerald-400">{symbol}{row['Paid Amount (INR)']?.toLocaleString()}</td>
                      <td className="p-3 font-bold text-rose-400">{symbol}{row['Remaining (INR)']?.toLocaleString()}</td>
                      <td className="p-3">{row['Status']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DATE-WISE CUSTOM REPORT TAB */}
        {activeTab === 'date-wise' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <label className="text-slate-400 font-semibold">From Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-400 font-semibold">To Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="ml-auto bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-400 font-bold">
                Total Collected in Range: {symbol}{dateWiseTotal.toLocaleString()}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Borrower</th>
                    <th className="p-3">Account No</th>
                    <th className="p-3">Amount Received</th>
                    <th className="p-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {dateWiseData.map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-mono font-bold text-blue-400">{row['Receipt No.']}</td>
                      <td className="p-3 text-slate-400">{row['Payment Date']}</td>
                      <td className="p-3 font-bold text-white">{row['Borrower Name']}</td>
                      <td className="p-3 font-mono">{row['Account Number']}</td>
                      <td className="p-3 font-extrabold text-emerald-400">{symbol}{row['Amount Received (INR)']?.toLocaleString()}</td>
                      <td className="p-3 uppercase font-semibold">{row['Payment Method']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
