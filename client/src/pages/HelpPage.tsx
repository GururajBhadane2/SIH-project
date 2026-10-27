import React from 'react';
import {
  HelpCircle,
  BookOpen,
  GitFork,
  FileCheck2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Card } from '../components/UI/Card';

export const HelpPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-brand-400" />
          <span>SIH 2026 Problem Statement & Demonstration Manual</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Comprehensive guide for evaluators, architecture explanation, and simulated workflow stages
        </p>
      </div>

      {/* SIH Problem Statement Card */}
      <Card title="Smart India Hackathon 2026 — Problem SIH26262" subtitle="Intelligent Approval Workflow & Compliance Command Centre">
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Technical institutions across India submit thousands of applications annually for Extension of Approval (EoA), New Courses, Increase in Intake, and Relocations. Manual appraisal leads to bottleneck delays, compliance opacity, and inconsistent scrutiny.
          </p>
          <p>
            <strong>AICTE FlowX</strong> solves this challenge through:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li><strong>Configurable Approval Workflow Engine:</strong> Supports flexible routes (Route A, B, C, D) ensuring applications only pass through verified statutory stages.</li>
            <li><strong>AI Document Intelligence:</strong> Vision OCR, keyword detection, completeness checks, and confidence scoring with human verification.</li>
            <li><strong>Proactive Compliance & Validity Radar:</strong> Automatic 60d/30d/7d expiry countdowns for land leases, fire NOCs, and structural certificates.</li>
            <li><strong>Deduplicated Escalations:</strong> Background cron jobs monitoring citizen charter SLAs and escalating breaches to Regional Directors.</li>
            <li><strong>Immutable Audit Trail:</strong> Complete cryptographic-style transaction log of every stage transition and reviewer observation.</li>
          </ul>
        </div>
      </Card>

      {/* 19-Step Workflow Verification Guide */}
      <Card title="End-to-End Demonstration Workflow (19 Stages)" subtitle="Test all features live in this prototype">
        <div className="space-y-2 text-xs">
          {[
            { step: '1-3', title: 'Institutional Drafting & Document Attachment', desc: 'Sign in as Institution User, create new application, and attach Land Deed, Fire NOC, Building Plan.' },
            { step: '4-5', title: 'Formal Submission & Queue Ingestion', desc: 'Submit application with digital declaration. Application ingests into Regional Scrutiny Queue.' },
            { step: '6-8', title: 'Regional Officer Scrutiny & Deficiency Recording', desc: 'Switch to Regional Officer (WRO). Inspect AI extracted attributes, record deficiency observations on clause citations.' },
            { step: '9-11', title: 'Return for Correction & Resubmission', desc: 'Return application for correction. Institution receives in-app alert, uploads revised document, and resubmits for re-scrutiny.' },
            { step: '12-14', title: 'EVC Visit Inspection & Committee Hearing', desc: 'Switch to EVC Member to record inspection report, or Committee Member for SAC appeal recommendation.' },
            { step: '15-17', title: 'Competent Authority Approval & Compliance Hold', desc: 'Switch to Regulation Bureau to grant final approval. Post-approval compliance undertakings and expiry radar start monitoring validity.' },
            { step: '18-19', title: 'Audit Trail Verification', desc: 'Review the immutable audit log recording the complete sequence with timestamps and actor credentials.' }
          ].map((item, i) => (
            <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 font-mono">
                  Phase {item.step}
                </span>
                <span className="font-bold text-white">{item.title}</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
