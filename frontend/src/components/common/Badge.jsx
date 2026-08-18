import React from 'react';

const Badge = ({ status = '', children, className = '' }) => {
  const normalized = (status || children || '').toString().toLowerCase();

  let colorStyle = 'bg-slate-800 text-slate-300 border-slate-700';

  if (normalized.includes('paid') || normalized.includes('completed')) {
    colorStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (normalized.includes('upcoming') || normalized.includes('active')) {
    colorStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  } else if (normalized.includes('partial')) {
    colorStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (normalized.includes('overdue')) {
    colorStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (normalized.includes('due_today') || normalized.includes('due today')) {
    colorStyle = 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30 animate-pulse';
  } else if (normalized.includes('cancelled') || normalized.includes('archived')) {
    colorStyle = 'bg-slate-700/50 text-slate-400 border-slate-600';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {children || status.toUpperCase()}
    </span>
  );
};

export default Badge;
