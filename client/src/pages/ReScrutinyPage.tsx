import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  Eye,
  Check,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Badge, getStatusBadgeVariant } from '../components/UI/Badge';

export const ReScrutinyPage: React.FC = () => {
  const { activeRole } = useAuth();
  const [rescrutinyApps, setRescrutinyApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [observations, setObservations] = useState<any[]>([]);

  const fetchRescrutinyData = async () => {
    try {
      setLoading(true);
      const res = await api.getApplications({ stage: 'PENDING_RE_SCRUTINY' });
      setRescrutinyApps(res.applications || []);
      if (res.applications?.length > 0 && !selectedApp) {
        setSelectedApp(res.applications[0]);
      }
    } catch (err) {
      console.error('Error loading re-scrutiny:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRescrutinyData();
  }, [activeRole]);

  useEffect(() => {
    if (selectedApp) {
      api.getApplicationById(selectedApp.id).then(res => {
        setObservations(res.observations || []);
      });
    }
  }, [selectedApp]);

  const handleApproveReScrutiny = async () => {
    if (!selectedApp) return;
    try {
      await api.passScrutiny({
        application_id: selectedApp.id,
        comments: 'Re-scrutiny approved. Institutional deficiency clarifications validated satisfactorily.'
      });
      alert('Re-scrutiny completed and application forwarded to next stage.');
      fetchRescrutinyData();
    } catch (err: any) {
      alert('Approval error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 text-brand-400" />
          <span>Re-Scrutiny & Deficiency Correction Workspace</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Evaluate corrected documentation resubmitted by institutions against previously flagged deficiencies
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Resubmitted Apps */}
        <div className="lg:col-span-5 space-y-3">
          <Card title="Resubmitted Applications" subtitle="Pending Re-Scrutiny Verification">
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {rescrutinyApps.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedApp(item)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-xs space-y-2 ${
                    selectedApp?.id === item.id
                      ? 'bg-brand-600/15 border-brand-500 shadow-md'
                      : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-brand-400">{item.application_number}</span>
                    <Badge variant="info">Pending Re-Scrutiny</Badge>
                  </div>
                  <div>
                    <div className="font-semibold text-white truncate">{item.institution_name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{item.category}</div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Route: <strong className="text-slate-300 font-mono">{item.workflow_code}</strong>
                  </div>
                </div>
              ))}

              {rescrutinyApps.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No applications currently awaiting re-scrutiny.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Deficiency vs Resubmission Inspection */}
        <div className="lg:col-span-7">
          {selectedApp ? (
            <Card
              title={`Deficiency Comparison Docket: ${selectedApp.application_number}`}
              subtitle={selectedApp.institution_name}
              action={
                <Link to={`/applications/${selectedApp.id}`} className="text-xs text-brand-400 hover:text-brand-300 flex items-center space-x-1">
                  <span>Full File</span>
                  <Eye className="w-3.5 h-3.5" />
                </Link>
              }
            >
              <div className="space-y-4 text-xs">
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Deficiency Observations vs Institutional Corrected Evidence:
                  </span>

                  {observations.map((obs) => (
                    <div key={obs.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-300">Flagged Deficiency:</span>
                        <span className="font-mono text-[10px] text-slate-500">{obs.clause_reference}</span>
                      </div>
                      <p className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        "{obs.comments}"
                      </p>

                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="font-bold text-emerald-300 block mb-1">Institution Clarification & Resubmission:</span>
                        <p className="text-slate-200 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                          {obs.institution_response || 'Updated document and explanation uploaded in resubmission bundle.'}
                        </p>
                      </div>
                    </div>
                  ))}

                  {observations.length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No recorded deficiencies in database for this case.
                    </div>
                  )}
                </div>

                {/* Approve Re-Scrutiny Button */}
                {['regional_officer', 'admin'].includes(activeRole) && (
                  <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                    <button
                      onClick={handleApproveReScrutiny}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-2 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Corrections & Pass Re-Scrutiny</span>
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="h-full min-h-[350px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500">
              Select an application on the left to review its deficiency corrections.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
