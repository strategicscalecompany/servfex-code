import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { EmployeeProfile } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  UserCheck,
  Search,
  Plus,
  Eye,
  Star,
  Phone,
  Briefcase,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const Employees: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [page, setPage] = useState(1);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignVendorOpen, setIsAssignVendorOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newVendorId, setNewVendorId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vendorId: '',
    specialization: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, vendorFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(vendorFilter ? { vendorId: vendorFilter } : {}),
        ...(search ? { search } : {}),
      });
      const res = await apiClient.get(`/admin/employees?${params.toString()}`);
      return res.data;
    },
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-list-dropdown'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/vendors?limit=100');
      return res.data.data;
    },
  });

  const assignVendorMutation = useMutation({
    mutationFn: async ({ id, vendorId, reason }: { id: string; vendorId: string; reason: string }) => {
      return apiClient.patch(`/admin/employees/${id}/assign-vendor`, { vendorId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsAssignVendorOpen(false);
      setIsDetailOpen(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, isAvailable, reason }: { id: string; isAvailable: boolean; reason: string }) => {
      return apiClient.patch(`/admin/employees/${id}/status`, { isAvailable, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsDetailOpen(false);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/admin/employees', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsCreateOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        vendorId: '',
        specialization: '',
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff & Technicians</h1>
          <p className="text-sm text-slate-500 mt-1">
            Certified service providers, vendor attachments, job ratings, and live availability.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Technician</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search by technician name, specialization, or phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none"
          />
        </div>

        <select
          value={vendorFilter}
          onChange={(e) => {
            setVendorFilter(e.target.value);
            setPage(1);
          }}
          className="p-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none"
        >
          <option value="">All Contracting Vendors</option>
          {vendorsData?.map((v: any) => (
            <option key={v.id} value={v.id}>
              {v.companyName}
            </option>
          ))}
        </select>
      </div>

      {/* Technicians Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Technician</th>
                <th className="py-3.5 px-4">Contracting Vendor</th>
                <th className="py-3.5 px-4">Specialization</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Jobs Done</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading technicians...
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No technicians found matching current filters.
                  </td>
                </tr>
              ) : (
                data?.data?.map((emp: EmployeeProfile) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {emp.user?.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{emp.user?.name}</span>
                          <span className="text-xs text-slate-400">{emp.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 block">{emp.vendor?.companyName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-indigo-600">
                      {emp.specialization}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-bold text-amber-600 text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{emp.rating}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {emp.completedJobs}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          emp.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {emp.isAvailable ? 'Available' : 'Busy / Off-duty'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsDetailOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data?.pagination && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} staff)
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

      {/* Inspect Employee Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Technician: ${selectedEmployee.user?.name}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-base">
                  {selectedEmployee.user?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedEmployee.user?.name}</h3>
                  <p className="text-xs text-indigo-600 font-semibold">{selectedEmployee.specialization}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedEmployee.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {selectedEmployee.isAvailable ? 'Available' : 'Busy'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold uppercase block mb-1">Contracting Vendor</span>
                <span className="font-semibold text-slate-800">{selectedEmployee.vendor?.companyName}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold uppercase block mb-1">Jobs Completed</span>
                <span className="font-bold text-slate-900 text-sm">{selectedEmployee.completedJobs}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  statusMutation.mutate({
                    id: selectedEmployee.id,
                    isAvailable: !selectedEmployee.isAvailable,
                    reason: 'Availability toggled by Super Admin',
                  });
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Toggle {selectedEmployee.isAvailable ? 'Off-Duty' : 'Available'}
              </button>

              <button
                onClick={() => setIsAssignVendorOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition flex items-center gap-1.5"
              >
                <Briefcase className="w-4 h-4" />
                <span>Transfer Vendor</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Transfer Vendor Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={isAssignVendorOpen}
          onClose={() => setIsAssignVendorOpen(false)}
          title={`Reassign Vendor: ${selectedEmployee.user?.name}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Select the new vendor contractor to whom this certified technician will be assigned.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Target Vendor
              </label>
              <select
                value={newVendorId}
                onChange={(e) => setNewVendorId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none"
              >
                <option value="">Select Vendor...</option>
                {vendorsData?.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.companyName} ({v.location})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAssignVendorOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newVendorId || assignVendorMutation.isPending}
                onClick={() => {
                  assignVendorMutation.mutate({
                    id: selectedEmployee.id,
                    vendorId: newVendorId,
                    reason: 'Vendor reassigned via Super Admin Console',
                  });
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {assignVendorMutation.isPending ? 'Transferring...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Technician Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Certified Technician">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Technician Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Specialization
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AC & Refrigeration Specialist"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Assigned Vendor
              </label>
              <select
                required
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none"
              >
                <option value="">Select Vendor...</option>
                {vendorsData?.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Account Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Initial Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none"
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
              {createMutation.isPending ? 'Adding...' : 'Add Technician'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
