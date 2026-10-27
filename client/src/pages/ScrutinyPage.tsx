import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileText,
  Search,
  Eye,
  Building,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Application } from '../types';
import { Card } from '../components/UI/Card';
import { Badge, getStatusBadgeVariant } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';

export const ScrutinyPage: React.FC = () => {
  const { activeRole } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // Observation Modal State
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [obsType, setObsType] = useState('Deficiency');
  const [clauseRef, setClauseRef] = useState('AICTE APH 2026-27 Appendix 4');
  const [comments, setComments] = useState('');
  const [savingObs, setSavingObs] = useState(false);

  // Return Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.getScrutinyQueue();
      setQueue(res.queue || []);
      if (res.queue && res.queue.length > 0 && !selectedApp) {
        setSelectedApp(res.queue[0]);
      }
    } catch (err) {
      console.error('Error fetching scrutiny queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeRole]);

  const handleRecordObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !comments) return;

    try {
      setSavingObs(true);
      await api.recordObservation({
        application_id: selectedApp.id,
        stage: 'Scrutiny Evaluation',
        observation_type: obsType,
        clause_reference: clauseRef,
        comments,
        is_deficiency: obsType === 'Deficiency' ? 1 : 0
      });
      setObsModalOpen(false);
      setComments('');
      fetchQueue();
    } catch (err: any) {
      alert('Error recording observation: ' + err.message);
    } finally {
      setSavingObs(false);
    }
  };

  const handleReturnForCorrection = async () => {
    if (!selectedApp || !returnReason) return;
    try {
      setReturning(true);
      await api.returnForCorrection({
        application_id: selectedApp.id,
        reason: returnReason
      });
      setReturnModalOpen(false);
      setReturnReason('');
      fetchQueue();
    } catch (err: any) {
      alert('Return error: ' + err.message);
    } finally {
      setReturning(false);
    }
  };

  const handlePassScrutiny = async () => {
    if (!selectedApp) return;
    if (window.confirm(`Confirm scrutiny approval for ${selectedApp.application_number}? Application will advance to the next configured workflow stage.`)) {
      try {
        await api.passScrutiny({
          application_id: selectedApp.id,
          comments: 'Scrutiny completed by Regional Officer. All mandatory checklists validated.'
        });
        fetchQueue();
      } catch (err: any) {
        alert('Pass error: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-brand-400" />
            <span>Regional Scrutiny Workspace</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Conduct document verification, record deficiencies with clause citations, and manage scrutiny queue
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Queue List */}
        <div className="lg:col-span-5 space-y-3">
          <Card title="Applications Under Scrutiny" subtitle={`${queue.length} Cases Pending Action`}>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {queue.map((item) => (
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
                    <Badge variant={getStatusBadgeVariant(item.status)} dot>
                      {item.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="font-semibold text-white truncate">{item.institution_name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{item.category}</div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-700/50">
                    <span>Route: <strong className="text-slate-300 font-mono">{item.workflow_code}</strong></span>
                    <span className={item.is_overdue ? 'text-rose-400 font-bold' : ''}>
                      {item.days_pending}d pending {item.is_overdue === 1 && '⚠️'}
                    </span>
                  </div>
                </div>
              ))}

              {queue.length === 0 && !loading && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No applications currently pending scrutiny.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Reviewer Inspection & Action Pane */}
        <div className="lg:col-span-7">
          {selectedApp ? (
            <div className="space-y-4">
              <Card
                title={`Scrutiny Docket: ${selectedApp.application_number}`}
                subtitle={selectedApp.institution_name}
                action={
                  <Link
                    to={`/applications/${selectedApp.id}`}
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center space-x-1"
                  >
                    <span>Full File</span>
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                }
              >
                <div className="space-y-4 text-xs">
                  {/* Summary Attributes */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Category</span>
                      <span className="font-semibold text-white">{selectedApp.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Workflow Route</span>
                      <span className="font-mono font-bold text-brand-400">{selectedApp.workflow_code}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Attached Documents</span>
                      <span className="font-semibold text-slate-200">{selectedApp.documents_count || 4} Files</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Open Deficiencies</span>
                      <span className="font-bold text-amber-400">{selectedApp.active_deficiencies_count || 0} Items</span>
                    </div>
                  </div>

                  {/* Scrutiny Checklist */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Standard Regulatory Verification Checklist:
                    </span>
                    {[
                      { item: 'Contiguous educational land clear title and non-encumbrance certificate', verified: true },
                      { item: 'Municipal sanctioned layout plan with adequate carpet area', verified: true },
                      { item: 'State Fire Services NOC validity check (within active validity window)', verified: false },
                      { item: 'Affidavit executed on non-judicial stamp paper covering AICTE declarations', verified: true }
                    ].map((chk, i) => (
                      <div key={i} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                        <span className="text-slate-300">{chk.item}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          chk.verified
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {chk.verified ? 'VERIFIED' : 'DEFICIENT'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => setObsModalOpen(true)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Observation / Deficiency</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setReturnModalOpen(true)}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Return for Correction</span>
                      </button>
                      <button
                        onClick={handlePassScrutiny}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pass Scrutiny</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-500">
              Select an application from the scrutiny queue on the left.
            </div>
          )}
        </div>
      </div>

      {/* Record Observation Modal */}
      <Modal
        isOpen={obsModalOpen}
        onClose={() => setObsModalOpen(false)}
        title="Record Scrutiny Observation / Deficiency"
        subtitle={`Application: ${selectedApp?.application_number}`}
      >
        <form onSubmit={handleRecordObservation} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Observation Type</label>
            <select
              value={obsType}
              onChange={(e) => setObsType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="Deficiency">Deficiency (Action Required by Institution)</option>
              <option value="Clarification_Needed">Clarification Needed</option>
              <option value="Compliant">Compliant / Satisfactory</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Clause Reference</label>
            <input
              type="text"
              value={clauseRef}
              onChange={(e) => setClauseRef(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Reviewer Comments</label>
            <textarea
              required
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Specify the deficiency clearly..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setObsModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingObs}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold"
            >
              {savingObs ? 'Saving...' : 'Save Observation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Return for Correction Modal */}
      <Modal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title="Return Application for Institutional Correction"
        subtitle={`Application: ${selectedApp?.application_number}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Returning an application moves it to <strong>Returned for Correction</strong> status and notifies the institution to address outstanding deficiencies.
          </p>
          <div>
            <label className="block text-slate-300 font-medium mb-1">Return Justification & Instructions</label>
            <textarea
              required
              rows={4}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Explain the required corrections..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setReturnModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleReturnForCorrection}
              disabled={returning || !returnReason}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
            >
              {returning ? 'Returning...' : 'Confirm Return'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
