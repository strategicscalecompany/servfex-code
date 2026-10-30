import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { CustomerBookingSummary, User } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  Search,
  UserPlus,
  Loader2,
  Calendar,
  MapPin,
  Phone,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';

const formatMoney = (value: number | string | null | undefined) => {
  const amount = Number(value || 0);
  return `₹${Number.isFinite(amount) ? amount.toLocaleString('en-IN') : '0'}`;
};

const formatPhone = (phone?: string | null) => {
  if (!phone) return 'No mobile number';
  return phone;
};

const formatLocation = (customer: User) => {
  if (customer.location) return customer.location;
  const address = customer.defaultAddress || customer.addresses?.[0];
  if (!address) return null;
  return [address.addressLine1, address.landmark, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(', ');
};

const customerInitial = (name?: string | null) => (name?.trim()?.charAt(0) || '?').toUpperCase();

const BookingDetailsTable: React.FC<{
  bookings: CustomerBookingSummary[];
  isLoading?: boolean;
  emptyLabel?: string;
}> = ({ bookings, isLoading, emptyLabel }) => {
  if (isLoading) {
    return (
      <div className="py-6 text-center text-slate-400 text-xs">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
        Loading booking details...
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <p className="py-4 text-center text-xs text-slate-400">
        {emptyLabel || 'No bookings placed by this customer yet.'}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <th className="py-2 px-3">Booking</th>
            <th className="py-2 px-3">Service</th>
            <th className="py-2 px-3">Schedule</th>
            <th className="py-2 px-3">Location</th>
            <th className="py-2 px-3">Amount</th>
            <th className="py-2 px-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.map((booking) => (
            <tr key={booking.id} className="text-xs">
              <td className="py-2.5 px-3">
                <Link
                  to="/bookings"
                  className="font-bold text-indigo-600 hover:text-indigo-800"
                >
                  {booking.bookingNumber}
                </Link>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  {booking.vendor?.companyName || 'Unassigned partner'}
                </span>
              </td>
              <td className="py-2.5 px-3">
                <span className="font-semibold text-slate-800 block">
                  {booking.service?.name || 'Service'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {booking.package?.name || booking.package?.title || '—'}
                </span>
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <span className="font-medium text-slate-800 block">{booking.scheduledDate}</span>
                <span className="text-[11px] text-slate-400">{booking.scheduledTimeSlot}</span>
              </td>
              <td className="py-2.5 px-3 max-w-[220px]">
                <span className="text-slate-600 line-clamp-2">
                  {booking.location || 'Location not captured'}
                </span>
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <span className="font-bold text-slate-900 block">{formatMoney(booking.totalAmount)}</span>
                <StatusBadge status={booking.paymentStatus} />
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <StatusBadge status={booking.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Customers: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    notes: '',
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customers', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      });
      const res = await apiClient.get(`/admin/customers?${params.toString()}`);
      return res.data;
    },
  });

  const { data: expandedBookings, isLoading: isBookingsLoading } = useQuery({
    queryKey: ['customer-bookings', expandedId],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/customers/${expandedId}/bookings?limit=20`);
      return res.data;
    },
    enabled: !!expandedId,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      return apiClient.post('/admin/customers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCreateOpen(false);
      setFormData({ name: '', email: '', phone: '', password: '', notes: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiClient.delete(`/admin/customers/${id}`, { data: { reason } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.removeQueries({ queryKey: ['customer-bookings'] });
      setIsDeleteOpen(false);
      setSelectedCustomer(null);
    },
  });

  const customers: User[] = data?.data || [];

  const toggleExpanded = (customerId: string) => {
    setExpandedId((current) => (current === customerId ? null : customerId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customers Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Registered customer accounts with mobile numbers, delivery locations, and booking histories.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name, email, or mobile number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="p-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none"
        >
          <option value="">All Account Statuses</option>
          <option value="ACTIVE">Active Only</option>
          <option value="SUSPENDED">Suspended Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-10" />
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Mobile Number</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Bookings</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading registered customers...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
                    <p className="text-sm font-semibold text-slate-800">Could not load registered customers</p>
                    <p className="text-xs text-slate-400 mt-1 mb-3">
                      {(error as any)?.response?.data?.error?.message || 'Please retry fetching customer records.'}
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No registered customers found matching current filters.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const isExpanded = expandedId === customer.id;
                  const location = formatLocation(customer);
                  const bookingCount = customer.customerProfile?.totalBookings ?? customer.recentBookings?.length ?? 0;
                  const dropdownBookings: CustomerBookingSummary[] =
                    expandedBookings?.data && isExpanded
                      ? expandedBookings.data
                      : customer.recentBookings || [];

                  return (
                    <React.Fragment key={customer.id}>
                      <tr className={clsx('hover:bg-slate-50/70 transition', isExpanded && 'bg-indigo-50/40')}>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => toggleExpanded(customer.id)}
                            className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center justify-center text-slate-500"
                            title={isExpanded ? 'Hide bookings' : 'Show bookings'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                              {customerInitial(customer.name)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block">{customer.name || 'Unnamed customer'}</span>
                              <span className="text-xs text-slate-400">{customer.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {formatPhone(customer.phone)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-[260px]">
                          {location ? (
                            <span className="inline-flex items-start gap-1.5 text-xs text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{location}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">No location saved</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => toggleExpanded(customer.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {bookingCount} {bookingCount === 1 ? 'booking' : 'bookings'}
                            <ChevronDown className={clsx('w-3.5 h-3.5 transition', isExpanded && 'rotate-180')} />
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={customer.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              deleteMutation.reset();
                              setSelectedCustomer(customer);
                              setIsDeleteOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition inline-flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="rounded-xl border border-slate-200 bg-white">
                              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Booking details
                                  </p>
                                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                                    {customer.name || 'Customer'} · {formatPhone(customer.phone)}
                                  </p>
                                </div>
                                {expandedBookings?.pagination?.total != null && (
                                  <span className="text-xs text-slate-400">
                                    {expandedBookings.pagination.total} total
                                  </span>
                                )}
                              </div>
                              <BookingDetailsTable
                                bookings={dropdownBookings}
                                isLoading={isBookingsLoading && dropdownBookings.length === 0}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {data?.pagination && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} customers)
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

      {selectedCustomer && (
        <ConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelectedCustomer(null);
          }}
          title={`Delete Customer: ${selectedCustomer.name || 'Unnamed customer'}`}
          message={`This permanently deletes ${selectedCustomer.name || 'this customer'} (${selectedCustomer.phone || selectedCustomer.email}) from the database, including bookings, addresses, and login identity. They will be able to register again as a new customer.${
            deleteMutation.isError
              ? ` ${(deleteMutation.error as any)?.response?.data?.error?.message || 'Deletion failed. Please try again.'}`
              : ''
          }`}
          confirmLabel="Delete Customer"
          isDestructive={true}
          isLoading={deleteMutation.isPending}
          onConfirm={(reason) => {
            deleteMutation.mutate({
              id: selectedCustomer.id,
              reason,
            });
          }}
        />
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Customer">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Mobile Number
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Initial Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
