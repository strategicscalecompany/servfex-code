import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Booking, BookingStatus, EligibleVendor } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  Calendar,
  Search,
  Filter,
  UserCheck,
  Clock,
  Coins,
  XCircle,
  Eye,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  Building2,
  Sparkles,
  MapPin,
  Award,
  Users,
  Briefcase,
  Send,
  Navigation,
  Zap,
  RotateCw,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useBookingRealtime } from '../../hooks/useBookingRealtime';

export const Bookings: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const urlStatus = searchParams.get('status');
  const [selectedStatus, setSelectedStatus] = useState<string>(urlStatus || 'ALL');

  useEffect(() => {
    if (urlStatus) {
      setSelectedStatus(urlStatus);
    }
  }, [urlStatus]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<BookingStatus>('ACCEPTED');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isAssignEmployeeModalOpen, setIsAssignEmployeeModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [isAssignVendorModalOpen, setIsAssignVendorModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [assignReason, setAssignReason] = useState('Manual assignment by Super Admin');
  const [assignMode, setAssignMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [manualTargetType, setManualTargetType] = useState<'VENDOR' | 'EMPLOYEE'>('VENDOR');
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const {
    isConnected,
    refetchBookings,
    newBooking,
    isHighlighted,
    highlightedBookingNumbers,
    clearHighlights,
  } = useBookingRealtime();

  // If a new booking arrives, switch to page 1 and ensure ALL or PENDING tab is shown so it's directly visible
  useEffect(() => {
    if (newBooking?.bookingNumber) {
      if (selectedStatus !== 'ALL' && selectedStatus !== 'PENDING') {
        setSelectedStatus('ALL');
      }
      setPage(1);
    }
  }, [newBooking?.bookingNumber]);

  // Fetch Bookings with instant 0s realtime updates + 5s safety poll fallback
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['bookings', selectedStatus, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(selectedStatus !== 'ALL' ? { status: selectedStatus } : {}),
        ...(search ? { search } : {}),
      });
      const res = await apiClient.get(`/admin/bookings?${params.toString()}`);
      return res.data;
    },
    // 2.5-second ultra-responsive polling fallback if websocket drops
    refetchInterval: 2500,
    staleTime: 0,
    refetchIntervalInBackground: false,
  });

  // Fetch Eligible Vendors for selected booking (Auto-Dispatch ranking)
  const { data: eligibleVendorsResult, isLoading: isLoadingEligibleVendors } = useQuery({
    queryKey: ['eligible-vendors', selectedBooking?.id],
    queryFn: async () => {
      if (!selectedBooking) return null;
      const res = await apiClient.get(`/admin/bookings/${selectedBooking.id}/eligible-vendors`);
      return res.data.data;
    },
    enabled: isAssignVendorModalOpen && !!selectedBooking && assignMode === 'AUTO',
  });

  // Fetch All Platform Vendors for manual assignment modal
  const { data: allVendorsData, isLoading: isLoadingAllVendors } = useQuery({
    queryKey: ['all-vendors-for-assignment'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/vendors?limit=100&isActive=true');
      const vendors = res.data?.data;
      return Array.isArray(vendors) ? vendors : (vendors?.vendors || []);
    },
  });

  // Fetch Employees for assignment modal
  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees-for-assignment'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/employees?limit=100');
      const employees = res.data?.data;
      return Array.isArray(employees) ? employees : (employees?.employees || []);
    },
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: BookingStatus; reason: string }) => {
      return apiClient.post(`/admin/bookings/${id}/change-status`, { newStatus: status, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsStatusModalOpen(false);
      setIsDetailOpen(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiClient.post(`/admin/bookings/${id}/cancel`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsCancelModalOpen(false);
      setIsDetailOpen(false);
    },
  });

  const assignVendorMutation = useMutation({
    mutationFn: async ({ id, vendorId, reason }: { id: string; vendorId: string; reason: string }) => {
      return apiClient.post(`/admin/bookings/${id}/assign-vendor`, { vendorId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsAssignVendorModalOpen(false);
      setIsDetailOpen(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to assign partner. Please verify partner status.');
    },
  });

  const autoAssignMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return apiClient.post(`/admin/bookings/${id}/auto-assign`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsAssignVendorModalOpen(false);
      setIsDetailOpen(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Auto-assignment failed. No eligible partners found nearby.');
    },
  });

  const assignEmployeeMutation = useMutation({
    mutationFn: async ({ id, employeeId, reason }: { id: string; employeeId: string; reason: string }) => {
      return apiClient.post(`/admin/bookings/${id}/assign-employee`, { employeeId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsAssignEmployeeModalOpen(false);
      setIsAssignVendorModalOpen(false);
      setIsDetailOpen(false);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to assign expert technician.');
    },
  });

  const statusTabs = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Assigned', value: 'ASSIGNED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Awaiting Confirm', value: 'AWAITING_CUSTOMER_CONFIRMATION' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Disputed', value: 'DISPUTED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Bookings Management</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={isConnected ? 'Connected to live booking stream' : 'Syncing with backend'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isConnected ? 'Live Sync Active' : 'Connecting...'}
            </span>

            {highlightedBookingNumbers.length > 0 && (
              <button
                onClick={clearHighlights}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-100/80 text-emerald-800 border-emerald-300 hover:bg-emerald-200 transition cursor-pointer shadow-2xs"
                title="Click to clear green border highlights"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>{highlightedBookingNumbers.length} New Booking{highlightedBookingNumbers.length > 1 ? 's' : ''} Highlighted</span>
                <X className="w-3 h-3 text-emerald-700 ml-0.5" />
              </button>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete lifecycle oversight: state transitions, dispatch, exceptions, and price overrides.
          </p>
        </div>
        <button
          onClick={() => {
            refetch();
            refetchBookings();
          }}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-60"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          {isFetching ? 'Syncing...' : 'Fetch Now'}
        </button>
      </div>

      {/* Status Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedStatus === tab.value
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by booking #SFX, customer name, service..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
          />
        </div>
      </div>

      {/* Bookings Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Booking #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading bookings...
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No bookings found matching current filters.
                  </td>
                </tr>
              ) : (
                data?.data?.map((b: Booking) => {
                  const isNew = isHighlighted(b.id, b.bookingNumber);
                  return (
                    <tr
                      key={b.id}
                      className={clsx(
                        'transition-all duration-300 relative',
                        isNew
                          ? 'bg-emerald-50/70 hover:bg-emerald-50 shadow-xs'
                          : 'hover:bg-slate-50/70'
                      )}
                    >
                      <td
                        className={clsx(
                          'py-3.5 px-4 font-bold text-indigo-600 transition-colors',
                          isNew && 'border-y-2 border-l-4 border-l-emerald-600 border-y-emerald-500'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{b.bookingNumber}</span>
                          {isNew && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              NEW
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={clsx('py-3.5 px-4', isNew && 'border-y-2 border-y-emerald-500')}>
                        <span className="font-semibold text-slate-900 block">{b.customer?.user?.name || 'Customer'}</span>
                        <span className="text-xs text-slate-500">{b.customer?.user?.phone}</span>
                      </td>
                      <td className={clsx('py-3.5 px-4', isNew && 'border-y-2 border-y-emerald-500')}>
                        <span className="font-medium text-slate-800 block">{b.service?.name}</span>
                        <span className="text-xs text-slate-400">{b.package?.title}</span>
                      </td>
                      <td className={clsx('py-3.5 px-4 whitespace-nowrap', isNew && 'border-y-2 border-y-emerald-500')}>
                        <span className="font-medium text-slate-800 block">{b.scheduledDate}</span>
                        <span className="text-xs text-slate-500">{b.scheduledTimeSlot}</span>
                      </td>
                      <td className={clsx('py-3.5 px-4', isNew && 'border-y-2 border-y-emerald-500')}>
                        {b.employee ? (
                          <div>
                            <span className="font-medium text-slate-900 block">{b.employee.user.name}</span>
                            {b.helperEmployee?.user?.name ? (
                              <span className="text-xs text-indigo-600 block">+ {b.helperEmployee.user.name}</span>
                            ) : (
                              <span className="text-xs text-slate-500">{b.vendor?.companyName}</span>
                            )}
                          </div>
                        ) : b.vendor ? (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            {b.vendor.companyName} (No Tech)
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className={clsx('py-3.5 px-4 whitespace-nowrap', isNew && 'border-y-2 border-y-emerald-500')}>
                        <span className="font-bold text-slate-900 block">₹{Number(b.totalAmount)}</span>
                        <StatusBadge status={b.paymentStatus} size="sm" />
                      </td>
                      <td className={clsx('py-3.5 px-4 whitespace-nowrap', isNew && 'border-y-2 border-y-emerald-500')}>
                        <StatusBadge status={b.status} />
                      </td>
                      <td
                        className={clsx(
                          'py-3.5 px-4 text-right',
                          isNew && 'border-y-2 border-r-4 border-r-emerald-600 border-y-emerald-500'
                        )}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setSelectedVendorId(b.vendorId || '');
                            setSelectedEmployeeId(b.employeeId || '');
                            setAssignMode(b.vendorId ? 'MANUAL' : 'AUTO');
                            setIsAssignVendorModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Assign or Dispatch Order (Auto or Manual)"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Assign</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setIsDetailOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition inline-flex items-center gap-1 cursor-pointer"
                          title="Inspect Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data?.pagination && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total orders)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Booking Detail Modal */}
      {selectedBooking && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Booking Details: ${selectedBooking.bookingNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-sm">
            {/* Top Status & Price Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Status</span>
                <StatusBadge status={selectedBooking.status} size="md" />
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Total Charged</span>
                <span className="text-xl font-extrabold text-slate-900">
                  ₹{Number(selectedBooking.totalAmount)}
                </span>
              </div>
            </div>

            {/* Customer & Address */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Customer</h4>
                <p className="font-bold text-slate-900">{selectedBooking.customer?.user?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedBooking.customer?.user?.phone}</p>
                <p className="text-xs text-slate-500">{selectedBooking.customer?.user?.email}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Service Location</h4>
                <p className="font-semibold text-slate-900">{selectedBooking.address?.addressLine1}</p>
                <p className="text-xs text-slate-500">{selectedBooking.address?.city}, {selectedBooking.address?.state} - {selectedBooking.address?.postalCode}</p>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Pricing Breakdown (INR)</h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span className="font-medium text-slate-900">₹{Number(selectedBooking.basePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & GST:</span>
                  <span className="font-medium text-slate-900">
                    {Number(selectedBooking.taxes) > 0 ? `₹${Number(selectedBooking.taxes)}` : '₹0 (Waived)'}
                  </span>
                </div>
                {Number(selectedBooking.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-medium">-₹{Number(selectedBooking.discountAmount)}</span>
                  </div>
                )}
                {Number(selectedBooking.extraCharges) > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Extra Charges:</span>
                    <span className="font-medium">+₹{Number(selectedBooking.extraCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                  <span>Authoritative Total:</span>
                  <span>₹{Number(selectedBooking.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Operational Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAssignVendorModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                <span>Assign Partner / Dispatch</span>
              </button>

              <button
                onClick={() => setIsAssignEmployeeModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Assign / Reassign Technician</span>
              </button>

              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
              >
                <Clock className="w-4 h-4" />
                <span>Change Status / Override</span>
              </button>

              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1.5 ml-auto"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Booking</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Change Status Modal */}
      {selectedBooking && (
        <ConfirmModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title={`Update Status: ${selectedBooking.bookingNumber}`}
          message={`Advance or override the state machine for this booking. Current status is ${selectedBooking.status}.`}
          confirmLabel="Execute State Transition"
          isDestructive={false}
          isLoading={statusMutation.isPending}
          onConfirm={(reason) => {
            statusMutation.mutate({
              id: selectedBooking.id,
              status: newStatus,
              reason,
            });
          }}
        />
      )}

      {/* Cancel Booking Modal */}
      {selectedBooking && (
        <ConfirmModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title={`Cancel Booking: ${selectedBooking.bookingNumber}`}
          message="Are you sure you want to cancel this booking? This will update the state machine and notify the customer and vendor."
          confirmLabel="Confirm Cancellation"
          isDestructive={true}
          isLoading={cancelMutation.isPending}
          onConfirm={(reason) => {
            cancelMutation.mutate({ id: selectedBooking.id, reason });
          }}
        />
      )}

      {/* Assign Employee Modal */}
      {selectedBooking && (
        <Modal
          isOpen={isAssignEmployeeModalOpen}
          onClose={() => setIsAssignEmployeeModalOpen(false)}
          title="Dispatch / Reassign Technician"
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Select a certified technician to service this booking. Server will verify slot availability.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Technician
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none"
              >
                <option value="">Select Technician...</option>
                {employeesData?.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.user?.name} ({emp.specialization}) - {emp.vendor?.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAssignEmployeeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedEmployeeId || assignEmployeeMutation.isPending}
                onClick={() => {
                  assignEmployeeMutation.mutate({
                    id: selectedBooking.id,
                    employeeId: selectedEmployeeId,
                    reason: 'Assigned via Super Admin Console',
                  });
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {assignEmployeeMutation.isPending ? 'Validating Availability...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Order Modal with Auto (Location-Based) vs Manual Toggle */}
      {selectedBooking && (
        <Modal
          isOpen={isAssignVendorModalOpen}
          onClose={() => setIsAssignVendorModalOpen(false)}
          title={`Assign Order: ${selectedBooking.bookingNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Segmented Toggle: Auto (Location-Based) vs Manual */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setAssignMode('AUTO')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  assignMode === 'AUTO'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className={`w-4 h-4 ${assignMode === 'AUTO' ? 'text-indigo-600 fill-indigo-100' : 'text-slate-400'}`} />
                <span>⚡ Auto (Location-Based)</span>
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('MANUAL')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  assignMode === 'MANUAL'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className={`w-4 h-4 ${assignMode === 'MANUAL' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>👤 Manual Assign</span>
              </button>
            </div>

            {/* Customer & Location Context Card */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  {selectedBooking.customer?.user?.name || 'Customer'}
                  <span className="text-slate-400 font-normal">({selectedBooking.customer?.user?.phone || 'No phone'})</span>
                </span>
                <span className="font-bold text-indigo-600">
                  {selectedBooking.service?.name} • ₹{Number(selectedBooking.totalAmount)}
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {selectedBooking.address?.addressLine1 ? (
                    <>
                      {selectedBooking.address.addressLine1}
                      {selectedBooking.address.city ? `, ${selectedBooking.address.city}` : ''}
                      {selectedBooking.address.postalCode ? ` - ${selectedBooking.address.postalCode}` : ''}
                    </>
                  ) : (
                    'Customer location recorded on booking'
                  )}
                  {selectedBooking.address?.latitude && selectedBooking.address?.longitude && (
                    <span className="ml-2 font-mono text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                      GPS: {Number(selectedBooking.address.latitude).toFixed(4)}, {Number(selectedBooking.address.longitude).toFixed(4)}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* AUTO MODE */}
            {assignMode === 'AUTO' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-4 rounded-2xl border border-indigo-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Intelligent Proximity Dispatch
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Automatically evaluates distance from customer, available certified experts, and workload to dispatch to the optimal partner.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => autoAssignMutation.mutate({ id: selectedBooking.id })}
                    disabled={autoAssignMutation.isPending}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50 shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    {autoAssignMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 fill-white" />
                    )}
                    <span>Auto-Assign Nearest Provider Now</span>
                  </button>
                </div>

                {/* Ranked Nearby Partners List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Nearby Service Partners ({(Array.isArray(eligibleVendorsResult) ? eligibleVendorsResult : (eligibleVendorsResult as any)?.data || []).length})
                    </h5>
                    <span className="text-[11px] text-slate-400">Ranked by Location & Operational Score</span>
                  </div>

                  {isLoadingEligibleVendors ? (
                    <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mb-2" />
                      <span className="text-xs">Computing GPS distances and availability...</span>
                    </div>
                  ) : (Array.isArray(eligibleVendorsResult) ? eligibleVendorsResult : (eligibleVendorsResult as any)?.data || []).length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                      <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600">No Nearby Partners Auto-Matched</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                        No partners with matching category are within immediate proximity. Switch to <strong>Manual Assign</strong> to assign any registered partner or expert.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {(Array.isArray(eligibleVendorsResult) ? eligibleVendorsResult : (eligibleVendorsResult as any)?.data || []).map((vendor: EligibleVendor) => (
                        <div
                          key={vendor.vendorId}
                          className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900 truncate">
                                {vendor.companyName}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                Score: {vendor.score}
                              </span>
                              {vendor.distanceKm !== null && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {vendor.distanceKm.toFixed(1)} km away
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                {vendor.activeJobs} active job(s)
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                {vendor.completedToday} completed today
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-indigo-400" />
                                {vendor.availableEmployees} active tech(s)
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {vendor.scoringBreakdown.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-medium"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              assignVendorMutation.mutate({
                                id: selectedBooking.id,
                                vendorId: vendor.vendorId,
                                reason: 'Assigned from auto-ranked proximity list',
                              });
                            }}
                            disabled={assignVendorMutation.isPending}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition disabled:opacity-50 shrink-0 flex items-center gap-1 justify-center cursor-pointer"
                          >
                            {assignVendorMutation.isPending ? 'Assigning...' : 'Assign Directly'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MANUAL MODE */}
            {assignMode === 'MANUAL' && (
              <div className="space-y-4">
                {/* Target Type Selector */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <button
                    type="button"
                    onClick={() => setManualTargetType('VENDOR')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      manualTargetType === 'VENDOR'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Service Partner (Company)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualTargetType('EMPLOYEE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      manualTargetType === 'EMPLOYEE'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Field Expert (Technician)</span>
                  </button>
                </div>

                {manualTargetType === 'VENDOR' ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Select Partner Company
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {allVendorsData?.length || 0} active partner(s) registered
                        </span>
                      </div>

                      {/* Search input for vendors */}
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={vendorSearchQuery}
                          onChange={(e) => setVendorSearchQuery(e.target.value)}
                          placeholder="Search partner by company name, location, or owner..."
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <select
                        value={selectedVendorId}
                        onChange={(e) => setSelectedVendorId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 outline-none bg-white font-medium"
                      >
                        <option value="">-- Choose Any Registered Service Partner --</option>
                        {(allVendorsData || [])
                          .filter((v: any) => {
                            if (!vendorSearchQuery) return true;
                            const q = vendorSearchQuery.toLowerCase();
                            return (
                              v.companyName?.toLowerCase().includes(q) ||
                              v.location?.toLowerCase().includes(q) ||
                              v.user?.name?.toLowerCase().includes(q) ||
                              v.user?.phone?.includes(q)
                            );
                          })
                          .map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.companyName} ({v.location || 'Main Depot'}) - {v.user?.name || 'Owner'} [{v.user?.phone || 'No phone'}]
                            </option>
                          ))}
                      </select>
                    </div>

                    {selectedVendorId && (
                      <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-indigo-950">
                            {(allVendorsData || []).find((v: any) => v.id === selectedVendorId)?.companyName}
                          </div>
                          <div className="text-indigo-700 text-[11px] mt-0.5">
                            Location: {(allVendorsData || []).find((v: any) => v.id === selectedVendorId)?.location || 'Standard Service Area'}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                          Selected
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Select Certified Expert / Technician
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {employeesData?.length || 0} active technician(s)
                        </span>
                      </div>

                      <select
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 outline-none bg-white font-medium"
                      >
                        <option value="">-- Choose Any Platform Field Expert --</option>
                        {(employeesData || []).map((emp: any) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.user?.name || 'Technician'} ({emp.specialization || 'General'}) - Partner: {emp.vendor?.companyName || 'Independent'} [{emp.user?.phone || 'No phone'}]
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedEmployeeId && (
                      <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-indigo-950">
                            {(employeesData || []).find((e: any) => e.id === selectedEmployeeId)?.user?.name}
                          </div>
                          <div className="text-indigo-700 text-[11px] mt-0.5">
                            Specialization: {(employeesData || []).find((e: any) => e.id === selectedEmployeeId)?.specialization} • Partner: {(employeesData || []).find((e: any) => e.id === selectedEmployeeId)?.vendor?.companyName}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                          Selected
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Reason / Admin Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Dispatch Reason / Admin Notes
                  </label>
                  <input
                    type="text"
                    value={assignReason}
                    onChange={(e) => setAssignReason(e.target.value)}
                    placeholder="e.g., Manually assigned per customer request"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Manual Submit Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={
                      (manualTargetType === 'VENDOR' && !selectedVendorId) ||
                      (manualTargetType === 'EMPLOYEE' && !selectedEmployeeId) ||
                      assignVendorMutation.isPending ||
                      assignEmployeeMutation.isPending
                    }
                    onClick={() => {
                      if (manualTargetType === 'VENDOR') {
                        assignVendorMutation.mutate({
                          id: selectedBooking.id,
                          vendorId: selectedVendorId,
                          reason: assignReason || 'Manual assignment by Super Admin',
                        });
                      } else {
                        assignEmployeeMutation.mutate({
                          id: selectedBooking.id,
                          employeeId: selectedEmployeeId,
                          reason: assignReason || 'Direct expert assignment by Super Admin',
                        });
                      }
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {(assignVendorMutation.isPending || assignEmployeeMutation.isPending) && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>
                      {manualTargetType === 'VENDOR'
                        ? 'Confirm Assignment to Selected Partner'
                        : 'Confirm Assignment to Selected Expert'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAssignVendorModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

