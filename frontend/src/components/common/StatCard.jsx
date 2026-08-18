import React from 'react';

const StatCard = ({ title, value, subtext, icon: Icon, color = 'blue', trend }) => {
  const colorMap = {
    blue: 'from-blue-600/20 to-blue-900/10 text-blue-400 border-blue-500/20',
    green: 'from-emerald-600/20 to-emerald-900/10 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-600/20 to-amber-900/10 text-amber-400 border-amber-500/20',
    rose: 'from-rose-600/20 to-rose-900/10 text-rose-400 border-rose-500/20',
    purple: 'from-purple-600/20 to-purple-900/10 text-purple-400 border-purple-500/20',
    cyan: 'from-cyan-600/20 to-cyan-900/10 text-cyan-400 border-cyan-500/20'
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border bg-gradient-to-br glass-card glass-card-hover ${selectedColor}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 shadow-inner">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</div>
        {subtext && <div className="mt-1 text-xs text-slate-400 font-medium">{subtext}</div>}
      </div>

      {trend && (
        <div className="mt-3 text-xs font-medium text-slate-300 flex items-center gap-1">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
