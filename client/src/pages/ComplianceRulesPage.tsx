import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  Plus,
  BookOpen,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';

export const ComplianceRulesPage: React.FC = () => {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCompliance().then(res => {
      setRequirements(res.requirements || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-brand-400" />
          <span>Compliance Rule & Undertaking Engine</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configurable statutory mandates, effective dates, and documentation requirements under APH 2026-27
        </p>
      </div>

      <Card title="Prescribed Compliance Norms" subtitle={`${requirements.length} Active Statutory Rules`}>
        <div className="space-y-3">
          {requirements.map((req) => (
            <div key={req.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-brand-400 font-bold">{req.code}</span>
                  <span className="text-slate-600">•</span>
                  <Badge variant="purple">{req.category}</Badge>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Effective: {req.effective_from}
                </span>
              </div>
              <p className="font-semibold text-white text-xs">{req.description}</p>
              <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80">
                Rule Reference: <strong className="text-slate-300">{req.rule_reference}</strong> • Mandatory for: {req.mandatory_for}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
