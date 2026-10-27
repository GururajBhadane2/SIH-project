import React, { useState } from 'react';
import {
  Settings,
  RefreshCw,
  Database,
  Shield,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';

export const SettingsPage: React.FC = () => {
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset all synthetic applications, documents, and audit logs to the pristine demonstration baseline?')) {
      try {
        setResetting(true);
        await api.resetDemoData();
        setResetSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        alert('Reset error: ' + err.message);
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <Settings className="w-5 h-5 text-brand-400" />
          <span>System Settings & Demonstration Sandbox Controls</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure notification thresholds, manage database persistence, and reset synthetic seed data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Synthetic Demo Controls */}
        <Card title="Demonstration Mode & Sandbox Reset" subtitle="Smart India Hackathon 2026 Evaluation Controls">
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              AICTE FlowX operates with synthetic demonstration records. You can reset all applications, documents, EVC visits, and audit logs to the initial baseline at any time.
            </p>

            {resetSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-lg flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Database successfully reset to baseline! Reloading...</span>
              </div>
            )}

            <button
              onClick={handleResetData}
              disabled={resetting}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold shadow-md flex items-center space-x-2 transition"
            >
              <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetting Database...' : 'Reset All Synthetic Demo Data'}</span>
            </button>
          </div>
        </Card>

        {/* Database & Cloud Integration Details */}
        <Card title="Database & Supabase Connection" subtitle="Cloud PostgreSQL and local persistence status">
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[11px]">Supabase Project Reference</span>
              <span className="font-mono text-brand-300 font-bold">ldmqfkjtaqddlmduzayq</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[11px]">Cloud Endpoint</span>
              <span className="font-mono text-slate-300">https://ldmqfkjtaqddlmduzayq.supabase.co</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[11px]">Local Zero-Config Storage</span>
              <span className="font-mono text-emerald-400">SQLite (aicte_flowx.db) Active</span>
            </div>
          </div>
        </Card>

        {/* SLA & Notification Timing Configurations */}
        <Card title="Notification & SLA Timers" subtitle="Configurable regulatory reminder intervals">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-300">Scrutiny Standard SLA</span>
              <span className="font-mono font-bold text-white">7 Days</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-300">Deficiency Resubmission Window</span>
              <span className="font-mono font-bold text-white">14 Days</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-300">Document Expiry Reminders</span>
              <span className="font-mono font-bold text-white">60d, 30d, 7d</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-300">Auto-Escalation Interval</span>
              <span className="font-mono font-bold text-white">Every 5 Minutes</span>
            </div>
          </div>
        </Card>

        {/* Legal Disclaimer */}
        <Card title="Prototype Accreditation" subtitle="Smart India Hackathon 2026 Guidelines">
          <div className="space-y-2 text-xs text-slate-400">
            <p>
              This application is a student innovation prototype built for the Smart India Hackathon 2026 under problem statement <strong>SIH26262</strong>.
            </p>
            <p>
              It is not endorsed by or affiliated with the official All India Council for Technical Education (AICTE), Ministry of Education, Government of India.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
