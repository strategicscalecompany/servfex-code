import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Percent, IndianRupee, Save, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Modal } from '../../components/common/Modal';

export const PricingSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    platformCommissionPercent: 0.0,
    baseTaxPercent: 0.0,
    minimumBookingFee: 0.0,
    cancellationFee: 0.0,
    extraChargesAllowed: true,
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['settings-pricing'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: typeof formData }>('/admin/settings/pricing');
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
      await apiClient.put('/admin/settings/pricing', { ...formData, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-pricing'] });
      setIsConfirmOpen(false);
      setReason('');
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 4000);
    },
  });

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500">Loading pricing rules...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Commission & Pricing Architecture</h1>
        <p className="text-sm text-gray-500 mt-1">
          Define platform fee cuts, applicable taxes, minimum booking charges, and technician compensation parameters
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Platform commission and pricing structures updated successfully. Audit log logged.</span>
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
            <Percent className="w-5 h-5 text-indigo-600" />
            Platform Percentages & Deductions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Standard Platform Commission (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={50}
                  value={formData.platformCommissionPercent}
                  onChange={(e) =>
                    setFormData({ ...formData, platformCommissionPercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                Standard cut deducted from vendor booking earnings (vendors can also have individual overrides)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                GST / Applicable Tax Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={30}
                  value={formData.baseTaxPercent}
                  onChange={(e) =>
                    setFormData({ ...formData, baseTaxPercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                Taxes calculated on customer invoice totals
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            Fixed Fees & Adjustments
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Minimum Booking Fee (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min={0}
                  value={formData.minimumBookingFee}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumBookingFee: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                Minimum base price enforced across any service or custom visit
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Customer Late Cancellation Fee (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min={0}
                  value={formData.cancellationFee}
                  onChange={(e) =>
                    setFormData({ ...formData, cancellationFee: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
              </div>
              <span className="text-xs text-gray-400 mt-1 block">
                Fee retained from refund if cancelled after the cancellation grace window
              </span>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div>
                <div className="text-sm font-semibold text-gray-900">Allow On-Site Extra Charges</div>
                <div className="text-xs text-gray-500">
                  Allows technicians to add approved spare parts or extra labor charges during job execution
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.extraChargesAllowed}
                onChange={(e) => setFormData({ ...formData, extraChargesAllowed: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Pricing Rules
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirm Pricing Configuration Update"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Financial fee rules affect real-time checkout totals and vendor settlements. Super Admin audit reason is mandatory.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Audit Reason / Financial Rationale *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Updated tax rate to reflect revised GST schedule; adjusted minimum booking fee"
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
