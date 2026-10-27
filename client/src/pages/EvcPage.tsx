import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  FileText,
  Building,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { EvcEvent } from '../types';
import { Card } from '../components/UI/Card';
import { Badge, getStatusBadgeVariant } from '../components/UI/Badge';
import { Modal } from '../components/UI/Modal';

export const EvcPage: React.FC = () => {
  const { activeRole } = useAuth();
  const [events, setEvents] = useState<EvcEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Schedule Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [appId, setAppId] = useState('app-002');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('10:00 AM IST');
  const [venue, setVenue] = useState('College Campus Computer & AI Labs');
  const [agenda, setAgenda] = useState('Physical verification of high-performance lab equipment and faculty records.');
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Report Outcome Modal
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState('Recommended');
  const [reportSummary, setReportSummary] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEvcEvents();
      setEvents(res.events || []);
    } catch (err) {
      console.error('Error fetching EVC events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeRole]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSchedule(true);
      await api.scheduleEvc({
        application_id: appId,
        scheduled_date: schedDate,
        scheduled_time: schedTime,
        venue,
        agenda,
        expert_members: [
          { name: 'Prof. M. K. Iyer', role: 'Chairman / Convener', org: 'IIT Bombay (Retd)' },
          { name: 'Dr. Sunita Deshmukh', role: 'AI Expert', org: 'COEP University' }
        ]
      });
      setScheduleModalOpen(false);
      fetchEvents();
    } catch (err: any) {
      alert('Error scheduling EVC: ' + err.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !reportSummary) return;

    try {
      setSavingReport(true);
      await api.submitEvcReport(selectedEventId, {
        outcome,
        report_summary: reportSummary
      });
      setReportModalOpen(false);
      setReportSummary('');
      fetchEvents();
    } catch (err: any) {
      alert('Error recording report: ' + err.message);
    } finally {
      setSavingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-brand-400" />
            <span>Expert Visit Committee (EVC) Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Coordinate physical and virtual EVC inspection panels, record expert findings, and submit visit reports
          </p>
        </div>
        {['regional_officer', 'evc_member', 'admin'].includes(activeRole) && (
          <button
            onClick={() => setScheduleModalOpen(true)}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-md flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule EVC Inspection</span>
          </button>
        )}
      </div>

      {/* EVC Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((ev) => {
          const experts: any[] = ev.expert_members_json ? JSON.parse(ev.expert_members_json) : [];

          return (
            <Card
              key={ev.id}
              title={ev.event_code}
              subtitle={ev.event_type}
              action={<Badge variant={getStatusBadgeVariant(ev.status)} dot>{ev.status}</Badge>}
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Lead: <strong>{ev.lead_expert_name || 'Prof. M. K. Iyer'}</strong>
                  </span>
                  {ev.status !== 'Completed' && ['evc_member', 'admin'].includes(activeRole) && (
                    <button
                      onClick={() => {
                        setSelectedEventId(ev.id);
                        setReportModalOpen(true);
                      }}
                      className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                    >
                      Record Report →
                    </button>
                  )}
                  {ev.outcome && (
                    <span className="text-xs font-bold text-emerald-400">
                      ✓ {ev.outcome}
                    </span>
                  )}
                </div>
              }
            >
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-white block">{ev.institution_name}</span>
                  <span className="text-[11px] font-mono text-brand-300">{ev.application_number}</span>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1 text-[11px]">
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ev.scheduled_date} at {ev.scheduled_time}</span>
                  </div>
                  <div className="flex items-start space-x-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="truncate">{ev.venue}</span>
                  </div>
                </div>

                <p className="text-slate-300 text-[11px] line-clamp-2">"{ev.agenda}"</p>

                {experts.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Panel Experts:</span>
                    <div className="flex flex-wrap gap-1">
                      {experts.map((exp, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {exp.name} ({exp.role})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Schedule EVC Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Expert Visit Committee (EVC)"
        subtitle="Constitutes inspection panel under AICTE regulatory procedure"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Target Application</label>
            <select
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="app-002">FLOWX-2026-0002 — Apex Institute (Increase in Intake)</option>
              <option value="app-007">FLOWX-2026-0007 — Sahyadri Pharmacy (Surprise EVC)</option>
              <option value="app-013">FLOWX-2026-0013 — New Pharmacy College (Route C)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Inspection Date</label>
              <input
                type="date"
                required
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Inspection Time</label>
              <input
                type="text"
                value={schedTime}
                onChange={(e) => setSchedTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Inspection Venue / Lab Details</label>
            <input
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Inspection Agenda & Focus Areas</label>
            <textarea
              rows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setScheduleModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingSchedule}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold"
            >
              {savingSchedule ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Report Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Record Official EVC Inspection Report"
        subtitle="Findings & recommendation advance application to Competent Authority"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">EVC Recommendation Outcome</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="Recommended">Recommended (All Norms Satisfied)</option>
              <option value="Recommended with Conditions">Recommended with Conditions</option>
              <option value="Not Recommended">Not Recommended (Substantial Deficiencies)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Executive Summary of Findings</label>
            <textarea
              required
              rows={4}
              value={reportSummary}
              onChange={(e) => setReportSummary(e.target.value)}
              placeholder="Summarize physical verification of computer labs, internet bandwidth, faculty attendance, and safety systems..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingReport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold"
            >
              {savingReport ? 'Submitting...' : 'Submit Official Report'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
