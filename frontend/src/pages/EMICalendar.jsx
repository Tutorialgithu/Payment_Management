import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import Badge from '../components/common/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMICalendar = ({ onOpenReceivePayment }) => {
  const { admin } = useAuth();
  const symbol = admin?.currencySymbol || '₹';

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [upcomingEmis, setUpcomingEmis] = useState([]);
  const [overdueEmis, setOverdueEmis] = useState([]);
  const [selectedDateEMIs, setSelectedDateEMIs] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  useEffect(() => {
    api.get('/emi/upcoming').then((res) => {
      if (res.success) setUpcomingEmis(res.emis);
    });
    api.get('/emi/overdue').then((res) => {
      if (res.success) setOverdueEmis(res.emis);
    });
  }, [currentMonth]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Combine all EMIs for month lookup
  const allEMIs = [...upcomingEmis, ...overdueEmis];

  const getEMIsForDay = (day) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allEMIs.filter((e) => {
      const eDate = new Date(e.dueDate);
      return (
        eDate.getFullYear() === year &&
        eDate.getMonth() === month &&
        eDate.getDate() === day
      );
    });
  };

  const handleDateClick = (day) => {
    const list = getEMIsForDay(day);
    const dateFormatted = new Date(year, month, day).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    setSelectedDateStr(dateFormatted);
    setSelectedDateEMIs(list);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Due Calendar</h1>
          <p className="text-xs text-slate-400">Visual schedule of upcoming and overdue EMI repayment dates</p>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white">
            {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 uppercase">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 bg-slate-950/20 rounded-xl border border-transparent"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEmis = getEMIsForDay(day);
            const hasOverdue = dayEmis.some((e) => e.status === 'overdue');
            const hasUpcoming = dayEmis.some((e) => e.status === 'upcoming' || e.status === 'due_today');

            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`h-24 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  dayEmis.length > 0
                    ? hasOverdue
                      ? 'bg-rose-500/10 border-rose-500/40 hover:border-rose-400'
                      : 'bg-blue-500/10 border-blue-500/40 hover:border-blue-400'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-bold text-white">{day}</span>

                {dayEmis.length > 0 && (
                  <div className="space-y-1">
                    <span className="block text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-900 text-slate-200 truncate">
                      {dayEmis.length} EMI{dayEmis.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Inspector Drawer */}
      {selectedDateEMIs && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">EMIs Due on {selectedDateStr}</h3>
            <button
              onClick={() => setSelectedDateEMIs(null)}
              className="text-xs font-semibold text-slate-400 hover:text-white"
            >
              Close Inspector
            </button>
          </div>

          <div className="space-y-3">
            {selectedDateEMIs.map((e) => (
              <div key={e._id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-white">{e.personId?.name} ({e.personId?.mobile})</p>
                  <p className="text-slate-400">Account: {e.accountId?.accountNumber} • EMI #{e.emiNumber}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-extrabold text-white text-sm">{symbol}{e.remainingAmount?.toLocaleString()}</p>
                  <Badge status={e.status} />
                </div>
              </div>
            ))}

            {selectedDateEMIs.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No EMIs due on this specific date.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EMICalendar;
