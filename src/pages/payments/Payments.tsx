import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  RotateCcw,
  Receipt,
  Download,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Payment, PaymentStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

export const Payments: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [refundForm, setRefundForm] = useState({
    amount: '',
    reason: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, statusFilter, search],
    queryFn: async () => {
      const params: any = { page, limit: 15 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;
      const res = await apiClient.get<{ success: boolean; data: Payment[]; pagination: any }>(
        '/admin/payments',
        { params }
      );
      return res.data;
    },
  });

  const refundMutation = useMutation({
    mutationFn: async ({ paymentId, amount, reason }: { paymentId: string; amount: number; reason: string }) => {
      await apiClient.post(`/admin/payments/${paymentId}/refund`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setRefundPayment(null);
      setRefundForm({ amount: '', reason: '' });
    },
  });

  const payments = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Financial Ledger & Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Audit transactions, manage refunds, and track platform revenue</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by transaction reference or booking number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="REFUNDED">Refunded</option>
              <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading payment ledger...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-700">No transactions found</p>
            <p className="text-sm text-gray-400 mt-1">Transactions will appear as customer bookings are processed</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Transaction Ref</th>
                <th className="px-6 py-4">Booking #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50/80 transition">
                  <td className="px-6 py-4 font-mono font-medium text-gray-900 text-xs">
                    {payment.transactionRef}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-semibold">
                    {payment.booking?.bookingNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {payment.booking?.customer?.user?.name || 'Customer'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {payment.booking?.customer?.user?.phone || 'No phone'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                      <CreditCard className="w-3 h-3 text-gray-400" />
                      {payment.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    ₹{Number(payment.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(payment.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(payment.status === 'PAID' || payment.status === 'PARTIALLY_REFUNDED') && (
                        <button
                          onClick={() => {
                            setRefundPayment(payment);
                            setRefundForm({ amount: String(payment.amount), reason: '' });
                          }}
                          className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition"
                          title="Issue Refund"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total payments)
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

      {/* Transaction Details Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Transaction Ledger Details"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Transaction Reference:</span>
                <span className="font-mono font-bold text-gray-900">{selectedPayment.transactionRef}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Booking Number:</span>
                <span className="font-mono text-indigo-600 font-semibold">{selectedPayment.booking?.bookingNumber}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Amount:</span>
                <span className="font-bold text-gray-900 text-lg">₹{Number(selectedPayment.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Method:</span>
                <span className="font-medium text-gray-800">{selectedPayment.method}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Status:</span>
                <StatusBadge status={selectedPayment.status} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Created At:</span>
                <span className="text-gray-700">{new Date(selectedPayment.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Refunds Section */}
            {selectedPayment.refunds && selectedPayment.refunds.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Refund History</h4>
                <div className="space-y-2">
                  {selectedPayment.refunds.map((refund) => (
                    <div key={refund.id} className="p-3 bg-red-50/50 border border-red-100 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-red-700">₹{Number(refund.amount).toFixed(2)} Refunded</span>
                        <span className="text-gray-500">{new Date(refund.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600">Reason: {refund.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Refund Processing Modal */}
      <Modal
        isOpen={!!refundPayment}
        onClose={() => setRefundPayment(null)}
        title="Process Financial Refund"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (refundPayment) {
              refundMutation.mutate({
                paymentId: refundPayment.id,
                amount: parseFloat(refundForm.amount),
                reason: refundForm.reason,
              });
            }
          }}
          className="space-y-4"
        >
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              This will create an immutable refund ledger record and adjust the booking payment summary. Super Admin approval and justification is recorded in the Audit Log.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Refund Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              max={refundPayment ? Number(refundPayment.amount) : undefined}
              value={refundForm.amount}
              onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
            <span className="text-xs text-gray-400 mt-1 block">
              Max refundable amount: ₹{refundPayment ? Number(refundPayment.amount).toFixed(2) : '0.00'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Refund Reason / Justification *
            </label>
            <textarea
              required
              rows={3}
              value={refundForm.reason}
              onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
              placeholder="e.g. Customer cancelled within grace period, service satisfaction dispute"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setRefundPayment(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={refundMutation.isPending || !refundForm.reason.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              {refundMutation.isPending ? 'Processing Refund...' : 'Issue Refund'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
