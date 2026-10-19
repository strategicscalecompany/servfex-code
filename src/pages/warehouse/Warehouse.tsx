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

// Default demonstration vendors across key Telangana / Hyderabad hubs
const DEMO_VENDORS: VendorMapProfile[] = [
  {
    id: 'V-101',
    companyName: 'Apex Cooling & HVAC Systems',
    ownerName: 'Rajesh Sharma',
    phone: '+91 98450 11221',
    email: 'rajesh.apex@servfex.com',
    location: 'Hitech City, Madhapur, Hyderabad',
    lat: 17.4435,
    lng: 78.3772,
    category: 'HVAC & Air Conditioning',
    kycStatus: 'APPROVED',
    rating: 4.9,
    reviewCount: 142,
    commissionRate: 15,
    todayRevenue: 16800,
    todayJobsCount: 8,
    lifetimeRevenue: 420000,
    warehouseHub: 'Central Logistics Hub (Gachibowli)',
    employees: [
      {
        id: 'E-1',
        name: 'Suresh Kumar',
        phone: '+91 98765 01011',
        specialization: 'Split AC Specialist',
        status: 'On Job',
        todayJobs: 3,
        todayRevenue: 6400,
        rating: 4.9,
      },
      {
        id: 'E-2',
        name: 'Imran Ali',
        phone: '+91 98765 01012',
        specialization: 'Jet-Pump Deep Cleaning',
        status: 'Available',
        todayJobs: 3,
        todayRevenue: 5900,
        rating: 4.8,
      },
      {
        id: 'E-3',
        name: 'Praveen Goud',
        phone: '+91 98765 01013',
        specialization: 'PCB Repair & Gas Charging',
        status: 'Available',
        todayJobs: 2,
        todayRevenue: 4500,
        rating: 5.0,
      },
    ],
  },
  {
    id: 'V-102',
    companyName: 'Telangana Power & Electricals',
    ownerName: 'Venkatesh Rao',
    phone: '+91 98490 22334',
    email: 'venkat.power@servfex.com',
    location: 'Kukatpally Housing Board (KPHB), Hyderabad',
    lat: 17.4938,
    lng: 78.3995,
    category: 'Electrical & Power Systems',
    kycStatus: 'APPROVED',
    rating: 4.8,
    reviewCount: 98,
    commissionRate: 15,
    todayRevenue: 12450,
    todayJobsCount: 6,
    lifetimeRevenue: 310000,
    warehouseHub: 'Central Logistics Hub (Gachibowli)',
    employees: [
      {
        id: 'E-4',
        name: 'Karthik Reddy',
        phone: '+91 98765 02021',
        specialization: 'High-Voltage Wiring & MCB',
        status: 'On Job',
        todayJobs: 3,
        todayRevenue: 6200,
        rating: 4.9,
      },
      {
        id: 'E-5',
        name: 'Deepak Naik',
        phone: '+91 98765 02022',
        specialization: 'Inverter & Generator Setup',
        status: 'Available',
        todayJobs: 3,
        todayRevenue: 6250,
        rating: 4.7,
      },
    ],
  },
  {
    id: 'V-103',
    companyName: 'AquaFlow Plumbing & Sanitation',
    ownerName: 'Syed Moizuddin',
    phone: '+91 98220 33445',
    email: 'aquaflow@servfex.com',
    location: 'Banjara Hills, Road No. 12, Hyderabad',
    lat: 17.4156,
    lng: 78.435,
    category: 'Plumbing & Drainage',
    kycStatus: 'APPROVED',
    rating: 4.9,
    reviewCount: 176,
    commissionRate: 15,
    todayRevenue: 14200,
    todayJobsCount: 7,
    lifetimeRevenue: 385000,
    warehouseHub: 'Central Logistics Hub (Gachibowli)',
    employees: [
      {
        id: 'E-6',
        name: 'Vijay Verma',
        phone: '+91 98765 03031',
        specialization: 'Clogged Drain & Pipe Jetting',
        status: 'Available',
        todayJobs: 3,
        todayRevenue: 5800,
        rating: 4.9,
      },
      {
        id: 'E-7',
        name: 'Santosh Kumar',
        phone: '+91 98765 03032',
        specialization: 'Bathroom Sanitary Fitting',
        status: 'On Job',
        todayJobs: 2,
        todayRevenue: 4400,
        rating: 4.8,
      },
      {
        id: 'E-8',
        name: 'Mohammed Rizwan',
        phone: '+91 98765 03033',
        specialization: 'Water Tank & Booster Pumps',
        status: 'Off-Duty',
        todayJobs: 2,
        todayRevenue: 4000,
        rating: 5.0,
      },
    ],
  },
  {
    id: 'V-104',
    companyName: 'Deccan Home Cleaners & Hygiene',
    ownerName: 'Manohar Reddy',
    phone: '+91 97001 44556',
    email: 'deccan.clean@servfex.com',
    location: 'Gachibowli Financial District, Hyderabad',
    lat: 17.4399,
    lng: 78.3489,
    category: 'Home Deep Cleaning',
    kycStatus: 'APPROVED',
    rating: 4.7,
    reviewCount: 84,
    commissionRate: 15,
    todayRevenue: 18500,
    todayJobsCount: 5,
    lifetimeRevenue: 290000,
    warehouseHub: 'Central Logistics Hub (Gachibowli)',
    employees: [
      {
        id: 'E-9',
        name: 'Ravi Teja',
        phone: '+91 98765 04041',
        specialization: 'Kitchen Deep Steam Cleaning',
        status: 'On Job',
        todayJobs: 2,
        todayRevenue: 8500,
        rating: 4.8,
      },
      {
        id: 'E-10',
        name: 'Gopal Krishna',
        phone: '+91 98765 04042',
        specialization: 'Sofa & Carpet Shampooing',
        status: 'Available',
        todayJobs: 3,
        todayRevenue: 10000,
        rating: 4.7,
      },
    ],
  },
  {
    id: 'V-105',
    companyName: 'Secunderabad Appliance Care',
    ownerName: 'Naresh Goud',
    phone: '+91 98112 55667',
    email: 'naresh.appliances@servfex.com',
    location: 'Paradise, Secunderabad, Telangana',
    lat: 17.4395,
    lng: 78.4983,
    category: 'Appliances & Refrigeration',
    kycStatus: 'APPROVED',
    rating: 4.8,
    reviewCount: 112,
    commissionRate: 15,
    todayRevenue: 9800,
    todayJobsCount: 5,
    lifetimeRevenue: 265000,
    warehouseHub: 'Central Logistics Hub (Gachibowli)',
    employees: [
      {
        id: 'E-11',
        name: 'Mahesh Babu',
        phone: '+91 98765 05051',
        specialization: 'Washing Machine Specialist',
        status: 'Available',
        todayJobs: 3,
        todayRevenue: 5800,
        rating: 4.8,
      },
      {
        id: 'E-12',
        name: 'Arjun Das',
        phone: '+91 98765 05052',
        specialization: 'Refrigerator Inverter Tech',
        status: 'Available',
        todayJobs: 2,
        todayRevenue: 4000,
        rating: 4.7,
      },
    ],
  },
  {
    id: 'V-106',
    companyName: 'PureAqua RO Solutions',
    ownerName: 'Vikas Agarwal',
    phone: '+91 99881 66778',
    email: 'pureaqua@servfex.com',
    location: 'Begumpet, Hyderabad',
    lat: 17.4448,
    lng: 78.4682,
    category: 'Water Purification',
    kycStatus: 'APPROVED',
    rating: 4.9,
    reviewCount: 65,
    commissionRate: 15,
    todayRevenue: 8200,
    todayJobsCount: 4,
    lifetimeRevenue: 180000,
    warehouseHub: 'Central Logistics Hub (Gachibowli)',
    employees: [
      {
        id: 'E-13',
        name: 'Sanjay Patro',
        phone: '+91 98765 06061',
        specialization: 'RO Membrane & TDS Tuning',
        status: 'On Job',
        todayJobs: 2,
        todayRevenue: 4200,
        rating: 4.9,
      },
      {
        id: 'E-14',
        name: 'Bikram Sen',
        phone: '+91 98765 06062',
        specialization: 'UV/UF Filter Replacements',
        status: 'Available',
        todayJobs: 2,
        todayRevenue: 4000,
        rating: 4.9,
      },
    ],
  },
];

