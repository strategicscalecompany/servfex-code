import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';
import {
  MapPin,
  Search,
  Users,
  TrendingUp,
  Phone,
  Mail,
  X,
  Star,
  Compass,
  Building2,
  Boxes,
  Activity,
  Plus,
  Navigation,
  Loader2,
  Check,
  Maximize2,
  ExternalLink,
  Camera,
  Globe,
  Eye,
  EyeOff,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { hostMediaIfNeeded } from '../../api/upload';
import { Modal } from '../../components/common/Modal';

interface EmployeeUnderVendor {
  id: string;
  name: string;
  phone: string;
  specialization: string;
  status: 'Available' | 'On Job' | 'Off-Duty';
  todayJobs: number;
  todayRevenue: number;
  rating: number;
  photoUrl?: string | null;
}

interface VendorMapProfile {
  id: string;
  companyName: string;
  ownerName: string;
  phone: string;
  email: string;
  location: string;
  warehouseLocation: string;
  warehouseHub: string;
  warehouseImageUrl?: string | null;
  partnerPhotoUrl?: string | null;
  lat: number;
  lng: number;
  category: string;
  kycStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  isActive: boolean;
  rating: number;
  reviewCount: number;
  todayRevenue: number;
  todayJobsCount: number;
  lifetimeRevenue: number;
  employees: EmployeeUnderVendor[];
}

/**
 * Compresses an image file on canvas before base64 encoding to prevent oversized payloads.
 */
const compressImage = (file: File, maxDimension = 1200, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const WarehouseMiniMap: React.FC<{ lat: number; lng: number; title: string }> = ({ lat, lng, title }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    loadGoogleMaps()
      .then((googleMaps) => {
        if (isCancelled || !mapContainerRef.current) return;
        setIsLoading(false);

        const position = { lat, lng };

        if (!mapInstanceRef.current) {
          const map = new googleMaps.Map(mapContainerRef.current, {
            center: position,
            zoom: 15,
            mapTypeId: 'roadmap',
            disableDefaultUI: true,
            zoomControl: true,
          });

          const marker = new googleMaps.Marker({
            position,
            map,
            title: title || 'Warehouse Fulfillment Hub',
            animation: googleMaps.Animation.DROP,
          });

          mapInstanceRef.current = map;
          markerRef.current = marker;
        } else {
          mapInstanceRef.current.setCenter(position);
          mapInstanceRef.current.setZoom(15);
          if (markerRef.current) {
            markerRef.current.setPosition(position);
            markerRef.current.setTitle(title || 'Warehouse Fulfillment Hub');
          }
        }
      })
      .catch(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [lat, lng, title]);

  return (
    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500 text-xs font-medium gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Loading Pinpoint Map...</span>
        </div>
      )}
    </div>
  );
};

