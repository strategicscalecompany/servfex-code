import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';
import {
  MapPin,
  Search,
  Users,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  X,
  Star,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Compass,
  Building2,
  Radio,
  Boxes,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

interface EmployeeUnderVendor {
  id: string;
  name: string;
  phone: string;
  specialization: string;
  status: 'Available' | 'On Job' | 'Off-Duty';
  todayJobs: number;
  todayRevenue: number;
  rating: number;
}

interface VendorMapProfile {
  id: string;
  companyName: string;
  ownerName: string;
  phone: string;
  email: string;
  location: string;
  lat: number;
  lng: number;
  category: string;
  kycStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  rating: number;
  reviewCount: number;
  commissionRate: number;
  todayRevenue: number;
  todayJobsCount: number;
  lifetimeRevenue: number;
  warehouseHub: string;
  employees: EmployeeUnderVendor[];
}

export const Warehouse: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{ [key: string]: google.maps.Marker }>({});

  const [selectedVendor, setSelectedVendor] = useState<VendorMapProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Load API vendors from backend
  const { data: apiVendors } = useQuery({
    queryKey: ['warehouse-map-vendors'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/vendors?limit=100');
        return res.data.data;
      } catch {
        return null;
      }
    },
  });

  const [vendorsList, setVendorsList] = useState<VendorMapProfile[]>([]);

  useEffect(() => {
    if (apiVendors && Array.isArray(apiVendors)) {
      const mapped: VendorMapProfile[] = apiVendors.map((v: any) => {
        const employees: EmployeeUnderVendor[] = Array.isArray(v.employees)
          ? v.employees.map((e: any) => ({
              id: e.id,
              name: e.user?.name || 'Technician',
              phone: e.user?.phone || e.phone || 'N/A',
              specialization:
                e.specialization ||
                (Array.isArray(e.skills) && e.skills.length > 0 ? e.skills.join(', ') : 'General Technician'),
              status: e.isAvailable ? 'Available' : 'On Job',
              todayJobs: e.completedJobs || 0,
              todayRevenue: 0,
              rating: typeof e.rating === 'number' ? e.rating : 5.0,
            }))
          : [];

        const locationStr =
          v.warehouseLocation ||
          v.location ||
          [v.address, v.city, v.state, v.pincode].filter(Boolean).join(', ') ||
          'Hyderabad, Telangana';

        const categoryStr =
          Array.isArray(v.vendorServices) && v.vendorServices.length > 0
            ? v.vendorServices.map((vs: any) => vs.service?.name).filter(Boolean).join(', ')
            : Array.isArray(v.categories) && v.categories.length > 0
            ? v.categories.map((c: any) => c.category?.name || c.name).filter(Boolean).join(', ')
            : 'General Services';

        return {
          id: v.id,
          companyName: v.companyName || v.warehouseName || 'Registered Partner',
          ownerName: v.user?.name || 'Partner Owner',
          phone: v.warehousePhone || v.user?.phone || 'N/A',
          email: v.user?.email || 'N/A',
          location: locationStr,
          lat: typeof v.latitude === 'number' && !isNaN(v.latitude) ? v.latitude : 17.4435,
          lng: typeof v.longitude === 'number' && !isNaN(v.longitude) ? v.longitude : 78.3772,
          category: categoryStr,
          kycStatus: v.kycStatus || 'PENDING',
          rating: typeof v.rating === 'number' ? v.rating : 5.0,
          reviewCount: v.reviewCount || 0,
          commissionRate: Number(v.commissionRate) || 15,
          todayRevenue: 0,
          todayJobsCount: 0,
          lifetimeRevenue: 0,
          warehouseHub: v.warehouseName || (v.city ? `${v.city} Depot` : 'Central Logistics Hub'),
          employees,
        };
      });
      setVendorsList(mapped);
      if (mapped.length > 0 && !selectedVendor) {
        setSelectedVendor(mapped[0]);
      }
    } else {
      setVendorsList([]);
      setSelectedVendor(null);
    }
  }, [apiVendors]);

  // Filter vendors
  const filteredVendors = vendorsList.filter((v) => {
    const matchesCat = categoryFilter === 'ALL' || v.category.includes(categoryFilter);
    const matchesSearch =
      v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  // Calculate totals
  const totalEmployees = vendorsList.reduce((acc, v) => acc + v.employees.length, 0);
  const totalTodayRevenue = vendorsList.reduce((acc, v) => acc + v.todayRevenue, 0);
  const totalTodayJobs = vendorsList.reduce((acc, v) => acc + v.todayJobsCount, 0);

  // Initialize Native Google Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isCancelled = false;

    loadGoogleMaps().then((googleMaps) => {
      if (isCancelled || !mapContainerRef.current || mapInstanceRef.current) return;

      const map = new googleMaps.Map(mapContainerRef.current, {
        center: { lat: 17.44, lng: 78.42 },
        zoom: 12,
        mapTypeId: 'roadmap',
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
    });

    return () => {
      isCancelled = true;
      Object.values(markersRef.current).forEach((m) => m.setMap(null));
      markersRef.current = {};
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers whenever filteredVendors or selectedVendor changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const map = mapInstanceRef.current;
    const googleMaps = window.google.maps;

    // Remove old markers
    Object.values(markersRef.current).forEach((marker) => marker.setMap(null));
    markersRef.current = {};

    // Add new markers
    filteredVendors.forEach((vendor) => {
      const isSelected = selectedVendor?.id === vendor.id;

      const marker = new googleMaps.Marker({
        position: { lat: vendor.lat, lng: vendor.lng },
        map,
        title: `${vendor.companyName} (₹${(vendor.todayRevenue / 1000).toFixed(1)}k)`,
        icon: {
          path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
          fillColor: isSelected ? '#4f46e5' : '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.4,
        },
        label: {
          text: vendor.companyName.slice(0, 2).toUpperCase(),
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '9px',
        },
        zIndex: isSelected ? 1000 : 100,
      });

      marker.addListener('click', () => {
        setSelectedVendor(vendor);
        map.panTo({ lat: vendor.lat, lng: vendor.lng });
        if (map.getZoom()! < 14) map.setZoom(14);
      });

      markersRef.current[vendor.id] = marker;
    });
  }, [filteredVendors, selectedVendor]);

  // Center map on selected vendor
  const handleSelectVendor = (vendor: VendorMapProfile) => {
    setSelectedVendor(vendor);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: vendor.lat, lng: vendor.lng });
      mapInstanceRef.current.setZoom(15);
    }
  };

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: 17.44, lng: 78.42 });
      mapInstanceRef.current.setZoom(12);
    }
  };

  return (
    <div className="relative -m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-900">
      {/* Interactive Map Canvas (Full Page) */}
      <div className="flex-1 relative w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Empty State Overlay when no vendors are registered */}
        {filteredVendors.length === 0 && (
          <div className="absolute inset-x-4 top-36 max-w-md mx-auto z-[900] pointer-events-auto bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-200 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">No Active Partner Depots Found</h3>
            <p className="text-xs text-slate-500">
              There are currently no partner vendors registered or matching your filter. Once partners are approved and active, their depots and technicians will appear here in real time.
            </p>
          </div>
        )}

        {/* Floating Top Header & Search Bar Overlay */}
        <div className="absolute top-4 left-4 right-4 lg:right-[480px] z-[1000] pointer-events-none flex flex-col gap-2">
          {/* Main Top Bar */}
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200/80 pointer-events-auto flex flex-wrap items-center justify-between gap-3">
            {/* Title & Stats */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
                <Boxes className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 leading-tight">
                  Warehouse & Vendor Live Tracking Map
                </h1>
                <p className="text-[11px] text-slate-500">
                  {filteredVendors.length} Partner Depots • {totalEmployees} Technicians Pinned
                </p>
              </div>
            </div>

            {/* Quick KPI badges */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Today: ₹{totalTodayRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>{totalTodayJobs} Completed Jobs</span>
              </div>
            </div>

            {/* Reset / Center Map Button */}
            <button
              onClick={handleResetCenter}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              title="Reset view to Telangana Center"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>Center Hyderabad</span>
            </button>
          </div>

          {/* Search & Category Filter Chips Bar */}
          <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-md border border-slate-200/80 pointer-events-auto flex items-center gap-2 overflow-x-auto text-xs">
            <div className="relative min-w-[200px] sm:min-w-[260px] flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor name, hub location, or trade..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              {['ALL', 'HVAC', 'Electrical', 'Plumbing', 'Cleaning'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Trades' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-Over Side Panel: Vendor Details & Employee Revenue (450px) */}
      {selectedVendor && (
        <aside className="w-full sm:w-[460px] lg:w-[470px] bg-white border-l border-slate-200 h-full flex flex-col z-[1500] shadow-2xl transition-all duration-300">
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-extrabold text-base shadow-sm border border-white/20">
                {selectedVendor.companyName
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-base text-white leading-tight">
                    {selectedVendor.companyName}
                  </h2>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.2 rounded text-[10px] font-extrabold bg-emerald-500 text-white">
                    {selectedVendor.kycStatus}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{selectedVendor.rating}</span>
                    <span className="text-slate-400 text-[10px]">({selectedVendor.reviewCount})</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedVendor(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-800">
            {/* Vendor Contact & Base */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Primary Contact & Owner
                </span>
                <span className="font-bold text-slate-900">{selectedVendor.ownerName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Phone Hotline</span>
                <a
                  href={`tel:${selectedVendor.phone}`}
                  className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  <span>{selectedVendor.phone}</span>
                </a>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email Address</span>
                <span className="font-medium text-slate-700 truncate max-w-[200px]">
                  {selectedVendor.email}
                </span>
              </div>

              <div className="flex items-start justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 shrink-0">Operating Base</span>
                <span className="font-semibold text-slate-800 text-right ml-4">
                  {selectedVendor.location}
                </span>
              </div>
            </div>

            {/* Today's Revenue Performance Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  Today's Financial Performance
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                  Live Counter
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Today's Gross Earnings</span>
                  <div className="text-2xl font-extrabold text-white">
                    ₹{selectedVendor.todayRevenue.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">Bookings Today</span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {selectedVendor.todayJobsCount} Jobs Done
                  </span>
                </div>
              </div>

              {/* Commission & Net Payout breakdown */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                <div className="bg-white/5 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Platform Comm. ({selectedVendor.commissionRate}%)</span>
                  <span className="font-bold text-amber-300">
                    ₹{((selectedVendor.todayRevenue * selectedVendor.commissionRate) / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white/5 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Net Payout Due</span>
                  <span className="font-bold text-emerald-300">
                    ₹{(selectedVendor.todayRevenue * (1 - selectedVendor.commissionRate / 100)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Employees Under Vendor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Technicians Under This Vendor ({selectedVendor.employees.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Live shift status, today's revenue, and job completion.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                  {selectedVendor.employees.filter((e) => e.status !== 'Off-Duty').length} Online
                </span>
              </div>

              <div className="space-y-2">
                {selectedVendor.employees.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700">No Technicians Registered</p>
                    <p className="text-[11px] text-slate-400">This vendor has not onboarded any field technicians yet.</p>
                  </div>
                ) : (
                  selectedVendor.employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200">
                          {emp.name[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">{emp.name}</span>
                          <span className="text-[10px] text-indigo-600 font-semibold">{emp.specialization}</span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          emp.status === 'Available'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.status === 'On Job'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            emp.status === 'Available'
                              ? 'bg-emerald-500'
                              : emp.status === 'On Job'
                              ? 'bg-sky-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {emp.status}
                      </span>
                    </div>

                    {/* Employee's Individual Today's Revenue & Jobs */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg text-center text-[10px] border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Today's Revenue</span>
                        <span className="font-extrabold text-slate-900 text-xs">
                          ₹{emp.todayRevenue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Jobs Done</span>
                        <span className="font-extrabold text-indigo-600 text-xs">{emp.todayJobs}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Rating</span>
                        <div className="flex items-center justify-center gap-0.5 font-bold text-amber-600 text-xs">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{emp.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{emp.phone}</span>
                      </span>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>

            {/* Warehouse Depot Allocation */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Assigned Warehouse & Spare Parts Depot
              </span>
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Boxes className="w-4 h-4 text-indigo-600" />
                <span>{selectedVendor.warehouseHub}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Authorized for direct replenishment of HVAC gases, copper tubes, and genuine fittings.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
            <a
              href={`tel:${selectedVendor.phone}`}
              className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Vendor</span>
            </a>
            <button
              onClick={() => alert(`Opening warehouse stock dispatch for ${selectedVendor.companyName}`)}
              className="flex-1 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-indigo-200"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Dispatch Stock</span>
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
