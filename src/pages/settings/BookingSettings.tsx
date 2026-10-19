import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Calendar, Save, AlertTriangle, ShieldCheck, Settings } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Modal } from '../../components/common/Modal';

export const BookingSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    cancellationWindowHours: 4,
    rescheduleLimitPerBooking: 2,
    slotIntervalMinutes: 60,
    autoAssignEnabled: false,
    maxAdvanceBookingDays: 30,
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['settings-booking'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: typeof formData }>('/admin/settings/booking');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/admin/settings/booking', { ...formData, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-booking'] });
      setIsConfirmOpen(false);
      setReason('');
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 4000);
    },
  });

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500">Loading booking configuration...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Booking Rules & Constraints</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure scheduling intervals, cancellation windows, and automated technician assignment rules
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Booking configuration rules updated successfully and committed to the audit ledger.</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setIsConfirmOpen(true);
        }}
        className="space-y-6"
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Scheduling & Windows
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Cancellation Window (Hours)
              </label>
              <input
                type="number"
                min={0}
                max={72}
                value={formData.cancellationWindowHours}
                onChange={(e) => setFormData({ ...formData, cancellationWindowHours: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Minimum hours prior to job start time for penalty-free customer cancellation
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Max Reschedule Limit
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={formData.rescheduleLimitPerBooking}
                onChange={(e) => setFormData({ ...formData, rescheduleLimitPerBooking: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Maximum number of times a customer can reschedule a single booking
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Slot Interval (Minutes)
              </label>
              <select
                value={formData.slotIntervalMinutes}
                onChange={(e) => setFormData({ ...formData, slotIntervalMinutes: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes (1 Hour)</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes (2 Hours)</option>
              </select>
              <span className="text-xs text-gray-400 mt-1 block">
                Time slot duration available for customer appointment selection
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Advance Booking Horizon (Days)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={formData.maxAdvanceBookingDays}
                onChange={(e) => setFormData({ ...formData, maxAdvanceBookingDays: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Maximum days in advance a customer can schedule an appointment
              </span>
            </div>
          </div>
        </div>

        {/* Automation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Dispatch Automation
          </h2>

          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
            <div>
              <div className="text-sm font-semibold text-gray-900">Auto-Assign Technician on Creation</div>
              <div className="text-xs text-gray-500">
                When enabled, incoming bookings are automatically routed to the highest-rated available vendor in the customer's district
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.autoAssignEnabled}
              onChange={(e) => setFormData({ ...formData, autoAssignEnabled: e.target.checked })}
              className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Booking Rules
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirm Booking Rules Modification"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Adjusting booking rules modifies active appointment scheduling limits. Super Admin audit reason is mandatory.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Audit Reason *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Tightened cancellation window from 4 to 2 hours for seasonal peak"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!reason.trim() || updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Confirm & Apply'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
