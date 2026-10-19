import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  FileCode,
  Calendar,
  Globe,
  Clock,
  User,
  CheckCircle,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { AuditLog } from '../../types';
import { Modal } from '../../components/common/Modal';

export const AuditLogs: React.FC = () => {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, entityFilter, search],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (entityFilter !== 'ALL') params.entityType = entityFilter;
      if (search) params.search = search;
      const res = await apiClient.get<{ success: boolean; data: AuditLog[]; pagination: any }>(
        '/admin/audit-logs',
        { params }
      );
      return res.data;
    },
  });

  const logs = data?.data || [];
  const pagination = data?.pagination;

  const getActionBadge = (action: string) => {
    let color = 'bg-gray-100 text-gray-700 border-gray-200';
    if (action.includes('CREATED') || action.includes('APPROVED')) {
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (action.includes('UPDATED') || action.includes('OVERRIDE')) {
      color = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (action.includes('REJECTED') || action.includes('DELETED') || action.includes('SUSPENDED') || action.includes('REFUND')) {
      color = 'bg-red-50 text-red-700 border-red-200';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold border ${color}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Security & Audit Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tamper-evident, immutable transaction trail recording all Super Admin operations and overrides
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action, reason, or entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Entity Types</option>
              <option value="Booking">Bookings</option>
              <option value="VendorProfile">Vendors</option>
              <option value="CustomerProfile">Customers</option>
              <option value="EmployeeProfile">Technicians</option>
              <option value="Payment">Payments & Refunds</option>
              <option value="Review">Reviews</option>
              <option value="Service">Services</option>
              <option value="PlatformSetting">Platform Settings</option>
              <option value="AppConfiguration">App Config</option>
              <option value="Notification">Notifications</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading audit ledger...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-700">No audit records found</p>
            <p className="text-sm text-gray-400 mt-1">Super Admin actions will be recorded here automatically</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Reason / Notes</th>
                <th className="px-6 py-4">Super Admin</th>
                <th className="px-6 py-4">IP / Client</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/80 transition">
                  <td className="px-6 py-4">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{log.entityType}</div>
                    <div className="font-mono text-xs text-gray-400 truncate max-w-[140px]" title={log.entityId}>
                      {log.entityId}
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {log.reason || <span className="text-gray-300 italic">No reason provided</span>}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-800">
                    {log.superAdmin?.name || 'Super Admin'}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                      title="Inspect Diff"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} audit events)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Diff Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Deep Inspection"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg text-xs">
              <div>
                <span className="text-gray-400 block mb-0.5">Action:</span>
                <span className="font-semibold text-gray-900">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Entity Type & ID:</span>
                <span className="font-mono font-medium text-gray-900">
                  {selectedLog.entityType} ({selectedLog.entityId})
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Executed By:</span>
                <span className="font-medium text-gray-800">
                  {selectedLog.superAdmin?.name} ({selectedLog.superAdmin?.email})
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Origin IP / Agent:</span>
                <span className="font-mono text-gray-700">{selectedLog.ipAddress || '127.0.0.1'}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-gray-200">
                <span className="text-gray-400 block mb-0.5">Justification / Reason:</span>
                <span className="font-medium text-gray-900 italic">
                  {selectedLog.reason || 'None specified'}
                </span>
              </div>
            </div>

            {/* Before / After Payload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-gray-400" />
                  State Before Change
                </div>
                <div className="bg-gray-950 text-gray-200 p-3 rounded-lg text-xs font-mono overflow-auto max-h-60 border border-gray-800">
                  {selectedLog.before ? (
                    <pre>{JSON.stringify(selectedLog.before, null, 2)}</pre>
                  ) : (
                    <span className="text-gray-500 italic">Null (New record creation)</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  State After Change
                </div>
                <div className="bg-gray-950 text-gray-200 p-3 rounded-lg text-xs font-mono overflow-auto max-h-60 border border-gray-800">
                  {selectedLog.after ? (
                    <pre>{JSON.stringify(selectedLog.after, null, 2)}</pre>
                  ) : (
                    <span className="text-gray-500 italic">Null (Record deletion)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
