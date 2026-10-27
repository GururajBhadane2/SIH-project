import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  footer
}) => {
  return (
    <div className={`bg-slate-850 border border-slate-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-slate-100 text-sm">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50 text-xs text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
};
