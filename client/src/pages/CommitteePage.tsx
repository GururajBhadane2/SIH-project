import React, { useState, useEffect } from 'react';
import {
  Scale,
  Calendar,
  CheckCircle2,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CommitteeReview } from '../types';
import { Card } from '../components/UI/Card';
import { Badge, getStatusBadgeVariant } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';

export const CommitteePage: React.FC = () => {
  const { activeRole } = useAuth();
  const [reviews, setReviews] = useState<CommitteeReview[]>([]);
  const [loading, setLoading] = useState(true);

  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState('Approved');
  const [observations, setObservations] = useState('');
  const [savingDecision, setSavingDecision] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.getCommitteeReviews();
      setReviews(res.reviews || []);
    } catch (err) {
      console.error('Error fetching committee reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [activeRole]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewId) return;

    try {
      setSavingDecision(true);
      await api.recordCommitteeOutcome(selectedReviewId, {
        recommendation,
        observations
      });
      setDecisionModalOpen(false);
      setObservations('');
      fetchReviews();
    } catch (err: any) {
      alert('Decision error: ' + err.message);
    } finally {
      setSavingDecision(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <Scale className="w-5 h-5 text-brand-400" />
          <span>Standing Hearing & Appellate Committee (SAC / SHC)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Appellate proceedings, institutional representations, and statutory recommendation dockets
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((rev) => {
          const quorum: any[] = rev.quorum_members_json ? JSON.parse(rev.quorum_members_json) : [];

          return (
            <Card
              key={rev.id}
              title={rev.committee_type}
              subtitle={`Application: ${rev.application_number} • ${rev.institution_name}`}
              action={<Badge variant={getStatusBadgeVariant(rev.status)} dot>{rev.status}</Badge>}
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Hearing Date: <strong>{rev.hearing_date || 'TBD'}</strong>
                  </span>
                  {rev.status !== 'Decision Recorded' && ['committee_member', 'admin'].includes(activeRole) && (
                    <button
                      onClick={() => {
                        setSelectedReviewId(rev.id);
                        setDecisionModalOpen(true);
                      }}
                      className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                    >
                      Record Committee Decision →
                    </button>
                  )}
                  {rev.recommendation && (
                    <span className="text-xs font-bold text-brand-400">
                      Recommendation: {rev.recommendation}
                    </span>
                  )}
                </div>
              }
            >
              <div className="space-y-3 text-xs">
                <p className="text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
                  "{rev.observations}"
                </p>

                {quorum.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Committee Quorum Present:</span>
                    <div className="space-y-1">
                      {quorum.map((m, i) => (
                        <div key={i} className="flex justify-between text-[11px] text-slate-400 bg-slate-850 px-2.5 py-1 rounded border border-slate-800">
                          <span className="font-medium text-slate-200">{m.name}</span>
                          <span className="text-slate-500">{m.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {reviews.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-500 text-xs">
          No committee proceedings currently registered.
        </div>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title="Record Formal Committee Recommendation"
        subtitle="Quorum consensus outcome"
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Recommendation</label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="Approved">Recommend Approval to Competent Authority</option>
              <option value="Rejected">Recommend Rejection</option>
              <option value="Clarification Required">Require Further Clarification</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Committee Observations & Grounds</label>
            <textarea
              required
              rows={4}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="State the appraisal grounds, municipal permissions inspected, and resolution findings..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setDecisionModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingDecision}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold"
            >
              {savingDecision ? 'Recording...' : 'Record Decision'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
