import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Server,
  Database,
  Shield,
  Clock,
  LogOut,
  RefreshCw,
  Cpu,
  Globe,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface SystemHealth {
  status: string;
  uptime: number;
  timestamp: string;
  nodeVersion: string;
  database: {
    status: string;
    latencyMs: number;
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
}

interface ActiveSession {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
}

export const SystemActivity: React.FC = () => {
  const queryClient = useQueryClient();
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokeAllOpen, setIsRevokeAllOpen] = useState(false);

  // System Health Query
  const {
    data: healthData,
    isLoading: isHealthLoading,
    refetch: refetchHealth,
    isFetching: isHealthFetching,
  } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: SystemHealth }>('/admin/system/health');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // Active Sessions Query
  const { data: sessions = [], isLoading: isSessionsLoading } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ActiveSession[] }>('/auth/sessions');
      return res.data.data;
    },
  });

  // Revoke Single Session Mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/auth/sessions/${id}/revoke`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      setRevokingSessionId(null);
    },
  });

  // Revoke All Sessions Mutation
  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/revoke-all');
    },
    onSuccess: () => {
      // Super Admin's own session is revoked, will force login redirect
      window.location.href = '/login';
    },
  });

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Health & Active Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time API performance metrics, database latency, and Super Admin session security
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchHealth()}
            disabled={isHealthFetching}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isHealthFetching ? 'animate-spin' : ''}`} />
            Refresh Diagnostics
          </button>
          <button
            onClick={() => setIsRevokeAllOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition shadow-sm"
          >
            <Shield className="w-3.5 h-3.5" />
            Revoke All Sessions
          </button>
        </div>
      </div>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Core API Status"
          value={healthData?.status || 'HEALTHY'}
          icon={<Server className="w-6 h-6 text-emerald-600" />}
          change={healthData?.nodeVersion ? `Node.js ${healthData.nodeVersion}` : undefined}
          changeType="positive"
        />
        <StatCard
          title="PostgreSQL Latency"
          value={healthData ? `${healthData.database.latencyMs} ms` : '--'}
          icon={<Database className="w-6 h-6 text-indigo-600" />}
          change={healthData?.database.status || 'CONNECTED'}
          changeType="positive"
        />
        <StatCard
          title="Process Uptime"
          value={healthData ? formatUptime(healthData.uptime) : '--'}
          icon={<Clock className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          title="RAM (Heap Used)"
          value={healthData ? formatMemory(healthData.memory.heapUsed) : '--'}
          icon={<Cpu className="w-6 h-6 text-purple-600" />}
          change={healthData ? `Total: ${formatMemory(healthData.memory.heapTotal)}` : undefined}
        />
      </div>

      {/* Active Super Admin Sessions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Active Super Admin Sessions</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Revoke compromised device tokens to prevent unauthorized panel access
            </p>
          </div>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {sessions.length} Active Session{sessions.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isSessionsLoading ? (
          <div className="p-12 text-center text-gray-500">Loading active sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-700">No active sessions found</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Browser & Device</th>
                <th className="px-6 py-4">Authenticated At</th>
                <th className="px-6 py-4">Token Expiration</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-gray-50/80 transition">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-900">
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      {sess.ipAddress || '127.0.0.1'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                    {sess.userAgent || 'Unknown Browser Client'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(sess.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(sess.expiresAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setRevokingSessionId(sess.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Revoke Single Session Modal */}
      <ConfirmModal
        isOpen={!!revokingSessionId}
        onClose={() => setRevokingSessionId(null)}
        onConfirm={() => {
          if (revokingSessionId) {
            revokeSessionMutation.mutate(revokingSessionId);
          }
        }}
        title="Revoke Admin Session"
        message="Are you sure you want to revoke this session? The device will be disconnected and required to re-authenticate."
        confirmText="Revoke Session"
        requireReason={false}
        danger={true}
      />

      {/* Revoke All Sessions Modal */}
      <ConfirmModal
        isOpen={isRevokeAllOpen}
        onClose={() => setIsRevokeAllOpen(false)}
        onConfirm={() => revokeAllMutation.mutate()}
        title="Revoke All Super Admin Sessions"
        message="This will immediately invalidate ALL active Super Admin sessions across all devices, including this current browser tab. You will be redirected to the login page."
        confirmText="Revoke All & Sign Out"
        requireReason={false}
        danger={true}
      />
    </div>
  );
};
