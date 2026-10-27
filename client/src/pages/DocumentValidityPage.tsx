import React, { useState, useEffect } from 'react';
import {
  ClockAlert,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Calendar,
  Building,
  Mail,
  Send,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DocumentValidity } from '../types';
import { Card } from '../components/UI/Card';
import { Badge, getStatusBadgeVariant } from '../components/UI/Badge';

export const DocumentValidityPage: React.FC = () => {
  const { activeRole } = useAuth();
  const [records, setRecords] = useState<DocumentValidity[]>([]);
  const [counts, setCounts] = useState<any>({ total: 0, expired: 0, expiringSoon: 0, valid: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const fetchValidity = async (f = filter) => {
    try {
      setLoading(true);
      const res = await api.getValidityRecords(f === 'ALL' ? undefined : f.toLowerCase());
      setRecords(res.records || []);
      if (res.counts) setCounts(res.counts);
    } catch (err) {
      console.error('Error fetching validity records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValidity();
  }, [filter, activeRole]);

  const handleSendReminder = async (id: string) => {
    try {
      setRemindingId(id);
      const res = await api.sendValidityReminder(id);
      alert(res.message);
      fetchValidity();
    } catch (err: any) {
      alert('Reminder error: ' + err.message);
    } finally {
      setRemindingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <ClockAlert className="w-5 h-5 text-brand-400" />
          <span>Document Validity Radar & Expiry Tracker</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Proactive monitoring of lease deeds, fire safety NOCs, structural stability, and municipal clearance certificates
        </p>
      </div>

      {/* Radar Counts Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setFilter('ALL')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filter === 'ALL' ? 'bg-slate-800 border-brand-500 shadow-md' : 'bg-slate-850 border-slate-800'
          }`}
        >
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Monitored Documents</span>
          <div className="text-2xl font-extrabold text-white mt-1">{counts.total}</div>
          <span className="text-xs text-slate-500">Active Records</span>
        </div>

        <div
          onClick={() => setFilter('expired')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filter === 'expired' ? 'bg-rose-500/15 border-rose-500 shadow-md' : 'bg-slate-850 border-slate-800'
          }`}
        >
          <span className="text-[11px] text-rose-400 uppercase font-bold tracking-wider">Expired Documents</span>
          <div className="text-2xl font-extrabold text-rose-300 mt-1">{counts.expired}</div>
          <span className="text-xs text-rose-400/80">Immediate Action Required</span>
        </div>

        <div
          onClick={() => setFilter('30d')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filter === '30d' ? 'bg-amber-500/15 border-amber-500 shadow-md' : 'bg-slate-850 border-slate-800'
          }`}
        >
          <span className="text-[11px] text-amber-400 uppercase font-bold tracking-wider">Expiring in ≤ 30 Days</span>
          <div className="text-2xl font-extrabold text-amber-300 mt-1">{counts.expiringSoon}</div>
          <span className="text-xs text-amber-400/80">Renewal Reminders Active</span>
        </div>

        <div
          onClick={() => setFilter('7d')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            filter === '7d' ? 'bg-purple-500/15 border-purple-500 shadow-md' : 'bg-slate-850 border-slate-800'
          }`}
        >
          <span className="text-[11px] text-purple-400 uppercase font-bold tracking-wider">Expiring in ≤ 7 Days</span>
          <div className="text-2xl font-extrabold text-purple-300 mt-1">
            {records.filter(r => r.days_until_expiry >= 0 && r.days_until_expiry <= 7).length}
          </div>
          <span className="text-xs text-purple-400/80">Critical Urgency</span>
        </div>
      </div>

      {/* Validity Records Table */}
      <Card title="Document Expiry Schedule" subtitle="Sorted by nearest expiry date">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-900/60">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Issuing Authority</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-center">Days Remaining</th>
                <th className="py-3 px-4">Responsible Person</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {records.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{doc.document_title}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{doc.document_number}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{doc.institution_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{doc.aicte_id}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {doc.issuing_authority}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {doc.issue_date}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    {doc.expiry_date}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        doc.days_until_expiry < 0
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : doc.days_until_expiry <= 30
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {doc.days_until_expiry < 0
                        ? `Expired ${Math.abs(doc.days_until_expiry)}d ago`
                        : `${doc.days_until_expiry} days left`}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-200">{doc.responsible_person}</div>
                    <div className="text-[11px] text-slate-400">{doc.contact_email}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleSendReminder(doc.id)}
                      disabled={remindingId === doc.id}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-brand-300 border border-slate-700 rounded text-xs font-semibold flex items-center space-x-1 ml-auto transition"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{remindingId === doc.id ? 'Sending...' : 'Remind'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {records.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No document validity records found for current filter.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