export const Warehouse: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{ [key: string]: google.maps.Marker }>({});

  const [selectedVendor, setSelectedVendor] = useState<VendorMapProfile | null>(DEMO_VENDORS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Load API vendors to merge if available
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

  // Merge API vendors with mock locations if needed
  const [vendorsList, setVendorsList] = useState<VendorMapProfile[]>(DEMO_VENDORS);

  useEffect(() => {
    if (apiVendors && Array.isArray(apiVendors) && apiVendors.length > 0) {
      // Map API vendors to map format, using coords if present or assigning coordinates in Hyderabad
      const mapped: VendorMapProfile[] = apiVendors.map((v: any, idx: number) => {
        const fallback = DEMO_VENDORS[idx % DEMO_VENDORS.length];
        return {
          id: v.id,
          companyName: v.companyName,
          ownerName: v.user?.name || fallback.ownerName,
          phone: v.user?.phone || fallback.phone,
          email: v.user?.email || fallback.email,
          location: v.location || fallback.location,
          lat: v.latitude || fallback.lat + (idx * 0.008),
          lng: v.longitude || fallback.lng + (idx * 0.008),
          category: fallback.category,
          kycStatus: v.kycStatus || 'APPROVED',
          rating: v.rating || fallback.rating,
          reviewCount: v.reviewCount || fallback.reviewCount,
          commissionRate: Number(v.commissionRate) || 15,
          todayRevenue: fallback.todayRevenue + (idx * 1200),
          todayJobsCount: fallback.todayJobsCount + (idx % 3),
          lifetimeRevenue: fallback.lifetimeRevenue,
          warehouseHub: fallback.warehouseHub,
          employees: fallback.employees,
        };
      });
      setVendorsList(mapped);
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
                {selectedVendor.employees.map((emp) => (
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
                ))}
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
