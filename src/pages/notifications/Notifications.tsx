import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Send,
  Users,
  UserCheck,
  Briefcase,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Modal } from '../../components/common/Modal';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  target: 'ALL' | 'CUSTOMERS' | 'VENDORS' | 'EMPLOYEES' | 'SPECIFIC_USER';
  targetUserId?: string | null;
  sentAt: string;
}

export const Notifications: React.FC = () => {
  const queryClient = useQueryClient();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: 'ALL' as 'ALL' | 'CUSTOMERS' | 'VENDORS' | 'EMPLOYEES' | 'SPECIFIC_USER',
    targetUserId: '',
    reason: '',
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: NotificationItem[] }>('/admin/notifications');
      return res.data.data;
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      await apiClient.post('/admin/notifications/broadcast', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsComposeOpen(false);
      setFormData({
        title: '',
        message: '',
        target: 'ALL',
        targetUserId: '',
        reason: '',
      });
    },
  });

  const getTargetBadge = (target: string) => {
    switch (target) {
      case 'ALL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Users className="w-3 h-3" /> All Platform Users
          </span>
        );
      case 'CUSTOMERS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <UserCheck className="w-3 h-3" /> Customers Only
          </span>
        );
      case 'VENDORS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Briefcase className="w-3 h-3" /> Vendors Only
          </span>
        );
      case 'EMPLOYEES':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Wrench className="w-3 h-3" /> Technicians Only
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            Target User
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Push Broadcasts & Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dispatch announcements, system alerts, and critical advisories to Customer and Vendor mobile devices
          </p>
        </div>
        <button
          onClick={() => setIsComposeOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
        >
          <Send className="w-4 h-4" />
          Send Broadcast
        </button>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Broadcast History (Last 50)</h2>
          <span className="text-xs text-gray-400">Real-time push delivery log</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading broadcast history...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-700">No broadcasts recorded</p>
            <p className="text-sm text-gray-400 mt-1">Send your first push announcement using the button above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((item) => (
              <div key={item.id} className="p-5 hover:bg-gray-50/80 transition space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">{item.title}</span>
                    {getTargetBadge(item.target)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.sentAt).toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-gray-600 pl-11">{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose Broadcast Modal */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Compose Push Broadcast"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            broadcastMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Target Audience *
            </label>
            <select
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            >
              <option value="ALL">All Platform Users (Customers & Vendors)</option>
              <option value="CUSTOMERS">Customers Only (Customer App)</option>
              <option value="VENDORS">Vendors Only (Contractor Companies)</option>
              <option value="EMPLOYEES">Technicians Only (Field Technicians)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Notification Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Scheduled System Maintenance Tonight"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Message Content *
            </label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Provide clear instructions or information for mobile app users..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Broadcast Audit Reason *
            </label>
            <input
              type="text"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g. Critical notification regarding festival holiday schedules"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsComposeOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={broadcastMutation.isPending || !formData.reason.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              {broadcastMutation.isPending ? 'Broadcasting...' : 'Send Broadcast Now'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
