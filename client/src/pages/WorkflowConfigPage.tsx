import React, { useState, useEffect } from 'react';
import {
  GitFork,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
  Settings
} from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';

export const WorkflowConfigPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWorkflows().then(res => {
      setWorkflows(res.definitions || []);
      setStages(res.stages || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <GitFork className="w-5 h-5 text-brand-400" />
          <span>Configurable Approval Workflow Engine</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Versioned, rule-driven regulatory approval pathways under AICTE Approval Process Handbook (APH 2026-27)
        </p>
      </div>

      {/* Workflows List */}
      <div className="space-y-6">
        {workflows.map((wf) => {
          const wfStages = stages.filter(s => s.workflow_code === wf.code);

          return (
            <Card
              key={wf.id}
              title={
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-brand-400 font-bold">{wf.code}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-white font-semibold">{wf.name}</span>
                </div>
              }
              subtitle={wf.description}
            >
              <div className="space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Sequential Progression Stages & SLAs:
                </span>

                <div className="flex flex-col md:flex-row md:items-center gap-3 overflow-x-auto py-2">
                  {wfStages.map((stg, i) => (
                    <React.Fragment key={stg.id}>
                      <div className="p-3.5 bg-slate-900 border border-slate-700 rounded-xl min-w-[200px] space-y-1.5 shadow-md">
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>STAGE {stg.sequence_order}</span>
                          <span className="font-bold text-brand-400">{stg.sla_days}d SLA</span>
                        </div>
                        <div className="font-bold text-xs text-white">{stg.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Role: <strong className="text-slate-300 capitalize">{stg.responsible_role.replace('_', ' ')}</strong>
                        </div>
                      </div>
                      {i < wfStages.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden md:block" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
