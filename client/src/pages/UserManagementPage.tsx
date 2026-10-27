import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Building,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUsers().then(res => {
      setUsers(res.users || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <Users className="w-5 h-5 text-brand-400" />
          <span>User Role & Boundary Administration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Role-based access control (RBAC), institutional affiliation boundaries, and officer jurisdiction
        </p>
      </div>

      {/* Users Table */}
      <Card title="Authorized System Personnel" subtitle={`${users.length} Active Officer Accounts`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-900/60">
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Institutional / Regional Boundary</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{u.full_name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{u.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="purple" className="capitalize">
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {u.designation || 'Authorized Officer'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {u.institution_name ? (
                      <div>
                        <span className="font-semibold block">{u.institution_name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{u.aicte_id}</span>
                      </div>
                    ) : u.region_name ? (
                      <div>
                        <span className="font-semibold block">{u.region_name}</span>
                        <span className="text-[11px] text-slate-500">Jurisdiction Region</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Central AICTE Jurisdiction</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
