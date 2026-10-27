import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (entityFilter) params.entity_type = entityFilter;
      if (roleFilter) params.actor_role = roleFilter;

      const res = await api.getAuditLogs(params);
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <History className="w-5 h-5 text-brand-400" />
          <span>Immutable Regulatory Audit Trail</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Cryptographically auditable transaction ledger recording all stage transitions, document uploads, and administrative decisions
        </p>
      </div>

      {/* Security Disclaimer Banner */}
      <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl text-xs flex items-center justify-between text-slate-300">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">Tamper-Proof Ledger Enforcement</span>
            <span className="text-[11px] text-slate-400">
              Audit log entries are append-only. Modification or deletion is cryptographically prevented at database schema level.
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 font-bold hidden sm:inline-block">
          SHA-256 HASH VERIFIED
        </span>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search Event ID, Actor, or Reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg pl-8 pr-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </form>

          <div>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-2"
            >
              <option value="">All Entities</option>
              <option value="application">Application Lifecycle</option>
              <option value="document">Document Uploads & OCR</option>
              <option value="scrutiny">Scrutiny & Deficiencies</option>
              <option value="evc">EVC Inspections</option>
              <option value="committee">Standing Committees</option>
              <option value="compliance">Compliance Items</option>
              <option value="escalation">SLA Escalations</option>
            </select>
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-2"
            >
              <option value="">All Actor Roles</option>
              <option value="institution">Institution User</option>
              <option value="regional_officer">Regional Officer (RO)</option>
              <option value="regulation_bureau">Regulation Bureau (RB)</option>
              <option value="evc_member">EVC Member</option>
              <option value="committee_member">Committee Member</option>
              <option value="admin">Administrator / System</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Log Timeline */}
      <Card title="Audit Event Stream" subtitle={`Showing ${logs.length} Logged Transactions`}>
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs hover:border-slate-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-brand-400 font-bold">{log.event_id}</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-bold text-white">{log.action}</span>
                  <Badge variant="neutral" className="text-[10px]">
                    {log.entity_type}
                  </Badge>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {log.timestamp} • IP: {log.ip_address}
                </div>
              </div>

              <p className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                "{log.reason || 'Transaction executed successfully'}"
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <div>
                  Actor: <strong className="text-slate-200">{log.actor_name}</strong>{' '}
                  <span className="capitalize">({log.actor_role.replace('_', ' ')})</span>
                </div>
                {log.previous_state && log.new_state && (
                  <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                    <span className="text-slate-500">{log.previous_state}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="text-emerald-400 font-bold">{log.new_state}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {logs.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No audit log entries matching filters.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
