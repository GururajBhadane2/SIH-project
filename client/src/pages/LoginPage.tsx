import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  ClipboardCheck,
  ShieldAlert,
  UserCheck,
  Scale,
  Settings2,
  Lock,
  Mail,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DisclaimerBanner } from '../components/Layout/DisclaimerBanner';

const DEMO_USERS = [
  {
    role: 'institution',
    name: 'Dr. Ramesh Sharma',
    title: 'Principal & Authorized Representative',
    org: 'Apex Institute of Tech & Mgmt, Pune',
    email: 'institution@flowx.demo',
    icon: Building,
    badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-300'
  },
  {
    role: 'regional_officer',
    name: 'Er. Suresh Deshmukh',
    title: 'Regional Officer (WRO)',
    org: 'Western Regional Office, Mumbai',
    email: 'ro.western@flowx.demo',
    icon: ClipboardCheck,
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  },
  {
    role: 'regulation_bureau',
    name: 'Dr. Kavita Verma',
    title: 'Director, Regulation & Approval Bureau',
    org: 'AICTE Headquarters, New Delhi',
    email: 'rb.director@flowx.demo',
    icon: ShieldAlert,
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-300'
  },
  {
    role: 'evc_member',
    name: 'Prof. M. K. Iyer',
    title: 'Senior EVC Lead Expert & Academician',
    org: 'Expert Visit Committee Panel',
    email: 'evc.lead@flowx.demo',
    icon: UserCheck,
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  },
  {
    role: 'committee_member',
    name: 'Prof. Anita Roy',
    title: 'Standing Appellate Committee (SAC)',
    org: 'SAC & SHC Appellate Division',
    email: 'committee.sac@flowx.demo',
    icon: Scale,
    badgeColor: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
  },
  {
    role: 'admin',
    name: 'Admin - System Architect',
    title: 'Chief Technology Officer & Administrator',
    org: 'AICTE FlowX System Command',
    email: 'admin@flowx.demo',
    icon: Settings2,
    badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-300'
  }
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await login(email, password || 'Demo@123');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (demoEmail: string) => {
    setError(null);
    try {
      setLoading(true);
      await login(demoEmail, 'Demo@123');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      <DisclaimerBanner />
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-4xl w-full space-y-8">
          {/* Logo & Subtitle */}
          <div className="text-center space-y-2">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-blue-500 items-center justify-center shadow-2xl border border-blue-400/30 mb-2">
              <span className="font-extrabold text-2xl tracking-tighter text-white">FX</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">AICTE FlowX</h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Intelligent Approval Workflow & Compliance Command Centre
            </p>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart India Hackathon 2026 (SIH26262) Evaluation Sandbox</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Standard Login Box */}
            <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-base font-semibold text-white mb-1">Account Sign In</h2>
              <p className="text-xs text-slate-400 mb-6">Enter official portal credentials</p>

              {error && (
                <div className="p-3 mb-4 text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. institution@flowx.demo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    <span className="text-[11px] text-brand-400 cursor-pointer hover:underline">
                      (Default: Demo@123)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-lg transition flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* 1-Click Demo Accounts Grid for Evaluator */}
            <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">1-Click Evaluator Personas</h2>
                  <p className="text-xs text-slate-400">Select any role to instantly test permissions & workflows</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_USERS.map((demo) => {
                  const Icon = demo.icon;
                  return (
                    <button
                      key={demo.email}
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoSelect(demo.email)}
                      className="text-left p-3.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 hover:border-brand-500/50 rounded-xl transition group relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg border ${demo.badgeColor}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-brand-400 transition">
                          Click to Login →
                        </span>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs font-bold text-white group-hover:text-brand-300 transition">
                          {demo.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{demo.title}</p>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">{demo.org}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
