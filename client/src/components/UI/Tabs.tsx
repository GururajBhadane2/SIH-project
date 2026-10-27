import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`border-b border-slate-800 flex space-x-1 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${
              isActive
                ? 'border-brand-500 text-brand-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
