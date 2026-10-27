import React from 'react';
import { Outlet } from 'react-router-dom';
import { DisclaimerBanner } from './DisclaimerBanner';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      <DisclaimerBanner />
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-900 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
