import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sliders, Save, AlertTriangle, ShieldCheck, Mail, Phone, Globe, Power } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Modal } from '../../components/common/Modal';

export const PlatformSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    platformName: 'ServFex',
    supportEmail: 'support@servfex.com',
    supportPhone: '+91 98765 43210',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    maintenanceMode: false,
    customerRegistrationEnabled: true,
    vendorRegistrationEnabled: true,
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['settings-platform'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: typeof formData }>('/admin/settings/platform');
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
      await apiClient.put('/admin/settings/platform', { ...formData, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-platform'] });
      setIsConfirmOpen(false);
      setReason('');
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 4000);
    },
  });

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500">Loading platform settings...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Platform Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Master control panel settings governing global platform operation, branding, and contact details
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Platform configuration updated successfully. All changes recorded in audit log.</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setIsConfirmOpen(true);
        }}
        className="space-y-6"
      >
        {/* Core Identity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            General Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={formData.platformName}
                onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Default Currency Code
              </label>
              <input
                type="text"
                maxLength={3}
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Platform Timezone
              </label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Support & Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            Customer & Vendor Support Contacts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Support Phone / Hotline
              </label>
              <input
                type="text"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Global Operational Toggles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Power className="w-5 h-5 text-indigo-600" />
            Platform Availability Switches
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div>
                <div className="text-sm font-semibold text-gray-900">Maintenance Mode</div>
                <div className="text-xs text-gray-500">
                  Temporarily halts booking activities across Customer & Vendor mobile apps
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.maintenanceMode}
                onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div>
                <div className="text-sm font-semibold text-gray-900">Allow Customer Registrations</div>
                <div className="text-xs text-gray-500">
                  Enable new users to sign up via the ServFex Customer app
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.customerRegistrationEnabled}
                onChange={(e) => setFormData({ ...formData, customerRegistrationEnabled: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div>
                <div className="text-sm font-semibold text-gray-900">Allow Vendor Registrations</div>
                <div className="text-xs text-gray-500">
                  Permit new contractors/service companies to apply for onboarding
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.vendorRegistrationEnabled}
                onChange={(e) => setFormData({ ...formData, vendorRegistrationEnabled: e.target.checked })}
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
            Save Platform Settings
          </button>
        </div>
      </form>

      {/* Confirmation & Reason Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirm Platform Configuration Update"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Updating global settings directly alters platform behaviors. This action will be audited under your Super Admin credentials.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Audit Reason / Change Justification *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Updated support phone number; enabled maintenance mode for scheduled migration"
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
