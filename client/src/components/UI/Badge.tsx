import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  dot = false
}) => {
  const variantStyles: Record<string, string> = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    neutral: 'bg-slate-700/50 text-slate-300 border-slate-600',
    info: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-300 border-red-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
  };

  const dotColors: Record<string, string> = {
    default: 'bg-slate-400',
    neutral: 'bg-slate-400',
    info: 'bg-blue-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    purple: 'bg-purple-400'
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}></span>}
      <span>{children}</span>
    </span>
  );
};

export function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const s = status.toLowerCase();
  if (s.includes('approved') || s.includes('verified') || s.includes('complete') || s.includes('pass')) return 'success';
  if (s.includes('returned') || s.includes('deficient') || s.includes('expiring') || s.includes('clarification')) return 'warning';
  if (s.includes('reject') || s.includes('overdue') || s.includes('expired') || s.includes('failed')) return 'danger';
  if (s.includes('scrutiny') || s.includes('submitted') || s.includes('evc') || s.includes('committee') || s.includes('check')) return 'info';
  return 'neutral';
}
