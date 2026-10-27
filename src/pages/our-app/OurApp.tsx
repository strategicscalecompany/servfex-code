import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Send,
  Zap,
  Globe,
  Radio,
  QrCode,
  MapPin,
  Lock,
  CreditCard,
  Bell,
  Activity,
  Layers,
  Cpu,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

interface AppVersionInfo {
  name: string;
  platform: string;
  latestVersion: string;
  minVersion: string;
  forceUpdate: boolean;
  maintenanceMode: boolean;
  activeUsers: number;
  crashFreeRate: number;
  rating: number;
  buildNumber: number;
  lastUpdated: string;
}

export const OurApp: React.FC = () => {
  const [customerApp, setCustomerApp] = useState<AppVersionInfo>({
    name: 'ServFex Customer App',
    platform: 'Android & iOS (Native Compose)',
    latestVersion: '2.4.0',
    minVersion: '2.1.0',
    forceUpdate: false,
    maintenanceMode: false,
    activeUsers: 18450,
    crashFreeRate: 99.88,
    rating: 4.8,
    buildNumber: 142,
    lastUpdated: '12 Oct 2026',
  });

  const [vendorApp, setVendorApp] = useState<AppVersionInfo>({
    name: 'ServFex Partner & Employee App',
    platform: 'Android (Jetpack Compose + OSM)',
    latestVersion: '1.9.2',
    minVersion: '1.7.0',
    forceUpdate: true,
    maintenanceMode: false,
    activeUsers: 3420,
    crashFreeRate: 99.92,
    rating: 4.7,
    buildNumber: 88,
    lastUpdated: '10 Oct 2026',
  });

  // Feature Flags
  const [featureFlags, setFeatureFlags] = useState({
    liveTracking: true,
    qrVerification: true,
    instantUpiPayouts: true,
    cashOnDelivery: true,
    inAppCustomerChat: true,
    biometricAuth: true,
    emergencySosButton: true,
    darkThemeOption: true,
  });

  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [pushTarget, setPushTarget] = useState<'ALL' | 'CUSTOMERS' | 'VENDORS'>('ALL');
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushSuccess, setPushSuccess] = useState(false);

  const toggleFlag = (key: keyof typeof featureFlags) => {
    setFeatureFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSendPush = (e: React.FormEvent) => {
    e.preventDefault();
    setPushSuccess(true);
    setTimeout(() => {
      setPushSuccess(false);
      setIsPushModalOpen(false);
      setPushTitle('');
      setPushBody('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Smartphone className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Our App & Mobile Suite</h1>
              <p className="text-xs text-slate-500">
                Manage mobile client versions, mandatory force-updates, runtime feature flags, and APK artifacts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPushModalOpen(true)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition inline-flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            <span>Broadcast In-App Push</span>
          </button>
        </div>
      </div>

      {/* Mobile Apps Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer App Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{customerApp.name}</h3>
                <p className="text-xs text-slate-500">{customerApp.platform}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Build #{customerApp.buildNumber}
                  </span>
                  <span className="text-[11px] text-slate-400">Updated {customerApp.lastUpdated}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                <span>★</span>
                <span className="text-slate-900">{customerApp.rating}</span>
                <span className="text-xs text-slate-400">/ 5.0</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold block">
                {customerApp.crashFreeRate}% Crash-free
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Latest Store Version</span>
              <span className="font-extrabold text-slate-900 text-sm">{customerApp.latestVersion}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Min Supported Version</span>
              <span className="font-bold text-slate-700 text-sm">{customerApp.minVersion}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Daily Active Users</span>
              <span className="font-extrabold text-indigo-600 text-sm">
                {customerApp.activeUsers.toLocaleString()} Users
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">App Engine</span>
              <span className="font-semibold text-slate-700 text-sm">Jetpack Compose</span>
            </div>
          </div>

          {/* Toggle Controls */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Enforce Mandatory Update</span>
                <span className="text-[11px] text-slate-500">Block users below {customerApp.minVersion} from booking</span>
              </div>
              <button
                onClick={() => setCustomerApp({ ...customerApp, forceUpdate: !customerApp.forceUpdate })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  customerApp.forceUpdate ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    customerApp.forceUpdate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Customer App Maintenance Mode</span>
                <span className="text-[11px] text-slate-500">Display downtime splash banner to customers</span>
              </div>
              <button
                onClick={() => setCustomerApp({ ...customerApp, maintenanceMode: !customerApp.maintenanceMode })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  customerApp.maintenanceMode ? 'bg-amber-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    customerApp.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button className="flex-1 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition inline-flex items-center justify-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Download Customer APK</span>
            </button>
            <button className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition inline-flex items-center justify-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              <span>Testflight / Staging QR</span>
            </button>
          </div>
        </div>

        {/* Partner & Employee App Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{vendorApp.name}</h3>
                <p className="text-xs text-slate-500">{vendorApp.platform}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Build #{vendorApp.buildNumber}
                  </span>
                  <span className="text-[11px] text-slate-400">Updated {vendorApp.lastUpdated}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                <span>★</span>
                <span className="text-slate-900">{vendorApp.rating}</span>
                <span className="text-xs text-slate-400">/ 5.0</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold block">
                {vendorApp.crashFreeRate}% Crash-free
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Latest Build Version</span>
              <span className="font-extrabold text-slate-900 text-sm">{vendorApp.latestVersion}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Min Supported Version</span>
              <span className="font-bold text-slate-700 text-sm">{vendorApp.minVersion}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Active Field Technicians</span>
              <span className="font-extrabold text-amber-700 text-sm">
                {vendorApp.activeUsers.toLocaleString()} Online
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Map Engine</span>
              <span className="font-semibold text-slate-700 text-sm">Google Maps Platform</span>
            </div>
          </div>

          {/* Toggle Controls */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Enforce Mandatory Update</span>
                <span className="text-[11px] text-slate-500">Require all field agents to be on {vendorApp.latestVersion}</span>
              </div>
              <button
                onClick={() => setVendorApp({ ...vendorApp, forceUpdate: !vendorApp.forceUpdate })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  vendorApp.forceUpdate ? 'bg-amber-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    vendorApp.forceUpdate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Partner App Maintenance Mode</span>
                <span className="text-[11px] text-slate-500">Suspend order dispatch during emergency maintenance</span>
              </div>
              <button
                onClick={() => setVendorApp({ ...vendorApp, maintenanceMode: !vendorApp.maintenanceMode })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  vendorApp.maintenanceMode ? 'bg-amber-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    vendorApp.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button className="flex-1 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition inline-flex items-center justify-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Download Vendor APK</span>
            </button>
            <button className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition inline-flex items-center justify-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              <span>Vendor Test QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Flags Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Runtime Mobile Feature Flags</h3>
            <p className="text-xs text-slate-500">
              Enable or disable platform capabilities remotely across Android and iOS apps without app store resubmission.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <Radio className="w-3 h-3 animate-pulse text-emerald-500" />
            <span>Live Sync Active</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Flag 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Live Google Maps Tracking</span>
              </div>
              <p className="text-[11px] text-slate-500">Realtime technician location broadcast on Google Maps</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600">
                {featureFlags.liveTracking ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() => toggleFlag('liveTracking')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  featureFlags.liveTracking ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    featureFlags.liveTracking ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Flag 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Start OTP Verification</span>
              </div>
              <p className="text-[11px] text-slate-500">Require the expert to enter the customer 4-digit OTP before work starts</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600">
                {featureFlags.qrVerification ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() => toggleFlag('qrVerification')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  featureFlags.qrVerification ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    featureFlags.qrVerification ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Flag 3 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Instant UPI Payouts</span>
              </div>
              <p className="text-[11px] text-slate-500">Automated instant payout release to partner bank account</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600">
                {featureFlags.instantUpiPayouts ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() => toggleFlag('instantUpiPayouts')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  featureFlags.instantUpiPayouts ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    featureFlags.instantUpiPayouts ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Flag 4 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Lock className="w-4 h-4 text-rose-600" />
                <span>Biometric Authentication</span>
              </div>
              <p className="text-[11px] text-slate-500">Fingerprint & FaceID biometric unlock for technician login</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
              <span className="text-[11px] font-semibold text-slate-600">
                {featureFlags.biometricAuth ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() => toggleFlag('biometricAuth')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  featureFlags.biometricAuth ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    featureFlags.biometricAuth ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      <Modal isOpen={isPushModalOpen} onClose={() => setIsPushModalOpen(false)} title="Broadcast App Announcement" maxWidth="md">
        <form onSubmit={handleSendPush} className="space-y-4">
          <p className="text-xs text-slate-500">
            Send an instant high-priority in-app notification to all installed mobile devices via Firebase Cloud Messaging.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Target Audience</label>
            <select
              value={pushTarget}
              onChange={(e) => setPushTarget(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
            >
              <option value="ALL">All Apps (Customers & Partners)</option>
              <option value="CUSTOMERS">Customers Only</option>
              <option value="VENDORS">Partners & Technicians Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Notice Title</label>
            <input
              type="text"
              required
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              placeholder="e.g. Scheduled Service Maintenance or Special Offer"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Message Body</label>
            <textarea
              required
              rows={3}
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              placeholder="Enter user-facing notification content..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 resize-none"
            />
          </div>

          {pushSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Broadcast dispatched successfully to active FCM tokens!</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPushModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Push</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
