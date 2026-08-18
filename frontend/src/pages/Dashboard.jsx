import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Plus,
  RefreshCw,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = ({ onOpenReceivePayment, onOpenAddPerson, onOpenAddAccount }) => {
  const { admin } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const symbol = admin?.currencySymbol || '₹';
  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  // Status Pie Chart Colors
  const STATUS_COLORS = {
    paid: '#10B981',
    pending: '#3B82F6',
    partial: '#F59E0B',
    overdue: '#EF4444'
  };

  const pieData = [
    { name: 'Paid', value: charts.paymentStatusBreakdown?.paid || 0, color: STATUS_COLORS.paid },
    { name: 'Pending', value: charts.paymentStatusBreakdown?.pending || 0, color: STATUS_COLORS.pending },
    { name: 'Partial', value: charts.paymentStatusBreakdown?.partial || 0, color: STATUS_COLORS.partial },
    { name: 'Overdue', value: charts.paymentStatusBreakdown?.overdue || 0, color: STATUS_COLORS.overdue }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Welcome back, {admin?.name || 'Admin'}</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Live Tracker
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Overview of overall lending portfolio, collections, overdue installments, and activity feed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Stats"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenReceivePayment}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Receive Payment</span>
          </button>

          <button
            onClick={onOpenAddAccount}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Account</span>
          </button>

          <button
            onClick={onOpenAddPerson}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            + Person
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Given"
          value={`${symbol}${(kpis.totalGiven || 0).toLocaleString('en-IN')}`}
          subtext="Total principal lent out"
          icon={ArrowUpRight}
          color="blue"
        />

        <StatCard
          title="Expected Return"
          value={`${symbol}${(kpis.expectedReturn || 0).toLocaleString('en-IN')}`}
          subtext="Principal + interest margin"
          icon={TrendingUp}
          color="purple"
        />

        <StatCard
          title="Total Received"
          value={`${symbol}${(kpis.totalReceived || 0).toLocaleString('en-IN')}`}
          subtext="Collected payments"
          icon={ArrowDownLeft}
          color="green"
        />

        <StatCard
          title="Total Outstanding"
          value={`${symbol}${(kpis.totalOutstanding || 0).toLocaleString('en-IN')}`}
          subtext="Balance to be collected"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Secondary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Overdue</div>
            <div className="text-base font-extrabold text-rose-400">
              {symbol}{(kpis.totalOverdue || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active People</div>
            <div className="text-base font-extrabold text-white">{kpis.totalPeople || 0}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Accounts</div>
            <div className="text-base font-extrabold text-white">{kpis.activeAccountsCount || 0}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Today's Due</div>
            <div className="text-base font-extrabold text-yellow-400">
              {symbol}{(kpis.todaysDueTotal || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Completed Loans</div>
            <div className="text-base font-extrabold text-emerald-400">{kpis.completedAccountsCount || 0}</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collection Bar Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Monthly Collection Trend</h2>
              <p className="text-[11px] text-slate-400">Comparison of Amount Given vs Amount Received</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyCollectionChart || []}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="amountGiven" name="Amount Given" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="amountReceived" name="Amount Received" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">EMI Payment Status</h2>
            <p className="text-[11px] text-slate-400">Distribution of paid, pending, and overdue EMIs</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Status Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highest Outstanding Borrowers */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white tracking-wide">Highest Outstanding Borrowers</h2>
            <button
              onClick={() => navigate('/people')}
              className="text-xs font-semibold text-blue-400 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {(charts.topOutstandingPeople || []).map((person, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                    {person.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{person.name}</p>
                    <p className="text-[10px] text-slate-400">{person.mobile}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Outstanding</span>
                  <p className="text-xs font-extrabold text-rose-400">{symbol}{person.outstanding?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}

            {(!charts.topOutstandingPeople || charts.topOutstandingPeople.length === 0) && (
              <p className="text-xs text-slate-500 text-center py-6">No outstanding balances found.</p>
            )}
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Recent Activity Feed</span>
            </h2>
            <button
              onClick={() => navigate('/audit-logs')}
              className="text-xs font-semibold text-blue-400 hover:underline"
            >
              Audit Trail
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {(data?.recentActivities || []).map((act) => (
              <div key={act._id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-blue-400 text-[11px] uppercase tracking-wider">{act.action}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(act.createdAt).toLocaleString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short'
                    })}
                  </span>
                </div>
                <p className="text-slate-300 font-medium">{act.description}</p>
              </div>
            ))}

            {(!data?.recentActivities || data.recentActivities.length === 0) && (
              <p className="text-xs text-slate-500 text-center py-6">No recent activity logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
