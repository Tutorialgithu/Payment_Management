import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Plus, Bell, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ onToggleSidebar, onOpenReceivePayment, onOpenAddPerson, onOpenAddAccount }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/people?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Mobile Sidebar Toggle & Search */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Search */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-64 lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search borrower name, mobile, loan account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </form>

          {/* Mobile Search Toggle Icon */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            title="Toggle Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Fixed Receive Payment Button & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* FIXED RECEIVE PAYMENT BUTTON ON TOP HEADER */}
          <button
            onClick={onOpenReceivePayment}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] sm:text-xs shadow-lg shadow-emerald-900/30 transition border border-emerald-500/30 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="truncate">Receive Payment</span>
          </button>

          <button
            onClick={onOpenAddPerson}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Person</span>
          </button>

          <button
            onClick={() => navigate('/notifications')}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 relative transition shrink-0"
            title="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800 transition"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                {admin?.name ? admin.name.charAt(0) : 'A'}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-white">
                {admin?.name || 'Admin'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-white">{admin?.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{admin?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 transition"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Admin Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/audit-logs');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 transition"
                >
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Audit Logs</span>
                </button>

                <div className="border-t border-slate-800 my-1"></div>

                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {showMobileSearch && (
        <div className="pt-2 md:hidden animate-fadeIn">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search borrower name, mobile, loan account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </form>
        </div>
      )}
    </header>
  );
};

export default Navbar;
