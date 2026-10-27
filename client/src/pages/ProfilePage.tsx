import React from 'react';
import {
  User,
  Building,
  Mail,
  Phone,
  Shield,
  MapPin,
  Calendar,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';

export const ProfilePage: React.FC = () => {
  const { user, activeRole } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <User className="w-5 h-5 text-brand-400" />
          <span>Officer Profile & Credentials</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Designation, institutional affiliation, and assigned regional jurisdiction
        </p>
      </div>

      <Card>
        <div className="space-y-6 text-xs">
          {/* Avatar and Main Info */}
          <div className="flex items-center space-x-4 pb-6 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-700 to-blue-500 border border-blue-400/30 flex items-center justify-center font-bold text-2xl text-white shadow-xl">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">{user?.full_name}</h2>
                <Badge variant="purple" className="capitalize">
                  {user?.role.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-slate-400 mt-0.5">{user?.designation || 'Authorized Regulatory Officer'}</p>
              <p className="text-[11px] text-slate-500">{user?.institution_name || user?.region_name || 'AICTE Central HQ'}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5" />
                <span>Official Email</span>
              </span>
              <span className="font-semibold text-white block">{user?.email}</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5" />
                <span>Contact Telephone</span>
              </span>
              <span className="font-semibold text-white block">{user?.phone || '+91 20 2893 4000'}</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                <Building className="w-3.5 h-3.5" />
                <span>Institution ID</span>
              </span>
              <span className="font-mono text-brand-300 font-semibold block">{user?.aicte_id || 'AICTE-CENTRAL-HQ'}</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Assigned Region</span>
              </span>
              <span className="font-semibold text-white block">{user?.region_name || 'Western Regional Office (WRO)'}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
