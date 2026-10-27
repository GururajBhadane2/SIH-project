import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';
  trend?: string;
  trendPositive?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'blue',
  trend,
  trendPositive,
  onClick
}) => {
  const colorMap = {
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      bg: 'bg-blue-500/10 text-blue-400',
      glow: 'from-blue-500/5 to-transparent'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'from-emerald-500/5 to-transparent'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bg: 'bg-amber-500/10 text-amber-400',
      glow: 'from-amber-500/5 to-transparent'
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      bg: 'bg-rose-500/10 text-rose-400',
      glow: 'from-rose-500/5 to-transparent'
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      bg: 'bg-purple-500/10 text-purple-400',
      glow: 'from-purple-500/5 to-transparent'
    },
    slate: {
      border: 'border-slate-700 hover:border-slate-600',
      bg: 'bg-slate-800 text-slate-300',
      glow: 'from-slate-700/5 to-transparent'
    }
  };

  const style = colorMap[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-slate-850 rounded-xl border p-5 shadow-lg transition-all relative overflow-hidden ${
        style.border
      } ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
    >
      <div className={`absolute -right-4 -bottom-4 w-28 h-28 bg-gradient-to-tl ${style.glow} rounded-full blur-xl pointer-events-none`}></div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{value}</span>
            {trend && (
              <span
                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                  trendPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {trend}
              </span>
            )}
          </div>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl border border-white/5 ${style.bg} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
