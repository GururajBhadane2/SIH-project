import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { EscalationItem } from '../types';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';

export const EscalationsPage: React.FC = () => {
  const { activeRole } = useAuth();
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolve Modal
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedEscId, setSelectedEscId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      const res = await api.getEscalations();
      setEscalations(res.escalations || []);
      setRules(res.rules || []);
    } catch (err) {
      console.error('Error fetching escalations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, [activeRole]);

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeEscalation(id);
      fetchEscalations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscId || !remarks) return;
    try {
      setResolving(true);
      await api.resolveEscalation(selectedEscId, remarks);
      setResolveModalOpen(false);
      setRemarks('');
      fetchEscalations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <AlertOctagon className="w-5 h-5 text-brand-400" />
          <span>SLA Escalation Engine & Supervisory Matrix</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Automatic escalation triggers for overdue scrutiny, unanswered deficiency deadlines, and EVC breaches
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Escalation Rules Matrix */}
        <div className="lg:col-span-4 space-y-4">
          <Card title="Configured Escalation Rules" subtitle="Automated threshold monitors">
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{rule.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      {rule.threshold_days}d SLA
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Escalates to: <strong className="text-brand-300 capitalize">{rule.escalate_to_role.replace('_', ' ')}</strong>
                  </div>
                  <p className="text-[11px] text-slate-500">{rule.auto_action}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Active Escalations List */}
        <div className="lg:col-span-8 space-y-4">
          <Card title="Active Supervisory Escalations" subtitle="Cases exceeding configured SLA thresholds">
            <div className="space-y-3">
              {escalations.map((esc) => (
                <div
                  key={esc.id}
                  className={`p-4 rounded-xl border space-y-3 text-xs ${
                    esc.status === 'Active'
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : esc.status === 'Acknowledged'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-slate-900 border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white font-mono">{esc.application_number}</span>
                      <span className="text-slate-500">•</span>
                      <span className="font-semibold text-slate-300">{esc.institution_name}</span>
                    </div>
                    <Badge variant={esc.status === 'Active' ? 'danger' : esc.status === 'Acknowledged' ? 'warning' : 'success'} dot>
                      {esc.status}
                    </Badge>
                  </div>

                  <p className="text-slate-200 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    "{esc.reason}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <div>
                      Escalated from: <span className="capitalize">{esc.escalated_from_role.replace('_', ' ')}</span> →{' '}
                      <strong>{esc.escalated_to_role.replace('_', ' ')}</strong>
                    </div>

                    <div className="flex space-x-2">
                      {esc.status === 'Active' && ['regulation_bureau', 'admin'].includes(activeRole) && (
                        <button
                          onClick={() => handleAcknowledge(esc.id)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
                        >
                          Acknowledge
                        </button>
                      )}
                      {esc.status !== 'Resolved' && ['regulation_bureau', 'admin'].includes(activeRole) && (
                        <button
                          onClick={() => {
                            setSelectedEscId(esc.id);
                            setResolveModalOpen(true);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {esc.resolution_remarks && (
                    <div className="p-2 bg-emerald-500/10 rounded text-[11px] text-emerald-300 border border-emerald-500/20">
                      <strong>Resolution Remarks:</strong> {esc.resolution_remarks}
                    </div>
                  )}
                </div>
              ))}

              {escalations.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No active escalations. All workflow stages adhering to SLA thresholds!
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Resolve Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Resolve Supervisory Escalation"
        subtitle="Document supervisory corrective intervention"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Intervention / Resolution Remarks</label>
            <textarea
              required
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="State supervisory directives, additional officer assignment, or grace period justification..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setResolveModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resolving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
            >
              {resolving ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
