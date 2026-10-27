import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { hostMediaIfNeeded } from '../../api/upload';
import { VendorProfile, Booking } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { Modal } from '../../components/common/Modal';
import { VendorLocationMap } from '../../components/vendors/VendorLocationMap';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Star,
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Ban,
  Phone,
  Mail,
  User as UserIcon,
  FileText,
  Calendar,
  Layers,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  Wrench,
  Check,
  Upload,
  Plus,
  Trash2,
  FileUp,
  Warehouse,
  Eye,
  ChevronDown,
} from 'lucide-react';

export const VendorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'employees_area' | 'kyc' | 'services' | 'bookings'>('employees_area');
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [previewDoc, setPreviewDoc] = useState<{ title: string; fileUrl: string; type?: string } | null>(null);

  // Fetch Vendor Full Profile
  const {
    data: vendor,
    isLoading,
    isError,
  } = useQuery<VendorProfile>({
    queryKey: ['vendor-detail', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/vendors/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
  });

  // Fetch Vendor Bookings History
  const { data: bookingsData } = useQuery<{ data: Booking[] }>({
    queryKey: ['vendor-bookings', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/bookings?vendorId=${id}&limit=10`);
      return res.data;
    },
    enabled: !!id,
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      return apiClient.patch(`/admin/vendors/${id}/approve`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsApproveOpen(false);
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      return apiClient.patch(`/admin/vendors/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsRejectOpen(false);
    },
  });

  // Suspend Mutation
  const suspendMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      return apiClient.patch(`/admin/vendors/${id}/suspend`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setIsSuspendOpen(false);
    },
  });

  // Reactivate Mutation
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      return apiClient.patch(`/admin/vendors/${id}/reactivate`, {
        reason: 'Reactivated by Super Admin',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/admin/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      navigate('/partner-onboarding');
    },
  });

  // Document Upload States
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [docType, setDocType] = useState<string>('TRADE_LICENSE');
  const [docTitle, setDocTitle] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [docVerificationStatus, setDocVerificationStatus] = useState<'PENDING' | 'APPROVED'>('APPROVED');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload Document Mutation
  const uploadDocMutation = useMutation({
    mutationFn: async (payload: {
      type: string;
      title: string;
      fileUrl: string;
      verificationStatus: 'PENDING' | 'APPROVED';
    }) => {
      return apiClient.post(`/admin/vendors/${id}/documents`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-detail', id] });
      setIsUploadDocOpen(false);
      setDocTitle('');
      setDocFileUrl('');
      setSelectedFileName('');
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.error?.message || err.message || 'Failed to upload document');
    },
  });

  // Delete Document Mutation
  const deleteDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      return apiClient.delete(`/admin/vendors/${id}/documents/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-detail', id] });
    },
  });



  // Remove Service Mutation
  const removeServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return apiClient.delete(`/admin/vendors/${id}/services/${serviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-detail', id] });
    },
  });

  // Toggle Service Active Status Mutation
  const toggleServiceStatusMutation = useMutation({
    mutationFn: async ({ serviceId, isActive }: { serviceId: string; isActive: boolean }) => {
      return apiClient.post(`/admin/vendors/${id}/services`, {
        serviceId,
        isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-detail', id] });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      setUploadError('File size must be 500MB or smaller');
      return;
    }

    setSelectedFileName(file.name);
    if (!docTitle) {
      setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    setUploadError(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read the file.'));
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Failed to read the file.'));
        };
        reader.readAsDataURL(file);
      });

      const url = await hostMediaIfNeeded(dataUrl, 'servfex/documents');
      if (!url) {
        throw new Error('Upload did not return a hosted file URL');
      }
      setDocFileUrl(url);
    } catch (err: any) {
      setDocFileUrl('');
      setUploadError(err.response?.data?.error?.message || err.message || 'Failed to upload document');
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      setUploadError('Please enter a document title.');
      return;
    }
    if (!docFileUrl.trim()) {
      setUploadError('Please select a file or provide a valid file URL.');
      return;
    }
    uploadDocMutation.mutate({
      type: docType,
      title: docTitle.trim(),
      fileUrl: docFileUrl.trim(),
      verificationStatus: docVerificationStatus,
    });
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Loading vendor details...</p>
      </div>
    );
  }

  if (isError || !vendor) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Vendor Profile Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The requested vendor profile does not exist or has been removed from the platform.
        </p>
        <button
          onClick={() => navigate('/partner-onboarding')}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Partner Onboarding</span>
        </button>
      </div>
    );
  }

  const documents = vendor.user?.documents || [];
  const employees = vendor.employees || [];
  const activeEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0];
  const services = vendor.vendorServices || [];
  const bookings = bookingsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-2xl shrink-0 shadow-xs overflow-hidden">
              {vendor.user?.profilePhotoUrl ? (
                <img
                  src={vendor.user.profilePhotoUrl}
                  alt={vendor.companyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Briefcase className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{vendor.companyName}</h1>
                {vendor.user?.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Partner
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {vendor.location}
                </span>
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Joined {new Date(vendor.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Decision Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            {vendor.kycStatus === 'PENDING' && (
              <>
                <button
                  onClick={() => setIsRejectOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition inline-flex items-center gap-1.5 border border-rose-200 shadow-xs"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject KYC</span>
                </button>
                <button
                  onClick={() => setIsApproveOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve Partner</span>
                </button>
              </>
            )}

            {vendor.kycStatus === 'APPROVED' && (
              vendor.isActive ? (
                <button
                  onClick={() => setIsSuspendOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition inline-flex items-center gap-1.5 border border-rose-200 shadow-xs"
                >
                  <Ban className="w-4 h-4" />
                  <span>Suspend Partner</span>
                </button>
              ) : (
                <button
                  onClick={() => reactivateMutation.mutate()}
                  disabled={reactivateMutation.isPending}
                  className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition inline-flex items-center gap-1.5 border border-emerald-200 shadow-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Reactivate Partner</span>
                </button>
              )
            )}

            <button
              onClick={() => setIsDeleteOpen(true)}
              className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition inline-flex items-center gap-1.5 border border-rose-200 shadow-xs"
              title="Delete partner"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Partner</span>
            </button>
          </div>
        </div>

        {/* Primary Contact Details (Displayed at the top) */}
        <div className="pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <UserIcon className="w-4 h-4 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
              Primary Contact Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Owner Full Name
              </span>
              <p className="font-bold text-slate-900 text-xs mt-1 truncate">
                {vendor.user?.name || '—'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Contact Email
              </span>
              <p className="font-medium text-slate-800 text-xs mt-1 truncate flex items-center gap-1.5" title={vendor.user?.email}>
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{vendor.user?.email || '—'}</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Phone Number
              </span>
              <p className="font-medium text-slate-800 text-xs mt-1 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{vendor.user?.phone || '—'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{vendor.rating}</span>
            <span className="text-xs text-slate-500 font-medium">({vendor.reviewCount} reviews)</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Technicians</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {employees.length || vendor._count?.employees || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">active staff</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bookings</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{vendor._count?.bookings || 0}</span>
            <span className="text-xs text-slate-500 font-medium">assigned orders</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('employees_area')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'employees_area'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/80'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Employees & Area</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {employees.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'kyc'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/80'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>KYC & Compliance</span>
          {documents.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {documents.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'services'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/80'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Services Catalog</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {services.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/80'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Recent Bookings</span>
        </button>
      </div>

      {/* Tab 1: Employees & Area */}
      {activeTab === 'employees_area' && (
        <div className="space-y-6">
          {/* Registered Employees & Technicians */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Registered Employees & Technicians ({employees.length})
                </h3>
              </div>
            </div>

            {employees.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">No employees registered yet</p>
                <p className="text-xs text-slate-400">
                  This partner has not added technicians to their roster yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Technician</th>
                      <th className="py-3 px-4">Specialization</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Rating</th>
                      <th className="py-3 px-4">Completed Jobs</th>
                      <th className="py-3 px-4">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {emp.user?.name || 'Technician'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {emp.specialization || 'General'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{emp.phone || emp.user?.phone || '—'}</td>
                        <td className="py-3 px-4 font-bold text-amber-600 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {emp.rating}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{emp.completedJobs} jobs</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {emp.isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Operating Area & Location */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Operating Area & Location
            </h3>

            {/* Google Maps Location Picker */}
            <VendorLocationMap
              vendorId={vendor.id}
              initialLocation={vendor.location}
              initialLat={vendor.latitude}
              initialLng={vendor.longitude}
            />

            {vendor.bio && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Company Bio / Area Coverage</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {vendor.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: KYC & Compliance */}
      {activeTab === 'kyc' && (
        <div className="space-y-6">
          {/* Rejection Alert If KYC Rejected */}
          {vendor.kycStatus === 'REJECTED' && vendor.kycRejectionReason && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-800 text-sm">KYC Application Rejected</h4>
                <p className="text-xs text-rose-700 mt-1">{vendor.kycRejectionReason}</p>
              </div>
            </div>
          )}

          {/* Warehouse Hub & Depot Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-indigo-600" />
              Warehouse & Logistics Hub
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Warehouse Name</span>
                <span className="font-bold text-slate-800 mt-1 block">{vendor.warehouseName || 'Central Hub'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Warehouse Location</span>
                <span className="font-medium text-slate-700 mt-1 block truncate" title={vendor.warehouseLocation || vendor.location}>
                  {vendor.warehouseLocation || vendor.location}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Warehouse Contact</span>
                <span className="font-medium text-slate-800 mt-1 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {vendor.warehousePhone || '—'}
                </span>
              </div>
            </div>

            {vendor.warehouseImageUrl && (
              <div className="pt-2">
                <span className="text-slate-400 font-semibold block mb-1.5 text-xs">Facility Photo</span>
                <img
                  src={vendor.warehouseImageUrl}
                  alt="Warehouse Facility"
                  className="w-full max-h-48 object-cover rounded-xl border border-slate-200 shadow-2xs"
                />
              </div>
            )}
          </div>

          {/* 1st SECTION: Main Partner Documents (Uploaded by Admin/Vendor during onboarding) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Main Partner Documents (Partner Onboarding)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Primary compliance and legal documents provided during partner registration and onboarding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadError(null);
                  setIsUploadDocOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-3">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <div>
                  <p className="text-xs font-semibold text-slate-500">No partner documents uploaded yet</p>
                  <p className="text-[11px] text-slate-400">
                    Upload trade licenses, business registration, or compliance proofs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadError(null);
                    setIsUploadDocOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-800 truncate">{doc.title || doc.fileName || doc.type}</p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {doc.type} • {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {doc.verificationStatus === 'APPROVED' || doc.isVerified ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                          Verified
                        </span>
                      ) : doc.verificationStatus === 'REJECTED' ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md">
                          Rejected
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">
                          Pending
                        </span>
                      )}

                      {doc.fileUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({ title: doc.title || doc.type, fileUrl: doc.fileUrl, type: doc.type })}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you want to remove this document?')) {
                            deleteDocMutation.mutate(doc.id);
                          }
                        }}
                        disabled={deleteDocMutation.isPending}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2nd SECTION: Employees Documents (Taken by partner while onboarding) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Employees Documents (Technician Onboarding Records)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Identity and compliance records submitted when technicians are onboarded by this partner.
                </p>
              </div>

              {employees.length > 0 && (
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <label className="text-xs font-bold text-slate-600">Technician:</label>
                  <div className="relative">
                    <select
                      value={activeEmployee?.id || ''}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.user?.name || 'Technician'} ({emp.specialization || 'Staff'})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {employees.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No employees registered under this partner</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  When the partner onboards technicians and takes their documents, they will appear here grouped by employee name.
                </p>
              </div>
            ) : (
              <div>
                {/* Active Selected Employee Info Bar */}
                {activeEmployee && (
                  <div className="mb-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                        {(activeEmployee.user?.name || 'E')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 block leading-tight">
                          {activeEmployee.user?.name || 'Technician'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {activeEmployee.specialization} • Phone: {activeEmployee.phone || activeEmployee.user?.phone || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                        {activeEmployee.user?.documents?.length || 0} document(s) on file
                      </span>
                    </div>
                  </div>
                )}

                {/* Selected Employee Documents List */}
                {(!activeEmployee?.user?.documents || activeEmployee.user.documents.length === 0) ? (
                  <div className="py-6 text-center text-slate-400 space-y-1.5 bg-slate-50 rounded-xl border border-slate-100">
                    <FileText className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">
                      No documents on file for {activeEmployee?.user?.name || 'this technician'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Identity or certificate documents taken by the partner during employee onboarding will be listed here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeEmployee.user.documents.map((empDoc: any) => (
                      <div
                        key={empDoc.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-slate-800 truncate">
                              {empDoc.title || empDoc.fileName || empDoc.type}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {empDoc.type} • {new Date(empDoc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {empDoc.verificationStatus === 'APPROVED' || empDoc.isVerified ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">
                              Verified
                            </span>
                          ) : empDoc.verificationStatus === 'REJECTED' ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md">
                              Rejected
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">
                              Pending
                            </span>
                          )}

                          {empDoc.fileUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  title: `${activeEmployee.user?.name || 'Technician'} - ${empDoc.title || empDoc.type}`,
                                  fileUrl: empDoc.fileUrl,
                                  type: empDoc.type,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Services Offered */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
                Services Offered ({services.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Catalog services assigned to and fulfilled by this service partner.
              </p>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-slate-600">No services enabled</p>
                <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
                  This partner has not been assigned any catalog services yet. Assign services from the platform Service Catalog.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Service Name</th>
                    <th className="py-3 px-4">Base Starting Price</th>
                    <th className="py-3 px-4">Custom Partner Price</th>
                    <th className="py-3 px-4">Availability</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map((vs: any) => (
                    <tr key={vs.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {vs.service?.name || 'Service Item'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        ₹{Number(vs.service?.startingPrice || 0)}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-600">
                        {vs.customPrice ? `₹${Number(vs.customPrice)}` : 'Uses Base Price'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {vs.availability}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleServiceStatusMutation.mutate({ serviceId: vs.serviceId, isActive: !vs.isActive })}
                          disabled={toggleServiceStatusMutation.isPending}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                            vs.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title="Click to toggle status"
                        >
                          {vs.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Unassign "${vs.service?.name || 'this service'}" from this partner?`)) {
                              removeServiceMutation.mutate(vs.serviceId);
                            }
                          }}
                          disabled={removeServiceMutation.isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remove service from partner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Recent Bookings */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Assigned Bookings History ({bookings.length})
            </h3>
          </div>

          {bookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No booking history</p>
              <p className="text-xs text-slate-400">
                This partner has not fulfilled or been assigned any customer bookings yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Booking #</th>
                    <th className="py-3 px-4">Date & Slot</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {b.bookingNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {b.scheduledDate} ({b.scheduledTimeSlot})
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{Number(b.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirm Approve Modal */}
      <ConfirmModal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title={`Approve Partner: ${vendor.companyName}`}
        message="Approve this vendor's registration and enable their services across the ServFex platform."
        confirmLabel="Approve & Activate"
        isDestructive={false}
        isLoading={approveMutation.isPending}
        onConfirm={(reason) => approveMutation.mutate({ reason })}
      />

      {/* Confirm Reject Modal */}
      <ConfirmModal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title={`Reject KYC: ${vendor.companyName}`}
        message="Provide a clear rejection reason explaining why the application or compliance documents failed verification."
        confirmLabel="Reject Application"
        isDestructive={true}
        isLoading={rejectMutation.isPending}
        onConfirm={(reason) => rejectMutation.mutate({ reason })}
      />

      {/* Confirm Suspend Modal */}
      <ConfirmModal
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        title={`Suspend Partner: ${vendor.companyName}`}
        message="This will immediately deactivate the vendor profile, revoke staff logins, and stop new booking dispatches."
        confirmLabel="Suspend Partner"
        isDestructive={true}
        isLoading={suspendMutation.isPending}
        onConfirm={(reason) => suspendMutation.mutate({ reason })}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={`Delete Partner: ${vendor.companyName}`}
        message={`Are you sure you want to permanently delete "${vendor.companyName}"? This action will remove the partner and their access from the platform.`}
        confirmLabel="Delete Partner"
        isDestructive={true}
        requireReason={false}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadDocOpen}
        onClose={() => {
          if (!uploadDocMutation.isPending) {
            setIsUploadDocOpen(false);
            setUploadError(null);
          }
        }}
        title="Upload Verification Document"
        maxWidth="lg"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 p-6">
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Document Classification</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
            >
              <option value="TRADE_LICENSE">Trade / Business License</option>
              <option value="GOVERNMENT_ID">Government ID (Aadhaar, PAN, Passport)</option>
              <option value="TAX_DOCUMENT">Tax Document (GST Certificate, Returns)</option>
              <option value="CERTIFICATE">Professional Certificate / Accreditation</option>
              <option value="OTHER">Other Compliance Document</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Telangana Trade License 2026, GSTIN Registration Certificate"
              className="w-full text-xs font-medium rounded-xl border border-slate-200 px-3 py-2.5 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Select File (PDF or Image, max 500MB) <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-5 text-center transition bg-slate-50/50 hover:bg-slate-50 cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileUp className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              {selectedFileName ? (
                <div>
                  <p className="text-xs font-bold text-slate-800">{selectedFileName}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">File attached ready for upload</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-700">Click or drag a file to upload</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG, or WEBP up to 500MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Or Paste Document File URL</label>
            <input
              type="url"
              value={docFileUrl.startsWith('data:') ? '' : docFileUrl}
              onChange={(e) => {
                setDocFileUrl(e.target.value);
                setSelectedFileName('');
              }}
              placeholder="https://example.com/documents/license.pdf"
              className="w-full text-xs font-medium rounded-xl border border-slate-200 px-3 py-2.5 focus:border-indigo-500 focus:outline-none font-mono"
            />
            {docFileUrl && !docFileUrl.startsWith('data:') && selectedFileName && (
              <p className="text-[11px] text-emerald-600 font-medium">
                File hosted and ready ({selectedFileName})
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Initial Verification State</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDocVerificationStatus('APPROVED')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                  docVerificationStatus === 'APPROVED'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Verified</span>
              </button>
              <button
                type="button"
                onClick={() => setDocVerificationStatus('PENDING')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                  docVerificationStatus === 'PENDING'
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Mark Pending</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={uploadDocMutation.isPending}
              onClick={() => {
                setIsUploadDocOpen(false);
                setUploadError(null);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadDocMutation.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {uploadDocMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Document View Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewDoc(null)}
          title={`Document: ${previewDoc.title}`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span className="font-semibold">{previewDoc.type || 'Verification Document'}</span>
              <a
                href={previewDoc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:underline"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-2 min-h-[280px] max-h-[500px]">
              {previewDoc.fileUrl.startsWith('data:image') || previewDoc.fileUrl.match(/\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i) ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  className="max-h-[460px] max-w-full object-contain rounded-lg shadow-sm"
                />
              ) : previewDoc.fileUrl.startsWith('data:application/pdf') || previewDoc.fileUrl.match(/\.pdf(\?.*)?$/i) ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  className="w-full h-[450px] rounded-lg border-0 bg-white"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">{previewDoc.title}</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Click below to open or download this document directly in a new tab.
                  </p>
                  <a
                    href={previewDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Document</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}


    </div>
  );
};
