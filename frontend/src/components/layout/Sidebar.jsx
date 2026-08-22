import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  Calendar,
  Bell,
  FileBarChart,
  Settings,
  ShieldAlert,
  LogOut,
  X,
  PlusCircle,
  Landmark
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import img from '../../assets/acgback.png'
import img1 from '../../assets/acgback2.png'

const Sidebar = ({ isOpen, onClose, onOpenReceivePayment, onOpenAddAccount, onOpenAddPerson }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'People (Borrowers)', path: '/people', icon: Users },
    { label: 'Loan Accounts', path: '/accounts', icon: Wallet },
    { label: 'Payment Ledger', path: '/payments', icon: CreditCard },
    { label: 'Due Calendar', path: '/calendar', icon: Calendar },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Financial Reports', path: '/reports', icon: FileBarChart },
    { label: 'Admin Settings', path: '/settings', icon: Settings },
    { label: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand Header */}
        <div className="h-16 mt-4 px-6 flex justify-center items-center">
          <div className="flex justify-center items-center gap-3">
            <div className="p-2 w-40 rounded-xl">
              {/* <Landmark classNme="w-6 h-6" /> */}
              <img src={img} alt="Logo" />
            </div>
            {/* <div>
              <h1 className="font-bold text-white tracking-wide text-sm leading-tight">
                {admin?.businessName || 'Lending Tracker'}
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-400">
                Single Admin Portal
              </span>
            </div> */}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="p-4 border-b border-slate-800/60 bg-slate-950/40 space-y-2">
          <button
            onClick={() => {
              onClose?.();
              onOpenReceivePayment?.();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Receive Payment
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose?.();
                onOpenAddPerson?.();
              }}
              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition text-center"
            >
              + Person
            </button>
            <button
              onClick={() => {
                onClose?.();
                onOpenAddAccount?.();
              }}
              className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition text-center"
            >
              + Loan
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Admin Session Box */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {admin?.name ? admin.name.charAt(0) : 'A'}
              </div> */}
              <img src={img1} alt="logo" className='h-12 w-12' />
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{admin?.name || 'Administrator'}</div>
                <div className="text-[10px] text-slate-400 truncate">{admin?.email || 'admin@tracker.com'}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout Admin"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
