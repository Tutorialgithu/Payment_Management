import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Plus } from 'lucide-react';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import ReceivePaymentModal from './pages/ReceivePaymentModal';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PeopleList from './pages/PeopleList';
import PersonDetail from './pages/PersonDetail';
import AccountList from './pages/AccountList';
import AccountForm from './pages/AccountForm';
import PaymentsList from './pages/PaymentsList';
import EMICalendar from './pages/EMICalendar';
import NotificationsList from './pages/NotificationsList';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';

const ProtectedLayout = () => {
  const { admin, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Payment Modal State
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [modalPersonId, setModalPersonId] = useState(null);
  const [modalAccountId, setModalAccountId] = useState(null);

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-semibold text-sm">
        Authenticating Admin Session...
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  const handleOpenReceivePayment = (personId = null, accountId = null) => {
    setModalPersonId(personId);
    setModalAccountId(accountId);
    setIsReceiveModalOpen(true);
  };

  const handleOpenAddPerson = () => {
    navigate('/people');
  };

  const handleOpenAddAccount = (personId = null) => {
    if (personId) {
      navigate(`/accounts/add?personId=${personId}`);
    } else {
      navigate('/accounts/add');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenReceivePayment={() => handleOpenReceivePayment()}
        onOpenAddAccount={() => handleOpenAddAccount()}
        onOpenAddPerson={handleOpenAddPerson}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenReceivePayment={() => handleOpenReceivePayment()}
          onOpenAddPerson={handleOpenAddPerson}
          onOpenAddAccount={() => handleOpenAddAccount()}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  onOpenReceivePayment={() => handleOpenReceivePayment()}
                  onOpenAddPerson={handleOpenAddPerson}
                  onOpenAddAccount={() => handleOpenAddAccount()}
                />
              }
            />
            <Route
              path="/people"
              element={
                <PeopleList
                  onOpenReceivePaymentForPerson={(pId) => handleOpenReceivePayment(pId)}
                  onOpenAddAccountForPerson={(pId) => handleOpenAddAccount(pId)}
                />
              }
            />
            <Route
              path="/people/:id"
              element={
                <PersonDetail
                  onOpenReceivePaymentForPerson={(pId) => handleOpenReceivePayment(pId)}
                  onOpenAddAccountForPerson={(pId) => handleOpenAddAccount(pId)}
                />
              }
            />
            <Route
              path="/accounts"
              element={
                <AccountList
                  onOpenReceivePaymentForAccount={(pId, aId) => handleOpenReceivePayment(pId, aId)}
                />
              }
            />
            <Route path="/accounts/add" element={<AccountForm />} />
            <Route
              path="/payments"
              element={<PaymentsList onOpenReceivePayment={() => handleOpenReceivePayment()} />}
            />
            <Route
              path="/calendar"
              element={<EMICalendar onOpenReceivePayment={() => handleOpenReceivePayment()} />}
            />
            <Route path="/notifications" element={<NotificationsList />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Sticky Mobile Floating Action Button (Receive Payment) */}
      <button
        onClick={() => handleOpenReceivePayment()}
        className="fixed bottom-5 right-5 z-40 sm:hidden flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full font-extrabold text-xs shadow-2xl shadow-emerald-950/90 border border-emerald-400/40 transition active:scale-95"
        aria-label="Receive Payment"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>Receive Payment</span>
      </button>

      {/* Global Receive Payment Modal */}
      <ReceivePaymentModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        onSuccess={() => {
          // Trigger page reload or refresh
          window.location.reload();
        }}
        initialPersonId={modalPersonId}
        initialAccountId={modalAccountId}
      />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
