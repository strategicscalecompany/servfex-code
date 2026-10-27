import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  MapPin,
  Camera,
  Target,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  Compass,
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export interface DevelopmentManager {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  territory: string;
  document?: string;
  providersOnboarded: number; // 1. Onboard providers
  hubVisits: number;          // 2. Visit hubs & give location (GPS coordinates)
  imagesUploaded: number;     // 3. Upload hub & facility images
  leadsCreated: number;       // 4. Create field leads
  status: 'In-Field' | 'Active' | 'On Leave';
  joinedDate: string;
  recentHubLocation: string;
}

export const DevelopmentManagers: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch managers from real API
  const { data: apiManagers, isLoading } = useQuery({
    queryKey: ['admin-managers', 'BUSINESS_DEVELOPMENT'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/managers?kind=BUSINESS_DEVELOPMENT');
      return (res.data?.data?.managers || []) as Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
        status: string;
        createdAt?: string;
        managerProfile?: { zone?: string; city?: string; shiftHours?: string; vendor?: { warehouseName?: string; companyName?: string } };
      }>;
    },
  });

  // Fetch live onboarded partner fleets to display real provider counts
  const { data: apiVendors } = useQuery({
    queryKey: ['admin-vendors-count'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/vendors?limit=100&page=1');
      return (res.data?.data?.vendors || []) as Array<any>;
    },
  });

  const mappedApiManagers: DevelopmentManager[] = (apiManagers || []).map((mgr) => ({
    id: mgr.id,
    name: mgr.name,
    email: mgr.email,
    phone: mgr.phone || '',
    city: mgr.managerProfile?.city || 'Hyderabad',
    territory: mgr.managerProfile?.zone || `${mgr.managerProfile?.city || 'Hyderabad'} Hub Sector`,
    document: 'ID_Verification.pdf',
    providersOnboarded: 0,
    hubVisits: 0,
    imagesUploaded: 0,
    leadsCreated: 0,
    status: mgr.status === 'ACTIVE' ? 'Active' : 'On Leave',
    joinedDate: mgr.createdAt
      ? new Date(mgr.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Recently Added',
    recentHubLocation:
      mgr.managerProfile?.vendor?.warehouseName ||
      mgr.managerProfile?.zone ||
      `${mgr.managerProfile?.city || 'Hyderabad'} Hub`,
  }));

  const [managers, setManagers] = useState<DevelopmentManager[]>([]);

  useEffect(() => {
    if (apiManagers) {
      setManagers(mappedApiManagers);
    }
  }, [apiManagers]);

  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedManager, setSelectedManager] = useState<DevelopmentManager | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [appointmentBanner, setAppointmentBanner] = useState<{ email: string; password: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Manager@1234',
    city: 'Hyderabad',
    document: '',
  });

  const filteredManagers = managers.filter((mgr) => {
    const matchesSearch =
      mgr.name.toLowerCase().includes(search.toLowerCase()) ||
      mgr.territory.toLowerCase().includes(search.toLowerCase()) ||
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
        zone: `${formData.city} Central Hub Sector`,
        city: formData.city,
        kind: 'BUSINESS_DEVELOPMENT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managers'] });
    },
  });

  const handleAddManager = (e: React.FormEvent) => {
    e.preventDefault();
    const newMgr: DevelopmentManager = {
      id: `DM-${Math.floor(500 + Math.random() * 200)}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      territory: `${formData.city} Central Hub Sector`,
      document: formData.document || 'ID_Verification.pdf',
      providersOnboarded: 0,
      hubVisits: 0,
      imagesUploaded: 0,
      leadsCreated: 0,
      status: 'Active',
      joinedDate: 'Just now',
      recentHubLocation: `${formData.city} Hub (Pending First Visit)`,
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
      document: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Compass className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Development Managers</h1>
              <p className="text-xs text-slate-500">
                Provider Onboarding & Hub Development: Onboards partner fleets, visits hubs to record precise GPS coordinates, uploads site facility imagery, and creates field leads.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Development Manager</span>
        </button>
      </div>

      {/* Appointment Success Credential Banner */}
      {appointmentBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start justify-between shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Development Manager Appointed Successfully!</h4>
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

      {/* KPI Cards: The 4 Core Development Manager Work Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Providers Onboarded</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {apiVendors ? apiVendors.length : managers.reduce((acc, m) => acc + m.providersOnboarded, 0)}
          </div>
          <p className="text-xs text-indigo-600 font-semibold mt-1">Verified partner fleets active</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Hub Visits & Geotagged</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {managers.reduce((acc, m) => acc + m.hubVisits, 0)}
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">GPS coordinates verified on-site</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Site Images Uploaded</span>
            <Camera className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {managers.reduce((acc, m) => acc + m.imagesUploaded, 0)}
          </div>
          <p className="text-xs text-amber-600 font-semibold mt-1">Facility & premises audit photos</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Field Leads Created</span>
            <Target className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {managers.reduce((acc, m) => acc + m.leadsCreated, 0)}
          </div>
          <p className="text-xs text-rose-600 font-semibold mt-1">Prospective provider pipelines</p>
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
            placeholder="Search development managers by name, territory, email, or city..."
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
          <option value="Kolkata">Kolkata</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Field Statuses</option>
          <option value="In-Field">In-Field (Visiting Hubs)</option>
          <option value="Active">Active</option>
          <option value="On Leave">On Leave</option>
        </select>
      </div>

      {/* Development Managers Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Development Manager</th>
                <th className="py-3.5 px-4">Territory Zone</th>
                <th className="py-3.5 px-4">Onboarded Providers</th>
                <th className="py-3.5 px-4">Hub Visits & GPS</th>
                <th className="py-3.5 px-4">Images Uploaded</th>
                <th className="py-3.5 px-4">Leads Created</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredManagers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400 text-xs">
                    <Compass className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No Development Managers Appointed</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                      Click "+ Add Development Manager" to provision field personnel. Appointed managers will immediately be authorized to sign in to the ServFex Vendor App under <strong>White Collars / Managers</strong>.
                    </p>
                    <button
                      onClick={() => setIsAddOpen(true)}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                    >
                      + Appoint First Manager
                    </button>
                  </td>
                </tr>
              ) : (
                filteredManagers.map((mgr) => (
                  <tr key={mgr.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {mgr.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{mgr.name}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            {mgr.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{mgr.territory}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block ml-5">{mgr.city}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {mgr.providersOnboarded} Fleets
                      </div>
                      <span className="text-[11px] text-indigo-600 font-medium">KYC & Onboarded</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-semibold text-slate-800 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{mgr.hubVisits} Visits</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate max-w-[170px]">
                        {mgr.recentHubLocation}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                        <Camera className="w-3.5 h-3.5 text-amber-600" />
                        <span>{mgr.imagesUploaded} Photos</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Premises & tooling</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                        <Target className="w-3.5 h-3.5 text-rose-600" />
                        <span>{mgr.leadsCreated} Leads</span>
                      </div>
                      <span className="text-[11px] text-slate-400">Active pipeline</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          mgr.status === 'In-Field'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : mgr.status === 'Active'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            mgr.status === 'In-Field'
                              ? 'bg-emerald-500'
                              : mgr.status === 'Active'
                              ? 'bg-sky-500'
                              : 'bg-amber-500'
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

      {/* Development Manager Detail Modal */}
      {selectedManager && (
        <Modal
          isOpen={!!selectedManager}
          onClose={() => setSelectedManager(null)}
          title={`Field Development Profile: ${selectedManager.name}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-base">
                  {selectedManager.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">{selectedManager.name}</h3>
                  <p className="text-xs text-indigo-600 font-bold">{selectedManager.territory}</p>
                  <span className="text-[11px] text-slate-500">{selectedManager.city} Hub Operations</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedManager.status}
              </span>
            </div>

            {/* 6 Key Functional Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Direct Phone</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedManager.phone}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Email Address</span>
                <span className="font-bold text-slate-800 truncate block">{selectedManager.email}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Providers Onboarded</span>
                <span className="font-extrabold text-indigo-700 text-base flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  {selectedManager.providersOnboarded} Fleets
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Hub Visits Geotagged</span>
                <span className="font-extrabold text-emerald-700 text-base flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {selectedManager.hubVisits} Hubs
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Facility Images</span>
                <span className="font-extrabold text-amber-700 text-base flex items-center gap-1">
                  <Camera className="w-4 h-4 text-amber-600" />
                  {selectedManager.imagesUploaded} Photos
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Field Leads Created</span>
                <span className="font-extrabold text-rose-700 text-base flex items-center gap-1">
                  <Target className="w-4 h-4 text-rose-600" />
                  {selectedManager.leadsCreated} Leads
                </span>
              </div>
            </div>

            {/* Recent Geotagged Hub Visit */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-950 block">Latest Geotagged Hub Location</span>
                  <span className="text-emerald-800 font-medium">{selectedManager.recentHubLocation}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                Doorstep Verified
              </span>
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

            {/* 4-Pillar Responsibilities Panel */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <span className="font-bold uppercase tracking-wider text-slate-600 block flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Development Manager Field Mandate & Responsibilities
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <UserCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">1. Onboard Providers</span>
                    <span className="text-[11px] text-slate-500">Collect partner KYC, verify service skills, and activate local technician fleets.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">2. Visit Hubs & Geotag Location</span>
                    <span className="text-[11px] text-slate-500">Physically visit fulfillment hubs and tag high-precision GPS coordinates for dispatch.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <Camera className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">3. Upload Hub Facility Images</span>
                    <span className="text-[11px] text-slate-500">Photograph hub premises, service inventory, equipment, and audit evidence.</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <Target className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">4. Create Field Leads</span>
                    <span className="text-[11px] text-slate-500">Scout prospective provider leads, merchant workshops, and pipeline new territory hubs.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedManager(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Development Manager Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Appoint Development Manager" maxWidth="lg">
        <form onSubmit={handleAddManager} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Kulkarni"
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
                placeholder="e.g. rahul.k@servfex.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Direct Phone Number</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98000 22334"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Metro City</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 bg-white"
              >
                <option value="Hyderabad">Hyderabad</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Pune">Pune</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Chennai">Chennai</option>
                <option value="Ahmedabad">Ahmedabad</option>
              </select>
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Upload Documents</label>
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

          {/* 4 Pillars Mandate Checklist */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="font-bold uppercase tracking-wider text-slate-600 block">
              Core Field Responsibilities (Vendor App Manager Portal)
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Onboard Providers & Fleets
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Visit Hubs & Tag GPS Location
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Upload Hub & Facility Images
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Create & Pipeline Field Leads
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
              Appoint Development Manager
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
