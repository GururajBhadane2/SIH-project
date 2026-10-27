import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ClockAlert,
  AlertTriangle,
  RotateCcw,
  CalendarDays,
  ShieldCheck,
  FileCheck2,
  TrendingUp,
  Search,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Building,
  UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Application } from '../types';
import { StatCard } from '../components/UI/StatCard';
import { Card } from '../components/UI/Card';
import { Badge, getStatusBadgeVariant } from '../components/UI/Badge';

export const DashboardPage: React.FC = () => {
  const { user, activeRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [queueApps, setQueueApps] = useState<Application[]>([]);
  const [queueFilter, setQueueFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, appsRes] = await Promise.all([
        api.getAnalytics(),
        api.getApplications()
      ]);
      setKpis(analyticsRes.kpis);
      setCharts(analyticsRes.charts);
      setQueueApps(appsRes.applications || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeRole]);

  // Color schemes for charts
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const filteredQueue = queueApps.filter((app) => {
    const matchesSearch =
      search === '' ||
      app.application_number.toLowerCase().includes(search.toLowerCase()) ||
      app.institution_name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (queueFilter === 'OVERDUE') return app.is_overdue === 1;
    if (queueFilter === 'PENDING') return !['Approved', 'Rejected', 'Withdrawn', 'Draft'].includes(app.status);
    if (queueFilter === 'RETURNED') return app.status === 'Returned for Correction';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Role Context Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-brand-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-400">
              Role Workspace
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-300 capitalize font-medium">
              {activeRole.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Welcome back, {user?.full_name || 'Officer'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {activeRole === 'institution' && 'Track and manage your institutional approvals, resolve deficiency observations, and maintain compliance undertakings.'}
            {activeRole === 'regional_officer' && 'Evaluate incoming applications, conduct scrutiny checklists, return deficiencies, and manage regional processing velocity.'}
            {activeRole === 'regulation_bureau' && 'Monitor nationwide approval pendency, resolve high-level escalations, and issue formal Competent Authority regulatory decisions.'}
            {activeRole === 'evc_member' && 'Review assigned institutional Expert Visit Committee inspections, schedule physical visits, and submit inspection dockets.'}
            {activeRole === 'committee_member' && 'Appraise contested SAC/SHC appeal proceedings, verify institutional responses, and record standing committee recommendations.'}
            {activeRole === 'admin' && 'Full system governance: Monitor workflow SLAs, manage officer credentials, and configure regulatory validation rules.'}
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/applications"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
          >
            <span>View All Applications</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          {['institution', 'admin'].includes(activeRole) && (
            <Link
              to="/applications/new"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
            >
              + New Application
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stat Cards (Calculated directly from Database records) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Applications"
          value={kpis?.totalApplications ?? '--'}
          subtext="Active in Cycle"
          icon={FileText}
          variant="blue"
        />
        <StatCard
          title="Pending Queue"
          value={kpis?.pendingApplications ?? '--'}
          subtext="Under Active Review"
          icon={ClockAlert}
          variant="purple"
        />
        <StatCard
          title="Overdue (SLA Breach)"
          value={kpis?.overdueApplications ?? '--'}
          subtext="Critical Attention"
          icon={AlertTriangle}
          variant="rose"
        />
        <StatCard
          title="Returned / Deficient"
          value={kpis?.returnedForCorrection ?? '--'}
          subtext="Awaiting Resubmission"
          icon={RotateCcw}
          variant="amber"
        />
        <StatCard
          title="Upcoming EVCs"
          value={kpis?.upcomingEvcActivities ?? '--'}
          subtext="Scheduled Inspections"
          icon={CalendarDays}
          variant="blue"
        />
        <StatCard
          title="Pending Undertakings"
          value={kpis?.pendingUndertakings ?? '--'}
          subtext="Compliance Submissions"
          icon={ShieldCheck}
          variant="purple"
        />
        <StatCard
          title="Expiring Soon Docs"
          value={kpis?.documentsExpiringSoon ?? '--'}
          subtext="< 30 Days Validity"
          icon={ClockAlert}
          variant="amber"
        />
        <StatCard
          title="Compliance Rate"
          value={`${kpis?.complianceCompletionRate ?? 0}%`}
          subtext="Norms Fulfilled"
          icon={TrendingUp}
          variant="emerald"
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card title="Applications by Status" subtitle="Breakdown of active approval lifecycle">
          <div className="h-64">
            {charts?.byStatus?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.byStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {charts.byStatus.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No chart data</div>
            )}
          </div>
        </Card>

        {/* Processing Velocity vs Target SLA */}
        <Card title="Median Processing Time by Stage" subtitle="Observed hours vs Regulatory Target SLA">
          <div className="h-64">
            {charts?.stageProcessingTimes ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.stageProcessingTimes} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="stage" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="avg_hours" name="Avg Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target_hours" name="Target SLA" fill="#475569" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No chart data</div>
            )}
          </div>
        </Card>

        {/* Regional Distribution */}
        <Card title="Regional Distribution" subtitle="Workload by Regional Offices (WRO, NRO, SRO, ERO)">
          <div className="h-64">
            {charts?.byRegion?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.byRegion} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis dataKey="region_name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Applications" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">No regional data</div>
            )}
          </div>
        </Card>
      </div>

      {/* "My Queue" Section (Section 4) */}
      <Card
        title="My Queue — Active Regulatory Docket"
        subtitle="Prioritized applications requiring scrutiny, deficiency correction, or stage transition"
        action={
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter queue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              {(['ALL', 'PENDING', 'OVERDUE', 'RETURNED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setQueueFilter(filter)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    queueFilter === filter ? 'bg-brand-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Submission</th>
                <th className="py-3 px-4 text-center">Days Pending</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredQueue.slice(0, 8).map((app) => (
                <tr key={app.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-medium text-brand-300">
                    <Link to={`/applications/${app.id}`} className="hover:underline">
                      {app.application_number}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{app.institution_name}</div>
                    <div className="text-[11px] text-slate-400">{app.city}, {app.state} • {app.aicte_id}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-[180px] truncate">
                    {app.category}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {app.current_stage}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {app.submission_date ? app.submission_date.slice(0, 10) : 'Draft'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        app.is_overdue
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'text-slate-300'
                      }`}
                    >
                      {app.days_pending}d {app.is_overdue === 1 && '⚠️'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getStatusBadgeVariant(app.status)} dot>
                      {app.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/applications/${app.id}`}
                      className="inline-flex items-center space-x-1 text-xs text-brand-400 hover:text-brand-300 font-medium"
                    >
                      <span>Open</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredQueue.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-500">
              No applications match current filters.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
