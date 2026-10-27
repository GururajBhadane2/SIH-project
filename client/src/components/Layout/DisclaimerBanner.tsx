import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-500 text-slate-950 font-medium px-4 py-1.5 text-xs flex items-center justify-between shadow-inner">
      <div className="flex items-center space-x-2 mx-auto">
        <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
        <span>
          <strong className="font-bold tracking-wide">STUDENT PROTOTYPE — NOT AN OFFICIAL AICTE SYSTEM</strong> &nbsp;|&nbsp;
          Smart India Hackathon 2026 (SIH26262) &nbsp;|&nbsp;
          Synthetic Demonstration Records
        </span>
      </div>
    </div>
  );
};
