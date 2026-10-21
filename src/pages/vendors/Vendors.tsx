import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';
import { apiClient } from '../../api/client';
import { VendorProfile } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  Briefcase,
  Search,
  CheckCircle,
  XCircle,
  Ban,
  Eye,
  EyeOff,
  Plus,
  Loader2,
  MapPin,
  FileText,
  Star,
  Users,
  Sparkles,
  ArrowRight,
  Camera,
  Warehouse,
  Upload,
  Trash2,
  Paperclip,
  Phone,
  Mail,
  Lock,
  Check,
  ImageIcon,
  FileUp,
  X,
  Navigation,
  ExternalLink,
  Globe,
} from 'lucide-react';

interface UploadedDocItem {
  id: string;
  type: 'GOVERNMENT_ID' | 'TRADE_LICENSE' | 'TAX_DOCUMENT' | 'CERTIFICATE' | 'OTHER';
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  fileSizeBytes?: number;
}

const MAX_ONBOARDING_DOCS = 30;
const MAX_ONBOARDING_TOTAL_BYTES = 500 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 15 * 60 * 1000;

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

const uploadMediaToCloud = async (dataUrl: string, folder: string): Promise<string> => {
  const res = await apiClient.post(
    '/admin/upload',
    { image: dataUrl, folder },
    { timeout: UPLOAD_TIMEOUT_MS }
  );
  const url = res.data?.data?.url as string | undefined;
  if (!url) {
    throw new Error('Upload did not return a hosted file URL');
  }
  return url;
};

const WarehouseMiniMap: React.FC<{ lat: number; lng: number; title: string }> = ({ lat, lng, title }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
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
            zoom: 16,
            mapTypeId: 'roadmap',
            disableDefaultUI: true,
            zoomControl: true,
            fullscreenControl: true,
            streetViewControl: false,
          });

          const marker = new googleMaps.Marker({
            position,
            map,
            title: title || 'Warehouse Depot',
            animation: googleMaps.Animation.DROP,
          });

          const infoWindow = new googleMaps.InfoWindow({
            content: `
              <div style="padding: 4px; font-family: inherit;">
                <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${title || 'Warehouse Depot'}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
              </div>
            `,
          });

          infoWindow.open({
            anchor: marker,
            map,
            shouldFocus: false,
          });

          marker.addListener('click', () => {
            infoWindow.open({
              anchor: marker,
              map,
              shouldFocus: false,
            });
          });

          mapInstanceRef.current = map;
          markerRef.current = marker;
          infoWindowRef.current = infoWindow;
        } else {
          mapInstanceRef.current.setCenter(position);
          mapInstanceRef.current.setZoom(16);
          if (markerRef.current) {
            markerRef.current.setPosition(position);
            markerRef.current.setTitle(title || 'Warehouse Depot');
          }
          if (infoWindowRef.current && markerRef.current) {
            infoWindowRef.current.setContent(`
              <div style="padding: 4px; font-family: inherit;">
                <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${title || 'Warehouse Depot'}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
              </div>
            `);
            infoWindowRef.current.open({
              anchor: markerRef.current,
              map: mapInstanceRef.current,
              shouldFocus: false,
            });
          }
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Google Maps load error:', err);
          setLoadError(err.message || 'Failed to load Google Maps');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [lat, lng, title]);

  return (
    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500 text-xs font-medium gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Loading Google Maps...</span>
        </div>
      )}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
          <p className="text-xs text-rose-600 font-semibold mb-2">{loadError}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-600 hover:underline font-bold inline-flex items-center gap-1"
          >
            Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-md bg-white/95 hover:bg-white text-[10px] font-bold text-slate-700 shadow-md border border-slate-200 flex items-center gap-1 transition"
        title="View on Google Maps"
      >
        <ExternalLink className="w-3 h-3 text-indigo-600" />
        <span>Open in Google Maps</span>
      </a>
    </div>
  );
};

/**
 * Compresses an image file on canvas before base64 encoding to prevent 413 Payload Too Large / CORS drops.
 */
