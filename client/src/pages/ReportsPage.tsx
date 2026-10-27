import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Building,
  TrendingUp,
  PieChart as PieIcon,
  Layers
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
import { api } from '../services/api';
import { Card } from '../components/UI/Card';

export const ReportsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      setAnalytics(res);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    window.open(api.exportCsvUrl(), '_blank');
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            <span>Reports, Analytics & Regulatory Audit Intelligence</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time approval metrics, stage processing time distribution, and regional pendency reports
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report View</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Dataset</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Application Volume</span>
          <div className="text-2xl font-extrabold text-white mt-1">{analytics?.kpis?.totalApplications ?? '--'}</div>
          <span className="text-[11px] text-slate-500">Academic Year 2026-27</span>
        </div>
        <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Under Active Processing</span>
          <div className="text-2xl font-extrabold text-blue-400 mt-1">{analytics?.kpis?.pendingApplications ?? '--'}</div>
          <span className="text-[11px] text-slate-500">Live Scrutiny & EVC</span>
        </div>
        <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Overdue Cases (&gt; 7 Days)</span>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{analytics?.kpis?.overdueApplications ?? '--'}</div>
          <span className="text-[11px] text-slate-500">Supervisory Attention</span>
        </div>
        <div className="p-4 bg-slate-850 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Compliance Fulfillment</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{analytics?.kpis?.complianceCompletionRate ?? 0}%</div>
          <span className="text-[11px] text-slate-500">Mandatory Undertakings</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card title="Applications by Approval Status" subtitle="Stage classification breakdown">
          <div className="h-72">
            {analytics?.charts?.byStatus ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.charts.byStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {analytics.charts.byStatus.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </Card>

        {/* Processing Velocity */}
        <Card title="Observed vs Target Processing Duration (Hours)" subtitle="Adherence to Regulatory Citizen Charter SLAs">
          <div className="h-72">
            {analytics?.charts?.stageProcessingTimes ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.charts.stageProcessingTimes} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="stage" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="avg_hours" name="Avg Hours Taken" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target_hours" name="Charter Target (SLA)" fill="#475569" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
};
