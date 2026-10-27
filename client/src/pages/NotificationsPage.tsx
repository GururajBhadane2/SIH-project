import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Calendar,
  AlertOctagon,
  Clock,
  CheckCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { Card } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';

export const NotificationsPage: React.FC = () => {
  const { activeRole, refreshUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications(unreadOnly);
      setNotifications(res.notifications || []);
      refreshUnreadCount();
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [unreadOnly, activeRole]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getSeverityBadge = (sev: string) => {
    if (sev === 'danger') return <Badge variant="danger">High Priority</Badge>;
    if (sev === 'warning') return <Badge variant="warning">Action Needed</Badge>;
    if (sev === 'success') return <Badge variant="success">Completed</Badge>;
    return <Badge variant="info">Notification</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Bell className="w-5 h-5 text-brand-400" />
            <span>Notification & Regulatory Alerts Centre</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deduplicated deadline alerts, deficiency notices, escalation warnings, and status changes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded text-brand-500 focus:ring-0"
            />
            <span>Unread Only</span>
          </label>
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <Card title="Active In-App Notifications" subtitle={`Showing ${notifications.length} Alerts`}>
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                n.is_read === 0
                  ? 'bg-slate-800/90 border-slate-700 shadow-md'
                  : 'bg-slate-900/60 border-slate-800/80 opacity-80'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  {getSeverityBadge(n.severity)}
                  <span className="font-bold text-xs text-white">{n.title}</span>
                  <span className="text-slate-500 text-[11px] font-mono">• {n.created_at}</span>
                </div>
                <p className="text-xs text-slate-300">{n.message}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {n.action_url && (
                  <Link
                    to={n.action_url}
                    className="px-2.5 py-1 bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 rounded text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                {n.is_read === 0 && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded text-xs font-medium transition"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}

          {notifications.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No notifications in queue.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