const compressImage = (file: File, maxDimension = 1200, quality = 0.8): Promise<string> => {
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

export const Vendors: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const urlKyc = searchParams.get('kycStatus');
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState(urlKyc || '');

  useEffect(() => {
    if (urlKyc !== null) {
      setKycFilter(urlKyc);
    }
  }, [urlKyc]);
  const [page, setPage] = useState(1);

  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<VendorProfile | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    phone: '',
    email: '',
    password: '',
    location: '',
    warehouseName: '',
    warehouseLocation: '',
    warehousePhone: '',
    warehouseImage: '',
    partnerImage: '',
    latitude: null as number | null,
    longitude: null as number | null,
    businessLicense: '',
    taxId: '',
    commissionRate: 15,
  });

  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);
  const [urlResolveError, setUrlResolveError] = useState<string | null>(null);
  const [pinpointedCoords, setPinpointedCoords] = useState<{ lat: number; lng: number } | null>(null);

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
        setFormData((prev) => ({
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

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocItem[]>([]);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [docsUploading, setDocsUploading] = useState(false);

  const partnerFileInputRef = useRef<HTMLInputElement>(null);
  const warehouseFileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const handlePartnerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP)');
      return;
    }
    try {
      const optimized = await compressImage(file, 800, 0.82);
      const hostedUrl = await uploadMediaToCloud(optimized, 'servfex/avatars');
      setFormData((prev) => ({ ...prev, partnerImage: hostedUrl }));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to upload partner photo');
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
      const hostedUrl = await uploadMediaToCloud(optimized, 'servfex/warehouses');
      setFormData((prev) => ({ ...prev, warehouseImage: hostedUrl }));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to upload warehouse photo');
    }
  };

  const handleAddDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (docFileInputRef.current) docFileInputRef.current.value = '';
    if (files.length === 0) return;

    if (uploadedDocs.length + files.length > MAX_ONBOARDING_DOCS) {
      setDocUploadError(`You can attach up to ${MAX_ONBOARDING_DOCS} verification documents`);
      return;
    }

    const usedBytes = uploadedDocs.reduce((sum, doc) => sum + (doc.fileSizeBytes || 0), 0);
    const incomingBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (usedBytes + incomingBytes > MAX_ONBOARDING_TOTAL_BYTES) {
      const remaining = Math.max(0, MAX_ONBOARDING_TOTAL_BYTES - usedBytes);
      setDocUploadError(
        `Documents cannot exceed 500MB in total. ${formatBytes(remaining)} remaining.`
      );
      return;
    }

    setDocUploadError(null);
    setDocsUploading(true);

    try {
      let runningTotal = usedBytes;
      for (const file of files) {
        if (runningTotal + file.size > MAX_ONBOARDING_TOTAL_BYTES) {
          setDocUploadError(`"${file.name}" was skipped because it would exceed the 500MB total limit`);
          continue;
        }

        let fileDataUrl: string;
        if (file.type.startsWith('image/')) {
          fileDataUrl = await compressImage(file, 1400, 0.85);
        } else {
          fileDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        const hostedUrl = await uploadMediaToCloud(fileDataUrl, 'servfex/documents');
        const defaultTitle = file.name.replace(/\.[^/.]+$/, '');

        setUploadedDocs((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'OTHER',
            title: defaultTitle,
            fileUrl: hostedUrl,
            fileName: file.name,
            fileSize: formatBytes(file.size),
            fileSizeBytes: file.size,
          },
        ]);
        runningTotal += file.size;
      }
    } catch (err: any) {
      setDocUploadError(
        err.response?.data?.error?.message || err.message || 'Failed to process document file'
      );
    } finally {
      setDocsUploading(false);
    }
  };

  const handleUpdateDocTitle = (id: string, newTitle: string) => {
    setUploadedDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title: newTitle } : d))
    );
  };

  const handleRemoveDoc = (id: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', search, kycFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(kycFilter ? { kycStatus: kycFilter } : {}),
        ...(search ? { search } : {}),
      });
      const res = await apiClient.get(`/admin/vendors?${params.toString()}`);
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiClient.patch(`/admin/vendors/${id}/approve`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsApproveOpen(false);
      setIsDetailOpen(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiClient.patch(`/admin/vendors/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsRejectOpen(false);
      setIsDetailOpen(false);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiClient.patch(`/admin/vendors/${id}/suspend`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsSuspendOpen(false);
      setIsDetailOpen(false);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiClient.patch(`/admin/vendors/${id}/reactivate`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsDetailOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/admin/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsDeleteOpen(false);
      setVendorToDelete(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/admin/vendors', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsCreateOpen(false);
      setFormData({
        companyName: '',
        name: '',
        phone: '',
        email: '',
        password: '',
        location: '',
        warehouseName: '',
        warehouseLocation: '',
        warehousePhone: '',
        warehouseImage: '',
        partnerImage: '',
        latitude: null,
        longitude: null,
        businessLicense: '',
        taxId: '',
        commissionRate: 15,
      });
      setGoogleMapsUrl('');
      setPinpointedCoords(null);
      setUrlResolveError(null);
      setUploadedDocs([]);
      setDocUploadError(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Partner Onboarding</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review partner KYC compliance, verify documentation, and approve onboarding requests.
          </p>
        </div>

        <button
          onClick={() => {
            createMutation.reset();
            setShowPassword(false);
            setIsCreateOpen(true);
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard Partner</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="vendor-search-input"
            name="vendorSearch"
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search company name, location, contact email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none"
          />
        </div>

        <select
          id="vendor-kyc-filter-select"
          name="kycFilter"
          value={kycFilter}
          onChange={(e) => {
            setKycFilter(e.target.value);
            setPage(1);
          }}
          className="p-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none"
        >
          <option value="">All KYC Statuses</option>
          <option value="PENDING">Pending Approval</option>
          <option value="APPROVED">Approved Vendors</option>
          <option value="REJECTED">Rejected KYC</option>
        </select>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Company Name</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Staff Count</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading partner profiles...
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400">
                    <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No partners registered yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click the &quot;Onboard Partner&quot; button above to register your first service partner.
                    </p>
                  </td>
                </tr>
              ) : (
                data?.data?.map((v: VendorProfile) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                          {v.user?.profilePhotoUrl ? (
                            <img src={v.user.profilePhotoUrl} alt={v.companyName} className="w-full h-full object-cover" />
                          ) : (
                            <Briefcase className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/partner-onboarding/${v.id}`}
                            className="font-bold text-slate-900 block hover:text-indigo-600 transition"
                          >
                            {v.companyName}
                          </Link>
                          <span className="text-xs text-slate-400">{v.user?.name} ({v.user?.phone})</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {v.location}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {v._count?.employees || 0} technicians
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/partner-onboarding/${v.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-all shadow-xs group"
                          title="View vendor details"
                        >
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setVendorToDelete(v);
                            setIsDeleteOpen(true);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white transition-all shadow-xs"
                          title="Delete partner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data?.pagination && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} vendors)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Vendor Modal */}
      {selectedVendor && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Vendor: ${selectedVendor.companyName}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{selectedVendor.companyName}</h3>
                <p className="text-xs text-slate-500">{selectedVendor.location}</p>
              </div>
              <StatusBadge status={selectedVendor.kycStatus} size="md" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold uppercase block">Owner Contact</span>
                <p className="font-bold text-slate-800">{selectedVendor.user?.name}</p>
                <p className="text-slate-500">{selectedVendor.user?.phone}</p>
                <p className="text-slate-500">{selectedVendor.user?.email}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-bold uppercase block">Platform Terms</span>
                <p className="text-slate-700">Commission Rate: <span className="font-semibold text-indigo-600">{Number(selectedVendor.commissionRate)}%</span></p>
                <p className="text-slate-700">Status: <span className="font-semibold text-slate-900">{selectedVendor.isActive ? 'Active' : 'Suspended'}</span></p>
              </div>
            </div>

            {(selectedVendor.warehouseName || selectedVendor.warehouseLocation || selectedVendor.warehousePhone || selectedVendor.warehouseImageUrl) && (
              <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 text-xs space-y-2">
                <span className="text-indigo-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5" />
                  Warehouse Depot & Logistics Hub
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Depot Name</span>
                    <span className="font-semibold text-slate-900">{selectedVendor.warehouseName || 'Main Hub Depot'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Warehouse Phone</span>
                    <span className="font-medium text-slate-900">{selectedVendor.warehousePhone || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Warehouse Location</span>
                    <span className="font-medium text-slate-800">{selectedVendor.warehouseLocation || selectedVendor.location}</span>
                  </div>
                </div>
                {selectedVendor.warehouseImageUrl && (
                  <div className="pt-1">
                    <img
                      src={selectedVendor.warehouseImageUrl}
                      alt="Warehouse Facility"
                      className="w-full h-28 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}
              </div>
            )}

            {selectedVendor.bio && (
              <div className="p-3.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-bold uppercase block mb-1">Company Description</span>
                <p className="text-slate-600">{selectedVendor.bio}</p>
              </div>
            )}

            {/* KYC Approval / Rejection Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-100">
              {selectedVendor.kycStatus === 'PENDING' && (
                <>
                  <button
                    onClick={() => setIsRejectOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject KYC</span>
                  </button>
                  <button
                    onClick={() => setIsApproveOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve Vendor</span>
                  </button>
                </>
              )}

              {selectedVendor.kycStatus === 'APPROVED' && (
                selectedVendor.isActive ? (
                  <button
                    onClick={() => setIsSuspendOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1.5"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Suspend Vendor</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      reactivateMutation.mutate({
                        id: selectedVendor.id,
                        reason: 'Reactivated by Super Admin',
                      });
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Reactivate Vendor</span>
                  </button>
                )
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* KYC Approve Modal */}
      {selectedVendor && (
        <ConfirmModal
          isOpen={isApproveOpen}
          onClose={() => setIsApproveOpen(false)}
          title={`Approve KYC: ${selectedVendor.companyName}`}
          message="Approve this vendor's registration and enable their services on the ServFex marketplace platform."
          confirmLabel="Approve & Activate"
          isDestructive={false}
          isLoading={approveMutation.isPending}
          onConfirm={(reason) => {
            approveMutation.mutate({ id: selectedVendor.id, reason });
          }}
        />
      )}

      {/* KYC Reject Modal */}
      {selectedVendor && (
        <ConfirmModal
          isOpen={isRejectOpen}
          onClose={() => setIsRejectOpen(false)}
          title={`Reject KYC: ${selectedVendor.companyName}`}
          message="Provide a clear rejection reason explaining why the application or compliance documents failed verification."
          confirmLabel="Reject Application"
          isDestructive={true}
          isLoading={rejectMutation.isPending}
          onConfirm={(reason) => {
            rejectMutation.mutate({ id: selectedVendor.id, reason });
          }}
        />
      )}

      {/* Suspend Vendor Modal */}
      {selectedVendor && (
        <ConfirmModal
          isOpen={isSuspendOpen}
          onClose={() => setIsSuspendOpen(false)}
          title={`Suspend Vendor: ${selectedVendor.companyName}`}
          message="This will immediately deactivate the vendor, revoke staff logins, and stop new booking dispatches."
          confirmLabel="Suspend Vendor"
          isDestructive={true}
          isLoading={suspendMutation.isPending}
          onConfirm={(reason) => {
            suspendMutation.mutate({ id: selectedVendor.id, reason });
          }}
        />
      )}

      {/* Delete Partner Modal */}
      {vendorToDelete && (
        <ConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setVendorToDelete(null);
          }}
          title={`Delete Partner: ${vendorToDelete.companyName}`}
          message={`Are you sure you want to permanently delete "${vendorToDelete.companyName}"? This action will remove the partner and their warehouse depot profile.`}
          confirmLabel="Delete Partner"
          isDestructive={true}
          requireReason={false}
          isLoading={deleteMutation.isPending}
          onConfirm={() => {
            deleteMutation.mutate(vendorToDelete.id);
          }}
        />
      )}

      {/* Register Partner Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Onboard New Partner"
        maxWidth="2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              ...formData,
              companyName: formData.warehouseName || formData.name,
              location: formData.warehouseLocation || formData.location || 'Main Hub',
              warehouseLocation: formData.warehouseLocation || formData.location || 'Main Hub',
              latitude: pinpointedCoords?.lat ?? formData.latitude,
              longitude: pinpointedCoords?.lng ?? formData.longitude,
              documents: uploadedDocs.map((d) => ({
                type: d.type,
                title: d.title.trim() || d.fileName.replace(/\.[^/.]+$/, '') || 'Document',
                fileUrl: d.fileUrl,
              })),
            });
          }}
          className="space-y-4"
        >
          {createMutation.isError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {(createMutation.error as any)?.response?.data?.error?.message ||
                (createMutation.error as any)?.response?.data?.message ||
                'Failed to onboard partner. Please verify details and try again.'}
            </div>
          )}

          <div className="space-y-5">
            {/* 1. PARTNER PROFILE & IMAGE */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Partner Personal & Account Details
                </h4>
              </div>

              {/* Partner Avatar / Image */}
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-2xs">
                    {formData.partnerImage ? (
                      <img
                        src={formData.partnerImage}
                        alt="Partner Avatar Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-6 h-6" />
                        <span className="text-[10px] font-semibold mt-1">Photo</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => partnerFileInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition"
                    title="Upload partner photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 block">
                    Partner Profile Image
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload official partner avatar (PNG, JPG, WebP up to 5MB).
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => partnerFileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition"
                    >
                      {formData.partnerImage ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {formData.partnerImage && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, partnerImage: '' })}
                        className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={partnerFileInputRef}
                  id="partner-avatar-file-input"
                  name="partnerAvatarFile"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePartnerImageChange}
                />
              </div>

              {/* Partner Name & Mobile / Contact Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="partner-name-input" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Partner Name *
                  </label>
                  <input
                    id="partner-name-input"
                    name="partnerName"
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="partner-phone-input" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Partner Contact Number *
                  </label>
                  <input
                    id="partner-phone-input"
                    name="partnerPhone"
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Mail ID & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="partner-email-input" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Mail ID (Email) *
                  </label>
                  <input
                    id="partner-email-input"
                    name="partnerEmail"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="partner@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="partner-password-input" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="partner-password-input"
                      name="partnerPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full p-2.5 pr-10 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. WAREHOUSE LOCATION, NAME, NUMBER & IMAGE */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Warehouse & Depot Details
                  </h4>
                </div>
                {pinpointedCoords && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <Check className="w-3 h-3" /> Pinpoint Linked ({pinpointedCoords.lat.toFixed(4)}, {pinpointedCoords.lng.toFixed(4)})
                  </span>
                )}
              </div>

              {/* Google Maps Location URL Pinpointer */}
              <div className="bg-white p-3.5 rounded-xl border border-indigo-100/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Google Maps Location URL</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Supports dropped pins, maps.app.goo.gl & coordinates
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="google-maps-url-input"
                      name="googleMapsUrl"
                      type="text"
                      placeholder="Paste link e.g. https://maps.app.goo.gl/... or coordinates"
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleResolveGoogleMapsUrl();
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-indigo-500 bg-slate-50/50"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isResolvingUrl || !googleMapsUrl.trim()}
                    onClick={() => handleResolveGoogleMapsUrl()}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0"
                  >
                    {isResolvingUrl ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Pinpointing...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Pinpoint Location</span>
                      </>
                    )}
                  </button>
                </div>

                {urlResolveError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    {urlResolveError}
                  </p>
                )}

                {/* Live Pinpointed Mini-Map Preview */}
                {pinpointedCoords && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        Pinpointed Coordinates: {pinpointedCoords.lat.toFixed(6)}, {pinpointedCoords.lng.toFixed(6)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPinpointedCoords(null);
                          setGoogleMapsUrl('');
                          setFormData((prev) => ({ ...prev, latitude: null, longitude: null }));
                        }}
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Reset Pin
                      </button>
                    </div>
                    <WarehouseMiniMap
                      lat={pinpointedCoords.lat}
                      lng={pinpointedCoords.lng}
                      title={formData.warehouseName || 'Warehouse Depot'}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="warehouse-name-input" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Warehouse Name
                  </label>
                  <input
                    id="warehouse-name-input"
                    name="warehouseName"
                    type="text"
                    placeholder="e.g. Central Logistics Hub (Hyderabad)"
                    value={formData.warehouseName}
                    onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="warehouse-phone-input" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Warehouse Contact Number
                  </label>
                  <input
                    id="warehouse-phone-input"
                    name="warehousePhone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="e.g. +91 40 6789 0123 / +91 98450 11221"
                    value={formData.warehousePhone}
                    onChange={(e) => setFormData({ ...formData, warehousePhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="warehouse-location-input" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Warehouse Location / Address
                </label>
                <input
                  id="warehouse-location-input"
                  name="warehouseLocation"
                  type="text"
                  placeholder="e.g. Plot 42, Financial District, Gachibowli, Hyderabad, Telangana"
                  value={formData.warehouseLocation}
                  onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500 bg-white"
                />
              </div>

              {/* Warehouse Facility Image */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Warehouse Image
                </label>
                {formData.warehouseImage ? (
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-white p-2 flex items-center gap-3">
                    <img
                      src={formData.warehouseImage}
                      alt="Warehouse preview"
                      className="w-20 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-800 block">
                        Warehouse Facility Attached
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                        <Check className="w-3.5 h-3.5" /> Ready for depot registration
                      </span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => warehouseFileInputRef.current?.click()}
                          className="px-2 py-0.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, warehouseImage: '' })}
                          className="px-2 py-0.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => warehouseFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 rounded-xl p-3.5 text-center cursor-pointer transition"
                  >
                    <Warehouse className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-700">
                      Click to upload warehouse facility photo
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP up to 5MB</p>
                  </div>
                )}
                <input
                  ref={warehouseFileInputRef}
                  id="warehouse-file-input"
                  name="warehouseFile"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleWarehouseImageChange}
                />
              </div>
            </div>

            {/* 4. VERIFICATION DOCUMENTS (UPLOAD OPTION) */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Verification Documents (Upload)
                  </h4>
                </div>
                {uploadedDocs.length > 0 && (
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    {uploadedDocs.length} attached · {formatBytes(uploadedDocs.reduce((sum, doc) => sum + (doc.fileSizeBytes || 0), 0))} / 500 MB
                  </span>
                )}
              </div>

              {/* Upload Form Box */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Attach Verification Documents
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Select multiple PDF, PNG, JPG, or WebP files — up to {MAX_ONBOARDING_DOCS} documents, 500MB total
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => docFileInputRef.current?.click()}
                    disabled={docsUploading}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition inline-flex items-center justify-center gap-2 shadow-xs shrink-0 disabled:opacity-60"
                  >
                    {docsUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose Files to Upload</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={docFileInputRef}
                    id="doc-file-input"
                    name="docFile"
                    type="file"
                    accept=".pdf,image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddDocument}
                  />
                </div>

                {docUploadError && (
                  <p className="text-xs text-rose-600 font-semibold">{docUploadError}</p>
                )}
              </div>

              {/* Uploaded Documents List */}
              {uploadedDocs.length > 0 ? (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Attached Documents ({uploadedDocs.length})
                  </span>
                  <div className="space-y-2.5">
                    {uploadedDocs.map((doc, idx) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white space-y-2.5 text-xs shadow-2xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Document #{idx + 1}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                            title="Remove document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Input Box to give name or leave empty */}
                        <div>
                          <label htmlFor={`doc-title-${doc.id}`} className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Document Name / Title (Optional)
                          </label>
                          <input
                            id={`doc-title-${doc.id}`}
                            name={`docTitle_${doc.id}`}
                            type="text"
                            value={doc.title}
                            onChange={(e) => handleUpdateDocTitle(doc.id, e.target.value)}
                            placeholder="Type document name, or leave empty"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 placeholder:font-normal placeholder-slate-400 outline-none focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                          <span className="truncate max-w-[260px] sm:max-w-md">
                            Attached file: <span className="font-medium text-slate-600">{doc.fileName}</span>
                          </span>
                          {doc.fileSize && <span className="shrink-0">{doc.fileSize}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  No documents attached yet. Click "Choose Files to Upload" to attach as many as you need.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || docsUploading}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering Partner & Hub...</span>
                </>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
