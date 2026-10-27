import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Download,
  Plus,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Application } from '../types';
import { Card } from '../components/UI/Card';
import { Badge, getStatusBadgeVariant } from '../components/UI/Badge';

export const ApplicationsPage: React.FC = () => {
  const { activeRole } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (overdueOnly) params.overdue = 'true';

      const res = await api.getApplications(params);
      setApplications(res.applications || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [categoryFilter, statusFilter, overdueOnly, activeRole]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleExportCsv = () => {
    window.open(api.exportCsvUrl(), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-brand-400" />
            <span>Application Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track, filter, and review technical education approval cases across all workflow stages
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
          {['institution', 'admin'].includes(activeRole) && (
            <Link
              to="/applications/new"
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Application</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative sm:col-span-2">
            <input
              type="text"
              placeholder="Search by Ref#, Institution, or AICTE ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg pl-8 pr-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </form>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Categories</option>
              <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
              <option value="Increase in Intake (AI & Data Science)">Increase in Intake</option>
              <option value="Introduction of New Course (Cybersecurity)">Introduction of New Course</option>
              <option value="Establishment of New Technical Institution">Establishment of New Institution</option>
              <option value="Change of Site / Campus Relocation">Change of Site</option>
              <option value="Closure of Non-Viable Diploma Course">Course Closure</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Completeness Check">Under Completeness Check</option>
              <option value="Pending Scrutiny">Pending Scrutiny</option>
              <option value="Returned for Correction">Returned for Correction</option>
              <option value="Pending Re-Scrutiny">Pending Re-Scrutiny</option>
              <option value="Pending EVC">Pending EVC</option>
              <option value="Pending Committee Review">Pending Committee Review</option>
              <option value="Pending Competent Authority Decision">Pending Authority Decision</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Compliance Pending">Compliance Pending</option>
            </select>
          </div>

          {/* Overdue Toggle */}
          <div className="flex items-center">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer bg-slate-800 hover:bg-slate-750 px-3 py-2 rounded-lg border border-slate-700 w-full transition">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className="rounded text-brand-500 focus:ring-0 bg-slate-900 border-slate-600"
              />
              <span className="flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-semibold text-rose-300">Overdue SLA Only</span>
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Applications Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-900/60">
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Institution & Region</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Workflow Route</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Pending</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-medium text-brand-400 whitespace-nowrap">
                    <Link to={`/applications/${app.id}`} className="hover:underline flex items-center space-x-1">
                      <span>{app.application_number}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{app.institution_name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span>{app.city}, {app.state}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">{app.aicte_id}</span>
                      {app.region_code && (
                        <span className="px-1 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                          {app.region_code}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate">
                    {app.category}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {app.workflow_code}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                    <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {app.current_stage}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        app.is_overdue
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'text-slate-400'
                      }`}
                    >
                      {app.days_pending}d {app.is_overdue === 1 && '⚠️'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant={getStatusBadgeVariant(app.status)} dot>
                      {app.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <Link
                      to={`/applications/${app.id}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition inline-flex items-center space-x-1"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {applications.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No applications found matching your criteria.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
