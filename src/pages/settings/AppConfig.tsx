import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Smartphone, Save, AlertTriangle, ShieldCheck, Download, AlertOctagon } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Modal } from '../../components/common/Modal';

export const AppConfig: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customer: {
      minimumVersion: '1.0.0',
      latestVersion: '1.2.0',
      forceUpdate: false,
      maintenanceMode: false,
    },
    vendor: {
      minimumVersion: '1.0.0',
      latestVersion: '1.1.0',
      forceUpdate: false,
      maintenanceMode: false,
    },
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['settings-app-config'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: typeof formData }>('/admin/settings/app-config');
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
      await apiClient.put('/admin/settings/app-config', { ...formData, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-app-config'] });
      setIsConfirmOpen(false);
      setReason('');
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 4000);
    },
  });

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500">Loading mobile app configuration...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mobile Apps Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage version gates, forced updates, and maintenance shutdowns for Android Customer & Vendor applications
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Mobile app configurations updated. Client apps will enforce version gates immediately.</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setIsConfirmOpen(true);
        }}
        className="space-y-6"
      >
        {/* Customer App Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              📱
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">ServFex Customer Android App</h2>
              <p className="text-xs text-gray-500">Package: com.servfex.customer</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Minimum Supported Version (Hard Gate)
              </label>
              <input
                type="text"
                required
                value={formData.customer.minimumVersion}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer: { ...formData.customer, minimumVersion: e.target.value },
                  })
                }
                placeholder="1.0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Users on versions below this will be blocked from using the app
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Latest Available Version (Play Store)
              </label>
              <input
                type="text"
                required
                value={formData.customer.latestVersion}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer: { ...formData.customer, latestVersion: e.target.value },
                  })
                }
                placeholder="1.2.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Target release version available on Google Play
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div>
                <div className="text-sm font-semibold text-gray-900">Force Immediate Update</div>
                <div className="text-xs text-gray-500">
                  Blocks all customer app usage until user updates to latest release
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.customer.forceUpdate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer: { ...formData.customer, forceUpdate: e.target.checked },
                  })
                }
                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div>
                <div className="text-sm font-semibold text-gray-900">Customer App Maintenance Mode</div>
                <div className="text-xs text-gray-500">
                  Shows maintenance screen on customer mobile app
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.customer.maintenanceMode || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer: { ...formData.customer, maintenanceMode: e.target.checked },
                  })
                }
                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* Vendor App Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              🛠️
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">ServFex Vendor & Technician Android App</h2>
              <p className="text-xs text-gray-500">Package: com.servfex.vendor</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Minimum Supported Version (Hard Gate)
              </label>
              <input
                type="text"
                required
                value={formData.vendor.minimumVersion}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vendor: { ...formData.vendor, minimumVersion: e.target.value },
                  })
                }
                placeholder="1.0.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Vendors below this version cannot receive dispatch orders
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Latest Available Version (Play Store)
              </label>
              <input
                type="text"
                required
                value={formData.vendor.latestVersion}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vendor: { ...formData.vendor, latestVersion: e.target.value },
                  })
                }
                placeholder="1.1.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Current release version for contractor staff
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div>
                <div className="text-sm font-semibold text-gray-900">Force Immediate Update</div>
                <div className="text-xs text-gray-500">
                  Mandatory update prompt for all technicians and vendor staff
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.vendor.forceUpdate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vendor: { ...formData.vendor, forceUpdate: e.target.checked },
                  })
                }
                className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
              <div>
                <div className="text-sm font-semibold text-gray-900">Vendor App Maintenance Mode</div>
                <div className="text-xs text-gray-500">
                  Temporarily disable vendor dispatch portal during backend maintenance
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.vendor.maintenanceMode || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vendor: { ...formData.vendor, maintenanceMode: e.target.checked },
                  })
                }
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
            Save App Configurations
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirm Mobile Apps Version Gate Update"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Enabling forced updates or raising the minimum version will immediately prevent users on outdated Android APKs from placing or accepting bookings.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Audit Reason / Release Notes *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Mandatory update pushed following security protocol patch"
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
              {updateMutation.isPending ? 'Applying...' : 'Confirm & Apply'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