export const Warehouse: React.FC = () => {
  const queryClient = useQueryClient();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{ [key: string]: google.maps.Marker }>({});
  const infoWindowsRef = useRef<{ [key: string]: google.maps.InfoWindow }>({});
  const hasAutoFittedRef = useRef<boolean>(false);
  const previousVendorsCountRef = useRef<number>(0);

  const [selectedVendor, setSelectedVendor] = useState<VendorMapProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State for adding a new warehouse depot / partner
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [urlResolveError, setUrlResolveError] = useState<string | null>(null);
  const [pinpointedCoords, setPinpointedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [modalForm, setModalForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    warehouseName: '',
    warehouseLocation: '',
    warehousePhone: '',
    warehouseImage: '',
    category: 'HVAC & Appliance',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const warehouseFileInputRef = useRef<HTMLInputElement>(null);

  // Load API vendors from backend with real-time polling (every 10s) and window focus refetch
  const { data: apiVendors, isLoading } = useQuery({
    queryKey: ['warehouse-map-vendors'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/vendors?limit=100');
        return res.data?.data || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
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
                (Array.isArray(e.skills) && e.skills.length > 0 ? e.skills.join(', ') : 'Field Technician'),
              status: e.isAvailable ? 'Available' : 'On Job',
              todayJobs: e.completedJobs || 0,
              todayRevenue: 0,
              rating: typeof e.rating === 'number' ? e.rating : 5.0,
              photoUrl: e.user?.profilePhotoUrl || null,
            }))
          : [];

        const locationStr =
          v.warehouseLocation ||
          v.location ||
          [v.address, v.city, v.state, v.pincode].filter(Boolean).join(', ') ||
          'Hyderabad, Telangana';

        const categoryStr =
          Array.isArray(v.vendorServices) && v.vendorServices.length > 0
            ? v.vendorServices
                .map((vs: any) => vs.service?.category?.name || vs.service?.name)
                .filter(Boolean)
                .join(', ')
            : Array.isArray(v.categories) && v.categories.length > 0
            ? v.categories.map((c: any) => c.category?.name || c.name).filter(Boolean).join(', ')
            : 'HVAC & General Maintenance';

        return {
          id: v.id,
          companyName: v.companyName || v.warehouseName || 'Registered Partner Depot',
          ownerName: v.user?.name || 'Partner Principal',
          phone: v.warehousePhone || v.user?.phone || 'N/A',
          email: v.user?.email || 'N/A',
          location: locationStr,
          warehouseLocation: v.warehouseLocation || locationStr,
          warehouseHub: v.warehouseName || v.companyName || (v.city ? `${v.city} Depot` : 'Central Logistics Hub'),
          warehouseImageUrl: v.warehouseImageUrl || null,
          partnerPhotoUrl: v.user?.profilePhotoUrl || null,
          lat: typeof v.latitude === 'number' && !isNaN(v.latitude) ? v.latitude : 17.4435,
          lng: typeof v.longitude === 'number' && !isNaN(v.longitude) ? v.longitude : 78.3772,
          category: categoryStr,
          kycStatus: v.kycStatus || 'APPROVED',
          isActive: v.isActive ?? true,
          rating: typeof v.rating === 'number' ? v.rating : 5.0,
          reviewCount: v.reviewCount || v._count?.reviews || 0,
          todayRevenue: v.todayRevenue || 0,
          todayJobsCount: v.todayJobsCount || 0,
          lifetimeRevenue: v.lifetimeRevenue || 0,
          employees,
        };
      });

      setVendorsList(mapped);

      // Keep selected vendor profile updated with fresh backend data if already open
      if (selectedVendor) {
        const updatedSelected = mapped.find((item) => item.id === selectedVendor.id);
        if (updatedSelected) {
          setSelectedVendor(updatedSelected);
        }
      }
    } else {
      setVendorsList([]);
      setSelectedVendor(null);
    }
  }, [apiVendors]);

  // Filter vendors by category and search query
  const filteredVendors = vendorsList.filter((v) => {
    const matchesCat =
      categoryFilter === 'ALL' ||
      v.category.toLowerCase().includes(categoryFilter.toLowerCase()) ||
      v.companyName.toLowerCase().includes(categoryFilter.toLowerCase());

    const matchesSearch =
      v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.warehouseHub.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery);

    return matchesCat && matchesSearch;
  });

  // Calculate totals across all active partner fulfillment hubs
  const totalEmployees = vendorsList.reduce((acc, v) => acc + v.employees.length, 0);
  const totalTodayRevenue = vendorsList.reduce((acc, v) => acc + v.todayRevenue, 0);
  const totalTodayJobs = vendorsList.reduce((acc, v) => acc + v.todayJobsCount, 0);

  /**
   * Auto-fit bounds on the Google Map to zoom out and pinpoint ALL warehouses cleanly.
   */
  const fitAllMarkers = useCallback(
    (vendors: VendorMapProfile[] = filteredVendors) => {
      if (!mapInstanceRef.current || !window.google?.maps || vendors.length === 0) return;
      const googleMaps = window.google.maps;
      const bounds = new googleMaps.LatLngBounds();
      let validCount = 0;

      vendors.forEach((v) => {
        if (typeof v.lat === 'number' && typeof v.lng === 'number' && !isNaN(v.lat) && !isNaN(v.lng)) {
          bounds.extend({ lat: v.lat, lng: v.lng });
          validCount++;
        }
      });

      if (validCount === 0) return;

      if (validCount === 1) {
        mapInstanceRef.current.panTo(bounds.getCenter());
        mapInstanceRef.current.setZoom(14);
      } else {
        const isLargeScreen = window.innerWidth >= 1024;
        const rightPadding = selectedVendor && isLargeScreen ? 500 : 70;
        mapInstanceRef.current.fitBounds(bounds, {
          top: 90,
          right: rightPadding,
          bottom: 70,
          left: 70,
        });
      }
    },
    [filteredVendors, selectedVendor]
  );

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
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
      hasAutoFittedRef.current = false;
    });

    return () => {
      isCancelled = true;
      Object.values(markersRef.current).forEach((m) => m.setMap(null));
      markersRef.current = {};
      Object.values(infoWindowsRef.current).forEach((w) => w.close());
      infoWindowsRef.current = {};
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers whenever filteredVendors or selectedVendor changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const map = mapInstanceRef.current;
    const googleMaps = window.google.maps;

    // Remove old markers and info windows
    Object.values(markersRef.current).forEach((marker) => marker.setMap(null));
    markersRef.current = {};
    Object.values(infoWindowsRef.current).forEach((w) => w.close());
    infoWindowsRef.current = {};

    // Add new markers for every warehouse depot
    filteredVendors.forEach((vendor) => {
      const isSelected = selectedVendor?.id === vendor.id;

      const marker = new googleMaps.Marker({
        position: { lat: vendor.lat, lng: vendor.lng },
        map,
        title: `${vendor.warehouseHub} — ${vendor.companyName}`,
        icon: {
          path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
          fillColor: isSelected ? '#4338ca' : '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: isSelected ? 3 : 2,
          scale: isSelected ? 1.6 : 1.35,
        },
        label: {
          text: (vendor.warehouseHub || vendor.companyName).slice(0, 2).toUpperCase(),
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: isSelected ? '10px' : '9px',
        },
        zIndex: isSelected ? 1000 : 100,
        animation: isSelected ? googleMaps.Animation.BOUNCE : undefined,
      });

      if (isSelected) {
        setTimeout(() => marker.setAnimation(null), 1200);
      }

      const infoWindow = new googleMaps.InfoWindow({
        content: `
          <div style="padding: 6px; font-family: system-ui, -apple-system, sans-serif; min-width: 190px;">
            <div style="font-weight: 800; font-size: 13px; color: #0f172a; line-height: 1.2;">${vendor.warehouseHub}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 3px;">${vendor.companyName}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${vendor.location}</div>
            <div style="font-size: 11px; color: #4f46e5; font-weight: 700; margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
              ${vendor.employees.length} Technicians • ₹${vendor.todayRevenue.toLocaleString('en-IN')} Today
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        setSelectedVendor(vendor);
        map.panTo({ lat: vendor.lat, lng: vendor.lng });
        if (map.getZoom()! < 14) map.setZoom(14);
        infoWindow.open({
          anchor: marker,
          map,
          shouldFocus: false,
        });
      });

      markersRef.current[vendor.id] = marker;
      infoWindowsRef.current[vendor.id] = infoWindow;
    });

    // Automatically zoom out and frame ALL warehouses on first load or when vendor count changes
    if (
      filteredVendors.length > 0 &&
      (!hasAutoFittedRef.current || previousVendorsCountRef.current !== filteredVendors.length)
    ) {
      fitAllMarkers(filteredVendors);
      hasAutoFittedRef.current = true;
      previousVendorsCountRef.current = filteredVendors.length;
    }
  }, [filteredVendors, selectedVendor, fitAllMarkers]);

  // Center map on selected vendor
  const handleSelectVendor = (vendor: VendorMapProfile) => {
    setSelectedVendor(vendor);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: vendor.lat, lng: vendor.lng });
      mapInstanceRef.current.setZoom(15);
      const marker = markersRef.current[vendor.id];
      const infoWindow = infoWindowsRef.current[vendor.id];
      if (marker && infoWindow) {
        infoWindow.open({
          anchor: marker,
          map: mapInstanceRef.current,
          shouldFocus: false,
        });
      }
    }
  };

  // Google Maps URL Pinpoint Resolver
  const handleResolveGoogleMapsUrl = async (urlToResolve?: string) => {
    const input = (urlToResolve || googleMapsUrl).trim();
    if (!input) return;

    setIsResolvingUrl(true);
    setUrlResolveError(null);

    try {
      const res = await apiClient.post('/geo/resolve-maps-url', { url: input });
      if (res.data?.success && res.data?.data) {
        const { lat, lng, formattedAddress, placeName } = res.data.data;
        setPinpointedCoords({ lat, lng });
        setModalForm((prev) => ({
          ...prev,
          warehouseLocation: formattedAddress || prev.warehouseLocation,
          warehouseName: prev.warehouseName || placeName || prev.warehouseName,
          latitude: lat,
          longitude: lng,
        }));
        setUrlResolveError(null);
      } else {
        setUrlResolveError(res.data?.error?.message || 'Could not pinpoint coordinates from this link');
      }
    } catch (err: any) {
      setUrlResolveError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to resolve Google Maps link. Please verify the URL.'
      );
    } finally {
      setIsResolvingUrl(false);
    }
  };

  const handleWarehouseImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP)');
      return;
    }
    try {
      const optimized = await compressImage(file, 1200, 0.82);
      const hostedUrl = await hostMediaIfNeeded(optimized, 'servfex/warehouses');
      setModalForm((prev) => ({ ...prev, warehouseImage: hostedUrl || '' }));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to upload warehouse facility photo');
    }
  };

  // Create Partner & Warehouse Depot Mutation
  const createWarehouseMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/admin/vendors', payload);
    },
    onSuccess: (res: any) => {
      // Invalidate both vendor list and map queries for instantaneous real-time sync
      queryClient.invalidateQueries({ queryKey: ['warehouse-map-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });

      setIsAddWarehouseOpen(false);
      setModalForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        warehouseName: '',
        warehouseLocation: '',
        warehousePhone: '',
        warehouseImage: '',
        category: 'HVAC & Appliance',
        latitude: null,
        longitude: null,
      });
      setGoogleMapsUrl('');
      setPinpointedCoords(null);
      setUrlResolveError(null);

      const created = res.data?.data;
      if (created) {
        // Automatically zoom out and select the newly added warehouse
        setTimeout(() => {
          fitAllMarkers();
        }, 500);
      }
    },
  });

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-slate-900">
      {/* Interactive Map Canvas (Full Page) */}
      <div className="w-full h-full relative">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Empty State Overlay when no vendors are registered */}
        {filteredVendors.length === 0 && !isLoading && (
          <div className="absolute inset-x-4 top-36 max-w-md mx-auto z-[900] pointer-events-auto bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">No Active Partner Depots Found</h3>
            <p className="text-xs text-slate-500">
              There are currently no partner fulfillment warehouses registered or matching your filter. Click below to add a partner warehouse location directly.
            </p>
            <button
              onClick={() => setIsAddWarehouseOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Warehouse Depot</span>
            </button>
          </div>
        )}

        {/* Floating Search Bar Overlay (Top Left) */}
        <div className="absolute top-4 left-4 z-[1000] pointer-events-none max-w-md sm:max-w-lg w-full pr-8">
          <div className="bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-200/80 pointer-events-auto flex items-center gap-2 text-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search warehouse depot, partner name, area..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="hidden sm:flex items-center gap-1 overflow-x-auto">
              {['ALL', 'HVAC', 'Electrical', 'Plumbing', 'Cleaning'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Trades' : cat}
                </button>
              ))}
            </div>

            <button
              onClick={() => fitAllMarkers()}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0"
              title="Fit all depots on map"
            >
              <Maximize2 className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-Over Side Panel: Selected Warehouse Details (Slides in on the Right Side) */}
      <aside
        className={`absolute top-0 right-0 h-full w-full sm:w-[460px] lg:w-[480px] bg-white border-l border-slate-200/90 shadow-2xl z-[1500] flex flex-col transition-transform duration-300 ease-in-out ${
          selectedVendor ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {selectedVendor && (
          <>
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-extrabold text-base shadow-sm border border-white/20 shrink-0">
                {(selectedVendor.warehouseHub || selectedVendor.companyName)
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <h2 className="font-extrabold text-base text-white leading-tight">
                  {selectedVendor.warehouseHub}
                </h2>
                <p className="text-xs text-indigo-300 font-semibold mt-0.5">
                  {selectedVendor.companyName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500 text-white">
                    {selectedVendor.kycStatus}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{selectedVendor.rating.toFixed(1)}</span>
                    <span className="text-slate-400 text-[10px]">({selectedVendor.reviewCount})</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedVendor(null);
                fitAllMarkers();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Panel and zoom out"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-800">
            {/* Warehouse Facility Photo if available */}
            {selectedVendor.warehouseImageUrl && (
              <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs group">
                <img
                  src={selectedVendor.warehouseImageUrl}
                  alt={selectedVendor.warehouseHub}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-white text-xs font-bold flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span>Verified Fulfillment Hub Premises</span>
                  </span>
                </div>
              </div>
            )}

            {/* Vendor Contact, Operating Base & Exact GPS Pinpoint */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
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
                <span className="font-medium text-slate-700 truncate max-w-[220px]">
                  {selectedVendor.email}
                </span>
              </div>

              <div className="flex items-start justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 shrink-0">Operating Base</span>
                <span className="font-semibold text-slate-800 text-right ml-4">
                  {selectedVendor.location}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                <span className="text-slate-500">GPS Pinpoint</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedVendor.lat},${selectedVendor.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span>
                    {selectedVendor.lat.toFixed(5)}, {selectedVendor.lng.toFixed(5)}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
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

              {/* Lifetime & Fleet Overview */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                <div className="bg-white/5 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Lifetime Gross Revenue</span>
                  <span className="font-bold text-white">
                    ₹{selectedVendor.lifetimeRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white/5 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Partner Fleet Size</span>
                  <span className="font-bold text-indigo-300">
                    {selectedVendor.employees.length} Field Technicians
                  </span>
                </div>
              </div>
            </div>

            {/* Technicians Under This Vendor */}
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
                    <p className="text-[11px] text-slate-400">
                      This vendor has not onboarded any field technicians yet.
                    </p>
                  </div>
                ) : (
                  selectedVendor.employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          {emp.photoUrl ? (
                            <img
                              src={emp.photoUrl}
                              alt={emp.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-200">
                              {emp.name[0]}
                            </div>
                          )}
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

                      {/* Employee's Individual Jobs & Rating */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg text-center text-[10px] border border-slate-100">
                        <div>
                          <span className="text-slate-400 block">Completed Jobs</span>
                          <span className="font-extrabold text-indigo-600 text-xs">{emp.todayJobs}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Customer Rating</span>
                          <div className="flex items-center justify-center gap-0.5 font-bold text-amber-600 text-xs">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{emp.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <a
                          href={`tel:${emp.phone}`}
                          className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 transition"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{emp.phone}</span>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Warehouse Depot Allocation */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Assigned Warehouse & Spare Parts Depot
              </span>
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <Boxes className="w-4 h-4 text-indigo-600" />
                <span>{selectedVendor.warehouseHub}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Authorized for direct fulfillment of HVAC gases, copper tubes, electrical spares, and genuine fittings.
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
              onClick={() => handleSelectVendor(selectedVendor)}
              className="flex-1 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-indigo-200"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Zoom To Depot</span>
            </button>
          </div>
        </>
      )}
    </aside>

      {/* Onboard / Add Warehouse Depot Modal */}
      <Modal
        isOpen={isAddWarehouseOpen}
        onClose={() => setIsAddWarehouseOpen(false)}
        title="Add & Pin Partner Warehouse Depot"
        maxWidth="2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createWarehouseMutation.mutate({
              name: modalForm.name,
              email: modalForm.email,
              phone: modalForm.phone,
              password: modalForm.password,
              companyName: modalForm.warehouseName,
              warehouseName: modalForm.warehouseName,
              location: modalForm.warehouseLocation,
              warehouseLocation: modalForm.warehouseLocation,
              warehousePhone: modalForm.warehousePhone || modalForm.phone,
              warehouseImage: modalForm.warehouseImage,
              latitude: pinpointedCoords?.lat ?? modalForm.latitude,
              longitude: pinpointedCoords?.lng ?? modalForm.longitude,
            });
          }}
          className="space-y-4"
        >
          {createWarehouseMutation.isError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {(createWarehouseMutation.error as any)?.response?.data?.error?.message ||
                (createWarehouseMutation.error as any)?.response?.data?.message ||
                'Failed to add warehouse depot. Please verify coordinates and details.'}
            </div>
          )}

          <div className="space-y-4">
            {/* 1. Google Maps Location URL Pinpointer */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pinpoint Warehouse on Google Maps</span>
                </label>
                {pinpointedCoords && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Pinpoint Linked ({pinpointedCoords.lat.toFixed(4)},{' '}
                    {pinpointedCoords.lng.toFixed(4)})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Paste Google Maps link (e.g. https://maps.app.goo.gl/... or coordinates)"
                    value={googleMapsUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = val.match(/https?:\/\/[^\s"'<>]+/i);
                      setGoogleMapsUrl(match ? match[0] : val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleResolveGoogleMapsUrl();
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <button
                  type="button"
                  disabled={isResolvingUrl || !googleMapsUrl.trim()}
                  onClick={() => handleResolveGoogleMapsUrl()}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0"
                >
                  {isResolvingUrl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Pinpointing...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Pinpoint</span>
                    </>
                  )}
                </button>
              </div>

              {urlResolveError && <p className="text-xs text-rose-600 font-medium">{urlResolveError}</p>}

              {pinpointedCoords && (
                <WarehouseMiniMap
                  lat={pinpointedCoords.lat}
                  lng={pinpointedCoords.lng}
                  title={modalForm.warehouseName || 'Warehouse Depot'}
                />
              )}
            </div>

            {/* 2. Warehouse Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Warehouse Depot Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gayathri Hills Boduppal Depot"
                  value={modalForm.warehouseName}
                  onChange={(e) => setModalForm({ ...modalForm, warehouseName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Warehouse Hotline Phone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 90147 98713"
                  value={modalForm.warehousePhone}
                  onChange={(e) => setModalForm({ ...modalForm, warehousePhone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Warehouse Location / Physical Premises Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. H.No: 8-46/G/129/A, Road No.02, Gayathri Hills, Boduppal, Hyderabad"
                value={modalForm.warehouseLocation}
                onChange={(e) => setModalForm({ ...modalForm, warehouseLocation: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-white"
              />
            </div>

            {/* Warehouse Facility Photo */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Warehouse Facility Photo (Premises)
              </label>
              <div className="flex items-center gap-3">
                {modalForm.warehouseImage ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                    <img src={modalForm.warehouseImage} alt="Premises" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setModalForm({ ...modalForm, warehouseImage: '' })}
                      className="absolute top-1 right-1 p-0.5 rounded-md bg-black/60 text-white hover:bg-black"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => warehouseFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl border border-dashed border-slate-300 text-xs text-slate-600 font-semibold hover:border-indigo-400 hover:bg-indigo-50/20 transition flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Upload Facility Photo</span>
                  </button>
                )}
                <input
                  ref={warehouseFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleWarehouseImageChange}
                />
              </div>
            </div>

            {/* 3. Partner / Operating Base Credentials */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Partner Principal & Login Credentials
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Partner / Manager Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={modalForm.name}
                    onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="partner@example.com"
                    value={modalForm.email}
                    onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={modalForm.phone}
                    onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      value={modalForm.password}
                      onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                      className="w-full p-2.5 pr-8 rounded-xl border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddWarehouseOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createWarehouseMutation.isPending}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {createWarehouseMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Onboarding Depot...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add & Pin Warehouse</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
