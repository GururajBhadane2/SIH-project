import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  UserCheck,
  Building,
  ShieldAlert,
  ClipboardCheck,
  Scale,
  Settings2,
  ChevronDown,
  LogOut,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { api } from '../../services/api';

const ROLES: { id: UserRole; label: string; icon: React.ElementType; badgeColor: string }[] = [
  { id: 'institution', label: 'Institution User', icon: Building, badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'regional_officer', label: 'Regional Officer (RO)', icon: ClipboardCheck, badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'regulation_bureau', label: 'Regulation Bureau (RB)', icon: ShieldAlert, badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'evc_member', label: 'EVC Member', icon: UserCheck, badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'committee_member', label: 'Committee Member', icon: Scale, badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'admin', label: 'Administrator', icon: Settings2, badgeColor: 'bg-rose-100 text-rose-800 border-rose-200' }
];

export const Navbar: React.FC = () => {
  const { user, activeRole, switchRole, unreadCount, logout } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const currentRoleObj = ROLES.find(r => r.id === activeRole) || ROLES[0];
  const CurrentIcon = currentRoleObj.icon;

  const handleRoleChange = async (role: UserRole) => {
    setRoleMenuOpen(false);
    await switchRole(role);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/applications?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleQuickResetDemo = async () => {
    if (window.confirm('Reset all synthetic applications and records to baseline?')) {
      try {
        setResetting(true);
        await api.resetDemoData();
        window.location.reload();
      } catch (err: any) {
        alert('Reset failed: ' + err.message);
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-brand-700 to-blue-500 flex items-center justify-center shadow-lg border border-blue-400/30">
                <span className="font-extrabold text-xl tracking-tighter text-white">FX</span>
              </div>
              <div className="leading-tight">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-lg text-white tracking-wide">AICTE FlowX</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-400/30">
                    2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Intelligent Approval Workflow & Compliance Command Centre
                </p>
              </div>
            </Link>
          </div>

          {/* Quick Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                placeholder="Search Application #, Institute, AICTE ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-slate-400 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>
          </div>

          {/* Right Action Controls: Role Switcher, Reset, Notifications, Profile */}
          <div className="flex items-center space-x-3">
            {/* Quick Demo Reset Button */}
            <button
              onClick={handleQuickResetDemo}
              disabled={resetting}
              title="Reset synthetic demonstration records to default baseline"
              className="hidden lg:flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${resetting ? 'animate-spin text-brand-400' : ''}`} />
              <span>Reset Demo</span>
            </button>

            {/* Active Role Switcher Dropdown (Essential for SIH Evaluation) */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 transition"
                title="Switch role to test different workflows and permissions"
              >
                <div className="flex items-center space-x-1.5">
                  <CurrentIcon className="w-3.5 h-3.5 text-brand-400" />
                  <span className="font-semibold text-white">{currentRoleObj.label}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    Switch Evaluator Role (1-Click)
                  </div>
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const isActive = r.id === activeRole;
                    return (
                      <button
                        key={r.id}
                        onClick={() => handleRoleChange(r.id)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/80 transition ${
                          isActive ? 'bg-brand-500/10 text-brand-300 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                          <span>{r.label}</span>
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <Link
              to="/notifications"
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Notifications & Escalation Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Help / Guide Link */}
            <Link
              to="/help"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="SIH Problem Statement & Workflow Documentation"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-2 p-1 text-slate-300 hover:text-white rounded-lg transition"
              >
                <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-brand-300">
                  {user?.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {user?.full_name || 'Dr. Ramesh Sharma'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {user?.designation || currentRoleObj.label}
                  </div>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-700">
                    <p className="text-xs font-semibold text-white">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-400/30">
                      {user?.institution_name || user?.region_name || 'AICTE HQ'}
                    </span>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    Officer Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="block px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    System Settings
                  </Link>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
