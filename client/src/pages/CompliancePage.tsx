import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ComplianceItem } from '../types';
import { Card } from '../components/UI/Card';
import { Badge, getStatusBadgeVariant } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';

export const CompliancePage: React.FC = () => {
  const { activeRole } = useAuth();
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  // Submit Evidence Modal
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [undertakingText, setUndertakingText] = useState('We hereby solemnly affirm compliance with all prescribed AICTE norms.');
  const [signatoryName, setSignatoryName] = useState('Dr. Ramesh Sharma');
  const [signatoryDesig, setSignatoryDesig] = useState('Principal & Head of Institution');
  const [submitting, setSubmitting] = useState(false);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const res = await api.getCompliance();
      setItems(res.items || []);
      setRequirements(res.requirements || []);
    } catch (err) {
      console.error('Error fetching compliance items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, [activeRole]);

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;

    try {
      setSubmitting(true);
      await api.submitComplianceEvidence({
        compliance_item_id: selectedItemId,
        undertaking_text: undertakingText,
        signatory_name: signatoryName,
        signatory_designation: signatoryDesig
      });
      setEvidenceModalOpen(false);
      fetchCompliance();
    } catch (err: any) {
      alert('Error submitting evidence: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (itemId: string) => {
    try {
      await api.verifyCompliance({
        compliance_item_id: itemId,
        status: 'Verified',
        verification_comments: 'Mandatory undertaking verified compliant with regulatory standards.'
      });
      fetchCompliance();
    } catch (err: any) {
      alert('Verification error: ' + err.message);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'PENDING') return ['Not Started', 'Pending Submission'].includes(item.status);
    if (filter === 'SUBMITTED') return ['Submitted', 'Under Verification'].includes(item.status);
    if (filter === 'VERIFIED') return item.status === 'Verified';
    if (filter === 'DEFICIENT') return item.status === 'Deficient';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-brand-400" />
          <span>Regulatory Compliance & Undertakings Command Centre</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Monitor statutory undertakings, institutional evidence uploads, and post-approval compliance mandates
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-850 p-1 rounded-xl border border-slate-800 text-xs w-fit">
        {[
          { id: 'ALL', label: 'All Items' },
          { id: 'PENDING', label: 'Pending Submission' },
          { id: 'SUBMITTED', label: 'Under Verification' },
          { id: 'DEFICIENT', label: 'Deficient' },
          { id: 'VERIFIED', label: 'Verified & Compliant' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === f.id
                ? 'bg-brand-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Compliance Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            title={item.description}
            subtitle={`${item.application_number} • ${item.institution_name}`}
            action={<Badge variant={getStatusBadgeVariant(item.status)} dot>{item.status}</Badge>}
            footer={
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Due: <strong>{item.due_date || 'Standard Cycle'}</strong>
                </span>
                <div className="flex space-x-2">
                  {item.status !== 'Verified' && ['institution', 'admin'].includes(activeRole) && (
                    <button
                      onClick={() => {
                        setSelectedItemId(item.id);
                        setEvidenceModalOpen(true);
                      }}
                      className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center space-x-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Submit Undertaking</span>
                    </button>
                  )}
                  {item.status !== 'Verified' && ['regional_officer', 'regulation_bureau', 'admin'].includes(activeRole) && (
                    <button
                      onClick={() => handleVerify(item.id)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify</span>
                    </button>
                  )}
                </div>
              </div>
            }
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span>Rule Reference:</span>
                <span className="font-mono text-slate-300">{item.rule_reference}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Category:</span>
                <span className="font-semibold text-slate-200">{item.category}</span>
              </div>
              {item.verification_comments && (
                <p className="text-[11px] text-slate-300 bg-slate-900/50 p-2 rounded border border-slate-800/80">
                  "{item.verification_comments}"
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Submit Evidence Modal */}
      <Modal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        title="Submit Compliance Undertaking"
        subtitle="Solemn digital affirmation on behalf of the institution"
      >
        <form onSubmit={handleSubmitEvidence} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Undertaking Declaration Text</label>
            <textarea
              required
              rows={4}
              value={undertakingText}
              onChange={(e) => setUndertakingText(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Authorized Signatory Name</label>
              <input
                type="text"
                required
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Designation</label>
              <input
                type="text"
                required
                value={signatoryDesig}
                onChange={(e) => setSignatoryDesig(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setEvidenceModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit Undertaking'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
