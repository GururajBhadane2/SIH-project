import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Building,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  ShieldCheck,
  Calendar,
  CalendarDays,
  History,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Scale,
  Send,
  Eye,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Application, ApplicationDocument, ReviewObservation, ComplianceItem, EvcEvent, CommitteeReview, AuditLogItem } from '../types';
import { Card } from '../components/UI/Card';
import { Badge, getStatusBadgeVariant } from '../components/UI/Badge';
import { Tabs } from '../components/UI/Tabs';
import { Modal } from '../components/UI/Modal';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [observations, setObservations] = useState<ReviewObservation[]>([]);
  const [stageHistory, setStageHistory] = useState<any[]>([]);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [evcEvents, setEvcEvents] = useState<EvcEvent[]>([]);
  const [committeeReviews, setCommitteeReviews] = useState<CommitteeReview[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const [activeTab, setActiveTab] = useState('documents');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [actionComments, setActionComments] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Document extraction inspect modal
  const [selectedDoc, setSelectedDoc] = useState<ApplicationDocument | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);

  const loadApplication = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getApplicationById(id);
      setApp(res.application);
      setDocuments(res.documents || []);
      setObservations(res.observations || []);
      setStageHistory(res.stageHistory || []);
      setComplianceItems(res.complianceItems || []);
      setEvcEvents(res.evcEvents || []);
      setCommitteeReviews(res.committeeReviews || []);
      setAuditLogs(res.auditLogs || []);
    } catch (err) {
      console.error('Error loading application details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [id, activeRole]);

  const handleOpenAction = (type: string) => {
    setActionType(type);
    setActionComments('');
    setActionModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!app) return;
    try {
      setProcessingAction(true);
      if (actionType === 'SUBMIT') {
        await api.submitApplication(app.id);
      } else if (actionType === 'SCRUTINY_PASS') {
        await api.passScrutiny({ application_id: app.id, comments: actionComments });
      } else if (actionType === 'DEFICIENCY_RETURN') {
        await api.returnForCorrection({ application_id: app.id, reason: actionComments });
      } else if (actionType === 'RESUBMIT') {
        await api.resubmitApplication({ application_id: app.id, remarks: actionComments });
      } else if (actionType === 'APPROVE') {
        await api.transitionWorkflow(app.id, { action: 'APPROVE', comments: actionComments });
      } else if (actionType === 'REJECT') {
        await api.transitionWorkflow(app.id, { action: 'REJECT', comments: actionComments });
      }
      setActionModalOpen(false);
      loadApplication();
    } catch (err: any) {
      alert('Action error: ' + err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleVerifyDocument = async (docId: string, status: string) => {
    try {
      await api.verifyDocument(docId, {
        verification_status: status,
        verification_notes: 'Human reviewer confirmed extraction accuracy and compliance validity.'
      });
      loadApplication();
      setDocModalOpen(false);
    } catch (err: any) {
      alert('Verification error: ' + err.message);
    }
  };

  if (loading || !app) {
    return (
      <div className="py-16 text-center text-slate-400 text-xs">
        Loading regulatory application details...
      </div>
    );
  }

  const tabs = [
    { id: 'documents', label: 'Documents & AI Findings', icon: FileText, count: documents.length },
    { id: 'journey', label: 'Workflow Journey', icon: History, count: stageHistory.length },
    { id: 'observations', label: 'Observations & Deficiencies', icon: AlertTriangle, count: observations.length },
    { id: 'compliance', label: 'Compliance & Undertakings', icon: ShieldCheck, count: complianceItems.length },
    { id: 'evc', label: 'EVC & Committee', icon: CalendarDays },
    { id: 'audit', label: 'Audit Trail', icon: FileCheck2, count: auditLogs.length }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-sm text-brand-400">
                {app.application_number}
              </span>
              <span className="text-slate-600">•</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                {app.workflow_code}
              </span>
              {app.is_overdue === 1 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>SLA OVERDUE ({app.days_pending}d)</span>
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white mt-1">{app.institution_name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {app.category} &nbsp;•&nbsp; {app.academic_year} &nbsp;•&nbsp; {app.city}, {app.state}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getStatusBadgeVariant(app.status)} dot className="text-xs px-3 py-1">
              {app.status}
            </Badge>

            {/* Role-Sensitive Action Buttons */}
            {app.status === 'Draft' && ['institution', 'admin'].includes(activeRole) && (
              <button
                onClick={() => handleOpenAction('SUBMIT')}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Scrutiny</span>
              </button>
            )}

            {['Pending Scrutiny', 'Under Completeness Check', 'Pending Re-Scrutiny'].includes(app.status) &&
              ['regional_officer', 'admin'].includes(activeRole) && (
                <>
                  <button
                    onClick={() => handleOpenAction('DEFICIENCY_RETURN')}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Return for Correction</span>
                  </button>
                  <button
                    onClick={() => handleOpenAction('SCRUTINY_PASS')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pass Scrutiny & Forward</span>
                  </button>
                </>
              )}

            {app.status === 'Returned for Correction' && ['institution', 'admin'].includes(activeRole) && (
              <button
                onClick={() => handleOpenAction('RESUBMIT')}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resubmit Corrected Application</span>
              </button>
            )}

            {app.current_stage === 'AUTHORITY_DECISION' && ['regulation_bureau', 'admin'].includes(activeRole) && (
              <>
                <button
                  onClick={() => handleOpenAction('APPROVE')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Grant Official Approval</span>
                </button>
                <button
                  onClick={() => handleOpenAction('REJECT')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center space-x-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject Application</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs text-slate-300">
          <div>
            <span className="text-slate-500 block text-[11px]">AICTE Permanent ID</span>
            <span className="font-mono font-medium">{app.aicte_id}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Current Stage</span>
            <span className="font-mono font-medium text-brand-300">{app.current_stage}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Submission Date</span>
            <span>{app.submission_date ? app.submission_date.slice(0, 10) : 'Not Submitted'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Assigned Reviewer</span>
            <span>{app.assigned_officer_name || 'Regional Desk (WRO)'}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Documents & AI Vision Extractions */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const findings: any[] = doc.findings_json ? JSON.parse(doc.findings_json) : [];
              const fields: Record<string, any> = doc.extracted_fields_json ? JSON.parse(doc.extracted_fields_json) : {};

              return (
                <Card
                  key={doc.id}
                  title={doc.document_type.replace(/_/g, ' ')}
                  subtitle={doc.filename}
                  action={
                    <Badge variant={getStatusBadgeVariant(doc.verification_status)} dot>
                      {doc.verification_status}
                    </Badge>
                  }
                  footer={
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Confidence Score: <strong>{doc.confidence_score ? `${Math.round(doc.confidence_score * 100)}%` : 'N/A'}</strong>
                      </span>
                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setDocModalOpen(true);
                        }}
                        className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect OCR & Findings</span>
                      </button>
                    </div>
                  }
                >
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        AI Extracted Attributes:
                      </div>
                      {Object.entries(fields).slice(0, 3).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}:</span>
                          <span className="font-medium text-slate-200">{String(v)}</span>
                        </div>
                      ))}
                    </div>

                    {findings.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">Rule Checks:</span>
                        {findings.slice(0, 2).map((f, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded text-[11px] flex items-start space-x-2 border ${
                              f.status === 'PASS'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                            }`}
                          >
                            <span className="font-bold shrink-0">[{f.status}]</span>
                            <span className="text-[11px]">{f.note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {documents.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No supporting documents uploaded for this application yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Workflow Journey Timeline */}
      {activeTab === 'journey' && (
        <Card title="Approval Journey & Stage Audit Timeline" subtitle="Immutable sequence of stage transitions and regulatory milestones">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
            {stageHistory.map((item, idx) => (
              <div key={item.id || idx} className="relative space-y-1">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-brand-500 border-2 border-slate-900"></div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-semibold text-white">{item.action}</span>
                  <span className="text-slate-500">•</span>
                  <span className="font-mono text-brand-300">{item.to_stage}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 text-[11px]">{item.created_at}</span>
                </div>
                <div className="text-xs text-slate-300">
                  <span className="text-slate-400">Actor:</span> <strong>{item.actor_name}</strong> ({item.actor_role})
                </div>
                {item.comments && (
                  <p className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800 mt-1">
                    "{item.comments}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 3: Observations & Deficiencies */}
      {activeTab === 'observations' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {observations.map((obs) => (
              <div
                key={obs.id}
                className={`p-4 rounded-xl border space-y-2 ${
                  obs.is_deficiency === 1 && !obs.is_resolved
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-850 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{obs.stage}</span>
                    <span className="text-slate-500">•</span>
                    <span className="font-mono text-slate-400">{obs.clause_reference}</span>
                  </div>
                  <Badge variant={obs.is_deficiency ? (obs.is_resolved ? 'success' : 'warning') : 'info'}>
                    {obs.is_deficiency ? (obs.is_resolved ? 'Deficiency Resolved' : 'Deficiency Pending') : 'Observation'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-200">"{obs.comments}"</p>
                {obs.institution_response && (
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-300 mt-2">
                    <span className="font-semibold text-brand-400 text-[11px] block">Institution Response:</span>
                    <p className="mt-0.5">{obs.institution_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {observations.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No observations or deficiencies recorded on this application.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Compliance & Undertakings */}
      {activeTab === 'compliance' && (
        <Card title="Compliance Undertakings & Evidence Items" subtitle="Mandatory norms under AICTE Approval Process Handbook (APH 2026-27)">
          <div className="space-y-3">
            {complianceItems.map((item) => (
              <div key={item.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-white">{item.description}</span>
                    <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                      {item.requirement_code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{item.rule_reference} • Category: {item.category}</p>
                </div>
                <Badge variant={getStatusBadgeVariant(item.status)} dot>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 5: EVC & Committee Reviews */}
      {activeTab === 'evc' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="EVC Inspections" subtitle="Expert Visit Committee schedules & findings">
            {evcEvents.map((ev) => (
              <div key={ev.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{ev.event_code}</span>
                  <Badge variant={getStatusBadgeVariant(ev.status)}>{ev.status}</Badge>
                </div>
                <p className="text-slate-400">{ev.agenda}</p>
                <div className="text-[11px] text-slate-500">Scheduled: {ev.scheduled_date} at {ev.venue}</div>
                {ev.outcome && (
                  <div className="font-bold text-emerald-400">Outcome: {ev.outcome}</div>
                )}
              </div>
            ))}
            {evcEvents.length === 0 && (
              <div className="text-slate-500 text-xs text-center py-6">No EVC events scheduled for this application.</div>
            )}
          </Card>

          <Card title="Standing Committee Reviews" subtitle="SAC / SHC appellate proceedings">
            {committeeReviews.map((com) => (
              <div key={com.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{com.committee_type}</span>
                  <Badge variant={getStatusBadgeVariant(com.status)}>{com.status}</Badge>
                </div>
                <p className="text-slate-300">{com.observations}</p>
                {com.recommendation && (
                  <div className="font-bold text-brand-400">Recommendation: {com.recommendation}</div>
                )}
              </div>
            ))}
            {committeeReviews.length === 0 && (
              <div className="text-slate-500 text-xs text-center py-6">No committee hearings conducted.</div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 6: Immutable Audit Trail */}
      {activeTab === 'audit' && (
        <Card title="Immutable Audit Trail Records" subtitle="Cryptographically logged event history for application lifecycle">
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-brand-400 font-semibold">{log.event_id}</span>
                    <span className="text-slate-500">•</span>
                    <span className="font-bold text-white">{log.action}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">{log.timestamp}</span>
                </div>
                <p className="text-slate-300 text-xs">{log.reason}</p>
                <div className="text-[11px] text-slate-500">
                  Actor: {log.actor_name} ({log.actor_role}) • IP: {log.ip_address}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={`Confirm Action: ${actionType.replace('_', ' ')}`}
        subtitle={`Application: ${app.application_number} • ${app.institution_name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Please record your official comments or justification for this stage action. All entries will be permanently written to the immutable audit log.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Remarks / Justification</label>
            <textarea
              rows={4}
              value={actionComments}
              onChange={(e) => setActionComments(e.target.value)}
              placeholder="Enter official justification..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setActionModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteAction}
              disabled={processingAction}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold"
            >
              {processingAction ? 'Executing...' : 'Confirm Action'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Document OCR & Inspection Modal */}
      {selectedDoc && (
        <Modal
          isOpen={docModalOpen}
          onClose={() => setDocModalOpen(false)}
          title={`Document Intelligence: ${selectedDoc.document_type.replace(/_/g, ' ')}`}
          subtitle={selectedDoc.filename}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Extracted Text */}
            <div>
              <span className="font-semibold text-slate-300 block mb-1">OCR Raw Extracted Text:</span>
              <div className="p-3 bg-slate-950 font-mono text-[11px] text-slate-300 rounded-lg border border-slate-800 max-h-40 overflow-y-auto">
                {selectedDoc.extracted_text || 'No text extracted.'}
              </div>
            </div>

            {/* Human Verification Action */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-slate-400">Current Status: <strong>{selectedDoc.verification_status}</strong></span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleVerifyDocument(selectedDoc.id, 'Deficient')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium"
                >
                  Mark Deficient
                </button>
                <button
                  onClick={() => handleVerifyDocument(selectedDoc.id, 'Verified')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify Document</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
