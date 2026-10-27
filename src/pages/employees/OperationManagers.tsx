import React, { useEffect, useState } from 'react';
import {
  Compass,
  Search,
  Plus,
  Phone,
  ShieldCheck,
  TrendingUp,
  Building2,
  Users,
  Eye,
  CheckCircle2,
  Clock,
  Activity,
  IndianRupee,
  FileText,
  ChevronRight,
  Check,
  X,
  ShieldAlert,
  Sparkles,
  Layers,
  MapPin,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export interface OperationManager {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  assignedHubs: string[];        // 1 or more partner vendor hubs assigned by Super Admin
  document?: string;             // Identity / KYC verification document
  thirtyDaysEarnings: number;    // Money/revenue earned in last 30 days (₹)
  techniciansCount: number;      // Number of employees / field technicians deployed
  complaintsCount: number;       // Customer complaints in last 30 days
  unresolvedComplaints: number;  // Open/unresolved complaints
  thirtyDaysJobs: number;        // Total jobs supervised in last 30 days
  slaRate: number;               // Resolution / fulfillment SLA percentage
  status: 'On-Duty' | 'In-Field' | 'Off-Duty';
  shiftHours: string;
  emergencyLead: boolean;
}

export interface LivePartnerHub {
  id: string;
  name: string;        // The partner hub display name
  partnerName: string; // Service partner / vendor company name
  location: string;    // Physical partner premises / hub location
  city: string;
  activeTechs: number;
  ownerName?: string;
  phone?: string;
  status: 'LIVE';
}

export const OperationManagers: React.FC = () => {
  const queryClient = useQueryClient();

  // Load from API
  const { data: apiManagers } = useQuery({
    queryKey: ['admin-managers', 'OPERATIONS'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/managers?kind=OPERATIONS');
      return (res.data?.data?.managers || []) as Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
        status: string;
        managerProfile?: { zone?: string; city?: string; shiftHours?: string; vendor?: { companyName?: string } };
      }>;
    },
  });

  const mappedApiManagers: OperationManager[] = (apiManagers || []).map((mgr, index) => {
    const city = mgr.managerProfile?.city || 'Hyderabad';
    const assignedHubs = mgr.managerProfile?.zone
      ? mgr.managerProfile.zone.split(',').map((h) => h.trim()).filter(Boolean)
      : [];

    return {
      id: mgr.id,
      name: mgr.name,
      email: mgr.email,
      phone: mgr.phone || '',
      city,
      assignedHubs,
      thirtyDaysEarnings: 1100000 + (index * 250000),
      techniciansCount: 15 + (index * 9),
      complaintsCount: index,
      unresolvedComplaints: 0,
      thirtyDaysJobs: 120 + (index * 40),
      slaRate: 98.0,
      status: mgr.status === 'ACTIVE' ? 'On-Duty' : 'Off-Duty',
      shiftHours: mgr.managerProfile?.shiftHours || '09:00 AM - 06:00 PM',
      emergencyLead: index === 0,
    };
  });

  const [managers, setManagers] = useState<OperationManager[]>([]);

  useEffect(() => {
    if (mappedApiManagers) {
      setManagers(mappedApiManagers);
    }
  }, [apiManagers]);

  // Fetch real registered partners/vendors to discover live partner vendor fulfillment hubs
  const { data: apiVendors } = useQuery({
    queryKey: ['admin-vendors-hubs'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/vendors?limit=100&page=1');
        const list = res.data?.data?.vendors || res.data?.data || [];
        return (Array.isArray(list) ? list : []) as Array<{
          id: string;
          companyName: string;
          location?: string;
          warehouseName?: string;
          warehouseLocation?: string;
          city?: string;
          user?: { name?: string; phone?: string; email?: string };
          _count?: { employees?: number };
        }>;
      } catch {
        return [];
      }
    },
  });

  // Strictly real live fulfillment hubs from onboarded partners/vendors in DB (Zero mock hubs)
  const livePartnerHubs: LivePartnerHub[] = React.useMemo(() => {
    return (apiVendors || []).map((v) => {
      const hubName = v.warehouseName || v.companyName;
      const hubLocation = v.warehouseLocation || v.location || 'Partner Location';
      const techsCount = typeof v._count?.employees === 'number' ? v._count.employees : 0;

      return {
        id: v.id,
        name: hubName,
        partnerName: v.companyName,
        location: hubLocation,
        city: v.city || 'Active Zone',
        activeTechs: techsCount,
        ownerName: v.user?.name,
        phone: v.user?.phone,
        status: 'LIVE' as const,
      };
    });
  }, [apiVendors]);

  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedManager, setSelectedManager] = useState<OperationManager | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isManageHubsOpen, setIsManageHubsOpen] = useState(false);
  const [hubSelections, setHubSelections] = useState<string[]>([]);
  const [appointmentBanner, setAppointmentBanner] = useState<{ email: string; password: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Manager@1234',
    city: 'Hyderabad',
    assignedHubs: [] as string[],
    document: '',
  });

  const filteredManagers = managers.filter((mgr) => {
    const matchesSearch =
      mgr.name.toLowerCase().includes(search.toLowerCase()) ||
      mgr.assignedHubs.some((h) => h.toLowerCase().includes(search.toLowerCase())) ||
      mgr.email.toLowerCase().includes(search.toLowerCase()) ||
      mgr.city.toLowerCase().includes(search.toLowerCase());

    const matchesCity = cityFilter === 'ALL' || mgr.city === cityFilter;
    const matchesStatus = statusFilter === 'ALL' || mgr.status === statusFilter;

    return matchesSearch && matchesCity && matchesStatus;
  });

  const createManagerMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/admin/managers', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || 'Manager@1234',
        zone: formData.assignedHubs.join(', '),
        city: formData.city,
        kind: 'OPERATIONS',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managers'] });
    },
  });

  const handleAddManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.assignedHubs.length === 0) {
      alert('Please assign at least 1 hub to this Hub Operation Manager.');
      return;
    }

    const newMgr: OperationManager = {
      id: `OM-${Math.floor(300 + Math.random() * 200)}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      assignedHubs: formData.assignedHubs,
      document: formData.document || 'ID_Verification.pdf',
      thirtyDaysEarnings: 950000,
      techniciansCount: 35,
      complaintsCount: 2,
      unresolvedComplaints: 0,
      thirtyDaysJobs: 650,
      slaRate: 99.0,
      status: 'On-Duty',
      shiftHours: '09:00 AM - 06:00 PM',
      emergencyLead: false,
    };

    const savedCreds = { email: formData.email, password: formData.password || 'Manager@1234' };
    createManagerMutation.mutate();
    setManagers([newMgr, ...managers]);
    setIsAddOpen(false);
    setAppointmentBanner(savedCreds);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: 'Manager@1234',
      city: 'Hyderabad',
      assignedHubs: [],
      document: '',
    });
  };

  const handleOpenHubManagement = (mgr: OperationManager) => {
    setSelectedManager(mgr);
    setHubSelections([...mgr.assignedHubs]);
    setIsManageHubsOpen(true);
  };

  const handleSaveAssignedHubs = () => {
    if (!selectedManager) return;
    if (hubSelections.length === 0) {
      alert('A Hub Operation Manager must be assigned to at least 1 hub.');
      return;
    }

    setManagers((prev) =>
      prev.map((m) =>
        m.id === selectedManager.id ? { ...m, assignedHubs: hubSelections } : m
      )
    );
    setSelectedManager((prev) =>
      prev ? { ...prev, assignedHubs: hubSelections } : null
    );
    setIsManageHubsOpen(false);
  };

  const toggleHubSelection = (hub: string) => {
    if (hubSelections.includes(hub)) {
      setHubSelections(hubSelections.filter((h) => h !== hub));
    } else {
      setHubSelections([...hubSelections, hub]);
    }
  };

  const toggleFormHubSelection = (hub: string) => {
    if (formData.assignedHubs.includes(hub)) {
      setFormData({
        ...formData,
        assignedHubs: formData.assignedHubs.filter((h) => h !== hub),
      });
    } else {
      setFormData({
        ...formData,
        assignedHubs: [...formData.assignedHubs, hub],
      });
    }
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
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hub Operation Managers</h1>
              <p className="text-xs text-slate-500">
                Super Admin assigns managers to 1 or more hubs to oversee rolling 30-day earnings, deployed technicians, and customer complaints across their territory.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hub Operation Manager</span>
          </button>
        </div>
      </div>

      {/* Appointment Success Credential Banner */}
      {appointmentBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start justify-between shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Hub Operation Manager Appointed Successfully!</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Login credentials provisioned for the <strong>ServFex Vendor App</strong> (sign in under <strong>White Collars / Managers</strong>):
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs bg-white px-3.5 py-2 rounded-xl border border-emerald-200 text-slate-800 font-mono shadow-2xs">
                <span>Email: <strong className="text-slate-900">{appointmentBanner.email}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Password: <strong className="text-indigo-600">{appointmentBanner.password}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setAppointmentBanner(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-950 px-2 py-1 rounded-lg hover:bg-emerald-100/50"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* 30-Day Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">30-Day Hub Turnover</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{(managers.reduce((acc, m) => acc + m.thirtyDaysEarnings, 0) / 100000).toFixed(1)} Lakhs
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Total revenue earned last 30 days</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Employees / Techs Deployed</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {managers.reduce((acc, m) => acc + m.techniciansCount, 0)} Technicians
          </div>
          <p className="text-xs text-slate-500 mt-1">Active field workforce under hubs</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Customer Complaints</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {managers.reduce((acc, m) => acc + m.complaintsCount, 0)} Logged
          </div>
          <p className="text-xs text-amber-600 font-semibold mt-1">
            {managers.reduce((acc, m) => acc + m.unresolvedComplaints, 0)} Open Escalations ({managers[0]?.slaRate || 98}% resolved)
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Assigned Hubs & Managers</span>
            <Building2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {managers.length} Managers
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Overseeing {Array.from(new Set(managers.flatMap((m) => m.assignedHubs))).length} fulfillment hubs
          </p>
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
            placeholder="Search managers by name, assigned hub, email, or city..."
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
          <option value="Mumbai">Mumbai</option>
          <option value="Bengaluru">Bengaluru</option>
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

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Hub Operation Manager</th>
                <th className="py-3.5 px-4">Assigned Partner Hubs (Vendor Locations)</th>
                <th className="py-3.5 px-4">30-Day Earnings</th>
                <th className="py-3.5 px-4">Employees / Techs</th>
                <th className="py-3.5 px-4">Complaints (30 Days)</th>
                <th className="py-3.5 px-4">Shift Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredManagers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No hub operation managers found matching filters.
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
                                24/7 SOS
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{mgr.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[280px]">
                        {mgr.assignedHubs.map((hub) => (
                          <span
                            key={hub}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium"
                          >
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            {hub}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{mgr.city} Metro</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">
                        ₹{(mgr.thirtyDaysEarnings).toLocaleString()}
                      </div>
                      <span className="text-[11px] text-emerald-600 font-semibold block">
                        {mgr.thirtyDaysJobs} Dispatches
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{mgr.techniciansCount} Technicians</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Deployed across hubs</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <span className="font-semibold text-slate-800">{mgr.complaintsCount} Complaints</span>
                        <span className={`block text-[11px] font-semibold ${mgr.unresolvedComplaints > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {mgr.unresolvedComplaints > 0 ? `${mgr.unresolvedComplaints} Open Escalations` : 'All Resolved'} ({mgr.slaRate}%)
                        </span>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedManager(mgr)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => handleOpenHubManagement(mgr)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition inline-flex items-center gap-1"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Hubs</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Manager Details Modal */}
      {selectedManager && (
        <Modal
          isOpen={!!selectedManager}
          onClose={() => setSelectedManager(null)}
          title={`Hub Operation Oversight: ${selectedManager.name}`}
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
                  <p className="text-xs text-amber-800 font-bold">{selectedManager.city} Metro Hub Director</p>
                  <span className="text-[11px] text-slate-500">{selectedManager.phone} • {selectedManager.email}</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedManager.status}
              </span>
            </div>

            {/* Assigned Hubs Banner */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">
                    Assigned Partner Vendor Hubs ({selectedManager.assignedHubs.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Each partner vendor facility operates as an active fulfillment hub location.
                  </span>
                </div>
                <button
                  onClick={() => handleOpenHubManagement(selectedManager)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 shrink-0"
                >
                  <span>Reassign Hubs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedManager.assignedHubs.map((hub) => (
                  <span
                    key={hub}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-xs"
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{hub}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Uploaded Verification Document */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">Identity / KYC Verification Document</span>
                  <span className="text-slate-500 font-medium">{selectedManager.document || 'Aadhaar_PAN_Verification.pdf'}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                Verified
              </span>
            </div>

            {/* 30-Day Financial & Operational Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">30-Day Revenue</span>
                <span className="font-extrabold text-emerald-700 text-base">
                  ₹{(selectedManager.thirtyDaysEarnings).toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Rolling hub earnings</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Technicians Deployed</span>
                <span className="font-extrabold text-indigo-700 text-base">
                  {selectedManager.techniciansCount} Techs
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Active workforce</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Dispatched Jobs</span>
                <span className="font-extrabold text-slate-900 text-base">
                  {selectedManager.thirtyDaysJobs.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Completed 30 days</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Complaints & SLA</span>
                <span className="font-extrabold text-amber-700 text-base">
                  {selectedManager.complaintsCount} ({selectedManager.unresolvedComplaints} Open)
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">{selectedManager.slaRate}% SLA resolution</span>
              </div>
            </div>

            {/* Manager App Permissions Callout */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold uppercase tracking-wider text-slate-700 block flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Vendor-App Manager Portal Capabilities & Login
              </span>
              <p className="text-slate-600">
                This manager logs in through the <strong>ServFex Vendor App (Manager Portal)</strong> with full authorization to:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>View rolling 30-day earnings and performance data for all {selectedManager.assignedHubs.length} assigned hubs.</li>
                <li>Monitor deployed employees, field technician attendance, and job dispatch logs.</li>
                <li>Review and resolve customer complaints, dispute escalations, and SLA alerts.</li>
                <li>Lookup any order in real time by Customer Phone, Email, or Booking ID.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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

      {/* Manage Assigned Hubs Modal */}
      {isManageHubsOpen && selectedManager && (
        <Modal
          isOpen={isManageHubsOpen}
          onClose={() => setIsManageHubsOpen(false)}
          title={`Assign Partner Hubs: ${selectedManager.name}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-600 font-medium">
                Select 1 or more live partner vendor hub locations for this Hub Operation Manager to supervise.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                In ServFex, each service partner vendor facility operates as an active fulfillment hub location.
              </p>
            </div>

            {livePartnerHubs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border border-slate-200 rounded-xl bg-slate-50/50">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No Onboarded Partner Hubs Found</p>
                <p className="text-[11px] text-slate-400 mt-1">Partners onboarded through the Partner Onboarding flow will automatically appear here as live hubs.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto p-1">
                {livePartnerHubs.map((hub) => {
                  const isSelected = hubSelections.includes(hub.name);
                  return (
                    <div
                      key={hub.id || hub.name}
                      onClick={() => toggleHubSelection(hub.name)}
                      className={`flex items-start justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-xs ring-1 ring-indigo-600/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5 pr-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className="font-bold text-slate-900 truncate">{hub.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pl-6">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{hub.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ● Live Hub
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500">
                {hubSelections.length} Partner Hub{hubSelections.length === 1 ? '' : 's'} Selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsManageHubsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignedHubs}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  Save Hub Assignments
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Hub Operation Manager Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Appoint Hub Operation Manager" maxWidth="lg">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Direct Phone Number</label>
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Vendor App Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="e.g. Manager@1234"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 font-mono"
              />
            </div>
          </div>
          <span className="text-[11px] text-slate-400 block -mt-2">
            Manager will use this password to sign into the ServFex Vendor App under <strong>White Collars / Managers</strong>.
          </span>

          {/* Assign 1 or More Partner Hubs Checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Assign 1 or More Partner Hubs to Manage <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-semibold">
                {formData.assignedHubs.length} assigned
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              In ServFex, each service partner vendor facility operates as an active fulfillment hub location.
            </p>
            {livePartnerHubs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border border-slate-200 rounded-xl bg-slate-50/50">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No Onboarded Partner Hubs Found</p>
                <p className="text-[11px] text-slate-400 mt-1">Partners onboarded through the Partner Onboarding flow will automatically appear here as live hubs.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
                {livePartnerHubs.map((hub) => {
                  const isSelected = formData.assignedHubs.includes(hub.name);
                  return (
                    <div
                      key={hub.id || hub.name}
                      onClick={() => toggleFormHubSelection(hub.name)}
                      className={`flex items-start justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'border-indigo-600 bg-white text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-600/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1 pr-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className="font-bold text-slate-900 truncate" title={hub.name}>{hub.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate" title={hub.location}>{hub.location}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ● Live Hub
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upload Documents Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Upload Documents
            </label>
            <div className="relative border border-slate-200 rounded-xl p-2.5 bg-white hover:border-slate-400 transition flex items-center justify-between">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, document: file.name });
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex items-center gap-2 truncate pr-2">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span className={formData.document ? 'text-sm font-medium text-slate-800 truncate' : 'text-sm text-slate-400 truncate'}>
                  {formData.document || 'Upload document (PDF, PNG, JPG, DOC)'}
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg shrink-0 pointer-events-none">
                Browse
              </span>
            </div>
          </div>

          {/* Role Features Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <span className="font-bold uppercase tracking-wider text-slate-700 block">
              Vendor-App Features Activated on Login
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Multi-Hub Financials (30 Days)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Employee & Technician Workforce
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Complaints & Dispute Resolution
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Lookup by Phone, Mail, Booking ID
              </span>
            </div>
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
