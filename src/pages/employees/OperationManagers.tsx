import React, { useState } from 'react';
import {
  Compass,
  Search,
  Plus,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Building,
  UserCheck,
  Eye,
  CheckCircle,
  Clock,
  Layers,
  Activity,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

interface OperationManager {
  id: string;
  name: string;
  email: string;
  phone: string;
  zone: string;
  city: string;
  managedVendors: number;
  monthlyJobs: number;
  slaRate: number; // percentage
  status: 'On-Duty' | 'In-Field' | 'Off-Duty';
  shiftHours: string;
  emergencyLead: boolean;
}

const INITIAL_MANAGERS: OperationManager[] = [
  {
    id: 'OM-301',
    name: 'Suresh Krishnan',
    email: 'suresh.k@servfex.com',
    phone: '+91 94451 88990',
    zone: 'Hyderabad Central & West Zone',
    city: 'Hyderabad',
    managedVendors: 38,
    monthlyJobs: 1420,
    slaRate: 98.2,
    status: 'On-Duty',
    shiftHours: '08:00 AM - 05:00 PM',
    emergencyLead: true,
  },
  {
    id: 'OM-302',
    name: 'Manish Bhatia',
    email: 'manish.b@servfex.com',
    phone: '+91 98200 44551',
    zone: 'Mumbai Western Suburbs & Thane',
    city: 'Mumbai',
    managedVendors: 52,
    monthlyJobs: 2180,
    slaRate: 96.5,
    status: 'In-Field',
    shiftHours: '09:00 AM - 06:00 PM',
    emergencyLead: true,
  },
  {
    id: 'OM-303',
    name: 'Deepak Nair',
    email: 'deepak.n@servfex.com',
    phone: '+91 99801 33442',
    zone: 'Bengaluru South & Electronic City',
    city: 'Bengaluru',
    managedVendors: 44,
    monthlyJobs: 1890,
    slaRate: 97.8,
    status: 'On-Duty',
    shiftHours: '08:30 AM - 05:30 PM',
    emergencyLead: false,
  },
  {
    id: 'OM-304',
    name: 'Pooja Rawat',
    email: 'pooja.rawat@servfex.com',
    phone: '+91 98102 77889',
    zone: 'Delhi NCR (South Delhi & Gurugram)',
    city: 'Delhi NCR',
    managedVendors: 49,
    monthlyJobs: 1960,
    slaRate: 95.9,
    status: 'On-Duty',
    shiftHours: '09:00 AM - 06:00 PM',
    emergencyLead: true,
  },
  {
    id: 'OM-305',
    name: 'Kiran Deshmukh',
    email: 'kiran.d@servfex.com',
    phone: '+91 97654 11223',
    zone: 'Pune Urban & PCMC Metro',
    city: 'Pune',
    managedVendors: 26,
    monthlyJobs: 980,
    slaRate: 98.7,
    status: 'Off-Duty',
    shiftHours: '02:00 PM - 11:00 PM',
    emergencyLead: false,
  },
];

export const OperationManagers: React.FC = () => {
  const [managers, setManagers] = useState<OperationManager[]>(INITIAL_MANAGERS);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedManager, setSelectedManager] = useState<OperationManager | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    zone: '',
    city: 'Hyderabad',
    managedVendors: 20,
    shiftHours: '09:00 AM - 06:00 PM',
    emergencyLead: false,
  });

  const filteredManagers = managers.filter((mgr) => {
    const matchesSearch =
      mgr.name.toLowerCase().includes(search.toLowerCase()) ||
      mgr.zone.toLowerCase().includes(search.toLowerCase()) ||
      mgr.email.toLowerCase().includes(search.toLowerCase()) ||
      mgr.city.toLowerCase().includes(search.toLowerCase());

    const matchesCity = cityFilter === 'ALL' || mgr.city === cityFilter;
    const matchesStatus = statusFilter === 'ALL' || mgr.status === statusFilter;

    return matchesSearch && matchesCity && matchesStatus;
  });

  const handleAddManager = (e: React.FormEvent) => {
    e.preventDefault();
    const newMgr: OperationManager = {
      id: `OM-${Math.floor(300 + Math.random() * 200)}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      zone: formData.zone,
      city: formData.city,
      managedVendors: Number(formData.managedVendors) || 10,
      monthlyJobs: 0,
      slaRate: 99.0,
      status: 'On-Duty',
      shiftHours: formData.shiftHours,
      emergencyLead: formData.emergencyLead,
    };

    setManagers([newMgr, ...managers]);
    setIsAddOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      zone: '',
      city: 'Hyderabad',
      managedVendors: 20,
      shiftHours: '09:00 AM - 06:00 PM',
      emergencyLead: false,
    });
  };

  const handleReassignZone = () => {
    if (!selectedManager || !newZoneName) return;
    setManagers((prev) =>
      prev.map((m) => (m.id === selectedManager.id ? { ...m, zone: newZoneName } : m))
    );
    setSelectedManager((prev) => (prev ? { ...prev, zone: newZoneName } : null));
    setIsReassignOpen(false);
    setNewZoneName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Compass className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Operation Managers</h1>
              <p className="text-xs text-slate-500">
                Territory coverage, partner fleet oversight, SLA fulfillment, and dispatch controllers.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Operation Manager</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Territory Leads</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{managers.length}</div>
          <p className="text-xs text-slate-500 mt-1">Across 5 primary metro cities</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Managed Partner Fleets</span>
            <Building className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {managers.reduce((acc, m) => acc + m.managedVendors, 0)}
          </div>
          <p className="text-xs text-indigo-600 font-semibold mt-1">Contracting vendor partners</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">On-Time SLA Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">97.4%</div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">+1.2% above benchmark</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Dispatched Jobs</span>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {managers.reduce((acc, m) => acc + m.monthlyJobs, 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">Completed under supervision</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search managers by name, territory zone, or city..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-slate-900 outline-none"
          />
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="p-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Metro Cities</option>
          <option value="Hyderabad">Hyderabad</option>
          <option value="Bengaluru">Bengaluru</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Delhi NCR">Delhi NCR</option>
          <option value="Pune">Pune</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Shift Statuses</option>
          <option value="On-Duty">On-Duty</option>
          <option value="In-Field">In-Field</option>
          <option value="Off-Duty">Off-Duty</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Operation Manager</th>
                <th className="py-3.5 px-4">Zone & Territory</th>
                <th className="py-3.5 px-4">Vendors Under Care</th>
                <th className="py-3.5 px-4">Jobs Supervised</th>
                <th className="py-3.5 px-4">SLA Compliance</th>
                <th className="py-3.5 px-4">Shift Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredManagers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No operation managers found matching filters.
                  </td>
                </tr>
              ) : (
                filteredManagers.map((mgr) => (
                  <tr key={mgr.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-xs border border-amber-200">
                          {mgr.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{mgr.name}</span>
                            {mgr.emergencyLead && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200">
                                SOS Lead
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{mgr.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{mgr.zone}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block ml-5">{mgr.city}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900 text-sm">{mgr.managedVendors}</span>
                      <span className="text-xs text-slate-400 ml-1">vendors</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 text-xs">
                      {mgr.monthlyJobs.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              mgr.slaRate >= 97 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${mgr.slaRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs text-slate-800">{mgr.slaRate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          mgr.status === 'On-Duty'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : mgr.status === 'In-Field'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            mgr.status === 'On-Duty'
                              ? 'bg-emerald-500'
                              : mgr.status === 'In-Field'
                              ? 'bg-sky-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {mgr.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedManager(mgr)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition inline-flex items-center gap-1"
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
      </div>

      {/* Inspect Modal */}
      {selectedManager && (
        <Modal
          isOpen={!!selectedManager}
          onClose={() => setSelectedManager(null)}
          title={`Territory Oversight: ${selectedManager.name}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-extrabold text-base">
                  {selectedManager.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">{selectedManager.name}</h3>
                  <p className="text-xs text-amber-700 font-bold">{selectedManager.zone}</p>
                  <span className="text-[11px] text-slate-500">Shift: {selectedManager.shiftHours}</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedManager.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Direct Phone</span>
                <span className="font-bold text-slate-800">{selectedManager.phone}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Email Address</span>
                <span className="font-bold text-slate-800 truncate">{selectedManager.email}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Active Partner Fleets</span>
                <span className="font-extrabold text-slate-900 text-base">{selectedManager.managedVendors} Partners</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Fulfillment SLA</span>
                <span className="font-extrabold text-emerald-700 text-base">{selectedManager.slaRate}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setNewZoneName(selectedManager.zone);
                  setIsReassignOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Reassign Territory Zone
              </button>
              <button
                onClick={() => setSelectedManager(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reassign Zone Modal */}
      {selectedManager && (
        <Modal
          isOpen={isReassignOpen}
          onClose={() => setIsReassignOpen(false)}
          title={`Reassign Zone: ${selectedManager.name}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Transfer this Operation Manager to a different city district or fulfillment sector.
            </p>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                New Territory Zone Name
              </label>
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReassignOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassignZone}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
              >
                Save Territory
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Operation Manager Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Appoint Operation Manager" maxWidth="lg">
        <form onSubmit={handleAddManager} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Anand Ranganathan"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Work Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. anand.r@servfex.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 94000 11223"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Metro City Hub</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              >
                <option value="Hyderabad">Hyderabad</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Pune">Pune</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Territory Zone</label>
              <input
                type="text"
                required
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                placeholder="e.g. Hyderabad Hitech & Madhapur"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Shift Hours</label>
              <input
                type="text"
                value={formData.shiftHours}
                onChange={(e) => setFormData({ ...formData, shiftHours: e.target.value })}
                placeholder="09:00 AM - 06:00 PM"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="emergencyLead"
              checked={formData.emergencyLead}
              onChange={(e) => setFormData({ ...formData, emergencyLead: e.target.checked })}
              className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="emergencyLead" className="text-xs font-medium text-slate-700">
              Designate as 24/7 Emergency SOS Escalation Lead
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
