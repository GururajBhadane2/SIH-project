import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  CheckSquare,
  RefreshCw,
  FileSearch,
  CalendarDays,
  Scale,
  ShieldCheck,
  ClockAlert,
  Bell,
  AlertOctagon,
  BarChart3,
  History,
  Users,
  GitFork,
  Sliders,
  Settings,
  User,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  name: string;
  to: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { activeRole, unreadCount } = useAuth();

  const sections: NavSection[] = [
    {
      title: 'Workspaces',
      items: [
        { name: 'Dashboard', to: '/', icon: LayoutDashboard },
        { name: 'Applications', to: '/applications', icon: FileText },
        {
          name: 'Create Application',
          to: '/applications/new',
          icon: FilePlus2,
          allowedRoles: ['institution', 'admin']
        },
        {
          name: 'Scrutiny Workspace',
          to: '/scrutiny',
          icon: CheckSquare,
          badge: 'RO',
          allowedRoles: ['regional_officer', 'regulation_bureau', 'admin']
        },
        {
          name: 'Re-Scrutiny Workspace',
          to: '/rescrutiny',
          icon: RefreshCw,
          allowedRoles: ['regional_officer', 'regulation_bureau', 'admin', 'institution']
        }
      ]
    },
    {
      title: 'Verification & AI',
      items: [
        { name: 'Document Intelligence', to: '/document-intelligence', icon: FileSearch, badge: 'AI' },
        { name: 'EVC Scheduling', to: '/evc', icon: CalendarDays },
        { name: 'Committee Review', to: '/committee', icon: Scale },
        { name: 'Compliance Tracker', to: '/compliance', icon: ShieldCheck },
        { name: 'Document Validity', to: '/validity', icon: ClockAlert, badge: 'Radar' }
      ]
    },
    {
      title: 'Command & Analytics',
      items: [
        {
          name: 'Notifications',
          to: '/notifications',
          icon: Bell,
          badge: unreadCount > 0 ? `${unreadCount}` : undefined
        },
        { name: 'Escalations Engine', to: '/escalations', icon: AlertOctagon },
        { name: 'Reports & Analytics', to: '/reports', icon: BarChart3 },
        { name: 'Audit Trail', to: '/audit', icon: History }
      ]
    },
    {
      title: 'System & Config',
      items: [
        {
          name: 'User Management',
          to: '/admin/users',
          icon: Users,
          allowedRoles: ['admin', 'regulation_bureau']
        },
        {
          name: 'Workflow Routes',
          to: '/admin/workflows',
          icon: GitFork,
          allowedRoles: ['admin', 'regulation_bureau', 'regional_officer']
        },
        {
          name: 'Compliance Rules',
          to: '/admin/compliance-rules',
          icon: Sliders,
          allowedRoles: ['admin', 'regulation_bureau']
        },
        { name: 'Settings', to: '/settings', icon: Settings },
        { name: 'Officer Profile', to: '/profile', icon: User },
        { name: 'Help & SIH Guide', to: '/help', icon: HelpCircle }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] select-none">
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {sections.map((section, idx) => {
          // Filter items by role
          const visibleItems = section.items.filter(item => {
            if (!item.allowedRoles) return true;
            return item.allowedRoles.includes(activeRole);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-0.5 mt-1.5">
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                          isActive
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                        }`
                      }
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            item.badge === 'AI'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                              : item.badge === 'RO'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                              : item.badge === 'Radar'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                              : 'bg-red-500 text-white font-bold'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Active Role</span>
          <span className="font-semibold text-brand-400 capitalize">
            {activeRole.replace('_', ' ')}
          </span>
        </div>
      </div>
    </aside>
  );
};
