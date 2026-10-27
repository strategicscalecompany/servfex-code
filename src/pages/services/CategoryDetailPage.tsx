import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderOpen,
  Loader2,
  Plus,
  Upload,
  X,
  Package,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  ImageIcon,
  Video,
  Film,
  Sparkles,
  CheckCircle2,
  Edit2,
  Trash2,
  IndianRupee,
  Tag,
  Check,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { hostMediaIfNeeded } from '../../api/upload';
import { ServiceCategory, ServiceSubCategory, ServicePackage } from '../../types';
import { Modal } from '../../components/common/Modal';
import { PackageFormModal } from './PackageFormModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

// ─── Image Slot Uploader ─────────────────────────────────────────────────────

const SingleImageSlot: React.FC<{
  preview: string | null;
  onChange: (b64: string | null) => void;
  label: string;
  isRequired?: boolean;
}> = ({ preview, onChange, label, isRequired = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const b64 = await toBase64(file);
    onChange(b64);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-gray-600 flex items-center justify-between">
        <span>{label}</span>
        {isRequired ? (
          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
            Required
          </span>
        ) : (
          <span className="text-[10px] text-gray-400">Optional</span>
        )}
      </span>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`relative cursor-pointer h-24 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-2 overflow-hidden ${
          preview
            ? 'border-indigo-500 bg-indigo-50/20'
            : isRequired
            ? 'border-amber-300 hover:border-indigo-400 bg-amber-50/20 hover:bg-indigo-50/20'
            : 'border-gray-200 hover:border-indigo-300 bg-gray-50/60 hover:bg-indigo-50/10'
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt="slot preview" className="w-full h-full object-cover rounded-lg" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition shadow-xs"
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
            {isRequired && (
              <span className="absolute bottom-1 left-1 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                Banner
              </span>
            )}
          </>
        ) : (
          <div className="text-center space-y-1">
            <Upload className={`w-5 h-5 mx-auto ${isRequired ? 'text-amber-500' : 'text-gray-400'}`} />
            <span className="text-[10px] text-gray-500 block leading-tight">
              {isRequired ? 'Upload Banner *' : 'Add image'}
            </span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
};

// ─── Video Slot Uploader ─────────────────────────────────────────────────────

const SingleVideoSlot: React.FC<{
  preview: string | null;
  onChange: (b64: string | null) => void;
  onError: (msg: string) => void;
}> = ({ preview, onChange, onError }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      onError('Please select a valid video file');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      onError('Video size must be under 50MB');
      return;
    }
    const b64 = await toBase64(file);
    onChange(b64);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-indigo-500" />
          <span>Banner Video (1 Video Max)</span>
        </label>
        <span className="text-[10px] text-gray-400">Optional</span>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`relative cursor-pointer h-24 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-2 overflow-hidden ${
          preview
            ? 'border-emerald-500 bg-emerald-50/20'
            : 'border-gray-200 hover:border-indigo-300 bg-gray-50/60 hover:bg-indigo-50/10'
        }`}
      >
        {preview ? (
          <div className="w-full h-full flex items-center justify-center relative bg-black rounded-lg overflow-hidden">
            <video src={preview} className="w-full h-full object-cover opacity-80" muted playsInline />
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-white/90 text-gray-900 rounded-full p-1.5 shadow-sm">
                <Video className="w-4 h-4 text-emerald-600" />
              </span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-rose-600 text-white rounded-full transition shadow-xs z-10"
              title="Remove video"
            >
              <X className="w-3 h-3" />
            </button>
            <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs z-10">
              Video Attached
            </span>
          </div>
        ) : (
          <div className="text-center space-y-1">
            <Video className="w-5 h-5 mx-auto text-gray-400" />
            <span className="text-[10px] text-gray-500 block">Click or drop video (MP4, WebM up to 50MB)</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
};

// ─── Sub-Category Form (Create / Edit) ────────────────────────────────────────

const SubCategoryForm: React.FC<{
  categoryId: string;
  existing?: ServiceSubCategory | null;
  existingCount: number;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ categoryId, existing, existingCount, onSuccess, onCancel }) => {
  const [name, setName] = useState(existing?.name || '');
  const [iconPreview, setIconPreview] = useState<string | null>(existing?.iconUrl || null);

  // 4 banner images slot (slot 0 required for creation, 1-3 optional)
  const [bannerImages, setBannerImages] = useState<(string | null)[]>([
    existing?.bannerImages?.[0] || null,
    existing?.bannerImages?.[1] || null,
    existing?.bannerImages?.[2] || null,
    existing?.bannerImages?.[3] || null,
  ]);

  // 1 banner video (optional)
  const [bannerVideo, setBannerVideo] = useState<string | null>(existing?.bannerVideo || null);

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Re-sync form state whenever the target sub-category changes
  useEffect(() => {
    if (existing) {
      setName(existing.name || '');
      setIconPreview(existing.iconUrl || null);
      setBannerImages([
        existing.bannerImages?.[0] || null,
        existing.bannerImages?.[1] || null,
        existing.bannerImages?.[2] || null,
        existing.bannerImages?.[3] || null,
      ]);
      setBannerVideo(existing.bannerVideo || null);
    } else {
      setName('');
      setIconPreview(null);
      setBannerImages([null, null, null, null]);
      setBannerVideo(null);
    }
    setError(null);
    setUploadStatus(null);
  }, [existing]);

  const handleSlotChange = (index: number, b64: string | null) => {
    const updated = [...bannerImages];
    updated[index] = b64;
    setBannerImages(updated);
    setError(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Host icon if base64 provided
      setUploadStatus('Uploading icon…');
      const hostedIcon = (await hostMediaIfNeeded(iconPreview, 'servfex/sub-categories/icons')) ?? null;

      // 2. Host all active banner images
      setUploadStatus('Uploading banner images…');
      const hostedBanners: string[] = [];
      for (let i = 0; i < bannerImages.length; i++) {
        const slotImg = bannerImages[i];
        if (slotImg) {
          setUploadStatus(`Uploading banner image ${i + 1}…`);
          const url = await hostMediaIfNeeded(slotImg, 'servfex/sub-categories/banners');
          if (url) hostedBanners.push(url);
        }
      }

      // 3. Host banner video if provided
      let hostedVideo: string | null = null;
      if (bannerVideo) {
        setUploadStatus('Uploading banner video…');
        hostedVideo = (await hostMediaIfNeeded(bannerVideo, 'servfex/sub-categories/videos')) ?? null;
      }

      // Validation check for new sub-categories
      if (!existing && hostedBanners.length === 0) {
        throw new Error('At least 1 banner image is required for the sub-category');
      }

      setUploadStatus('Saving changes…');
      const payload = {
        name: name.trim(),
        iconUrl: hostedIcon,
        bannerImages: hostedBanners,
        bannerVideo: hostedVideo,
      };

      if (existing) {
        await apiClient.patch(`/admin/sub-categories/${existing.id}`, payload);
      } else {
        await apiClient.post(`/admin/categories/${categoryId}/sub-categories`, {
          ...payload,
          displayOrder: existingCount,
          isActive: true,
        });
      }
    },
    onSuccess: () => {
      setUploadStatus(null);
      onSuccess();
    },
    onError: (err: any) => {
      setUploadStatus(null);
      setError(err.response?.data?.error?.message || err.message || 'Failed to save sub-category');
    },
  });

  const hasAtLeastOneImage = bannerImages.some((img) => !!img);
  const canSubmit = existing ? !!name.trim() : (!!name.trim() && hasAtLeastOneImage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Sub-Category name is required');
      return;
    }
    if (!existing && !hasAtLeastOneImage) {
      setError('Please provide at least 1 image to be used for the banner');
      return;
    }
    saveMutation.mutate();
  };

  const hasPrimaryImage = !!bannerImages[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Sub-Category Name */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          Sub-Category Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="e.g. Deep Cleaning, Kitchen Cleaning, Pest Control…"
          className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300"
          required
          autoFocus
        />
      </div>

      {/* 4 Banner Images Section */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Banner Images (Up to 4 Images) {existing ? '' : '*'}</span>
            </label>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Change, replace, or upload up to 4 banner pictures (Slot 1 is used for the cover banner).
            </p>
          </div>
          {hasAtLeastOneImage && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Banner Ready
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <SingleImageSlot
            label="1. Main Banner *"
            isRequired={!existing}
            preview={bannerImages[0]}
            onChange={(b64) => handleSlotChange(0, b64)}
          />
          <SingleImageSlot
            label="2. Image 2"
            isRequired={false}
            preview={bannerImages[1]}
            onChange={(b64) => handleSlotChange(1, b64)}
          />
          <SingleImageSlot
            label="3. Image 3"
            isRequired={false}
            preview={bannerImages[2]}
            onChange={(b64) => handleSlotChange(2, b64)}
          />
          <SingleImageSlot
            label="4. Image 4"
            isRequired={false}
            preview={bannerImages[3]}
            onChange={(b64) => handleSlotChange(3, b64)}
          />
        </div>
      </div>

      {/* 1 Banner Video Section (Optional) */}
      <div className="pt-2 border-t border-gray-100">
        <SingleVideoSlot
          preview={bannerVideo}
          onChange={setBannerVideo}
          onError={(msg) => setError(msg)}
        />
      </div>

      {/* Sub-Category Icon/Logo (Optional) */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-semibold text-gray-600">
            Sub-Category Icon / Logo
          </label>
          <span className="text-[10px] text-gray-400">Optional</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden relative">
            {iconPreview ? (
              <>
                <img src={iconPreview} alt="Icon" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setIconPreview(null)}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 text-white rounded-full shadow-xs"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </>
            ) : (
              <Layers className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              id="subcat-icon-input"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const b64 = await toBase64(f);
                  setIconPreview(b64);
                }
                e.target.value = '';
              }}
            />
            <label
              htmlFor="subcat-icon-input"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer border border-indigo-200 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              {iconPreview ? 'Change Icon' : 'Upload Icon'}
            </label>
            <p className="text-[10px] text-gray-400 mt-1">Small square icon / PNG used for lists & avatar</p>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-[11px] text-gray-500">
          {!existing && !hasAtLeastOneImage ? (
            <span className="text-amber-600 font-medium">⚠️ 1 banner image required</span>
          ) : (
            <span className="text-emerald-600 font-medium">✓ Ready to save</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saveMutation.isPending}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending || !canSubmit}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition shadow-xs"
          >
            {saveMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadStatus || (existing ? 'Saving changes…' : 'Creating…')}
              </span>
            ) : (
              existing ? 'Save Changes' : 'Create Sub-Category'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

// ─── Assign to Partner Modal Form ─────────────────────────────────────────────

const AssignModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  preselectedServiceId?: string;
  allServices: any[];
  vendors: any[];
}> = ({ isOpen, onClose, preselectedServiceId, allServices, vendors }) => {
  const [serviceId, setServiceId] = useState(preselectedServiceId || '');
  const [vendorId, setVendorId] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [availability, setAvailability] = useState('Mon-Sat: 09:00 - 18:00');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setServiceId(preselectedServiceId || '');
      setVendorId('');
      setCustomPrice('');
      setError(null);
    }
  }, [isOpen, preselectedServiceId]);

  const assignMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/admin/vendors/${vendorId}/services`, {
        serviceId,
        customPrice: customPrice ? parseFloat(customPrice) : null,
        availability,
        isActive: true,
      });
    },
    onSuccess: () => {
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || err.message || 'Failed to assign service');
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Service to Partner">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!serviceId || !vendorId) {
            setError('Please select both a service and a partner.');
            return;
          }
          assignMutation.mutate();
        }}
        className="space-y-4"
      >
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Select Catalog Service *
          </label>
          <select
            required
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">— Choose a Service —</option>
            {allServices.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.category?.name ? ` [${s.category.name}]` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Select Partner *</label>
          <select
            required
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">— Choose Partner —</option>
            {vendors.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.companyName} ({v.location})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Custom Price (₹) — Optional
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
            placeholder="Leave blank for catalog base price"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Availability Schedule
          </label>
          <input
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="Mon-Sat: 09:00 - 18:00"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={assignMutation.isPending || !serviceId || !vendorId}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition"
          >
            {assignMutation.isPending ? 'Assigning…' : 'Assign Service'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Sub-Category Tile ────────────────────────────────────────────────────────

interface PackageSectionGroup {
  title: string | null;
  packages: any[];
}

const SubCategoryTile: React.FC<{
  subCat: ServiceSubCategory;
  categoryServices: any[];
  vendors: any[];
  allServices: any[];
  onEdit: (subCat: ServiceSubCategory) => void;
}> = ({ subCat, categoryServices, vendors, allServices, onEdit }) => {
  const queryClient = useQueryClient();
  const [packagesOpen, setPackagesOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignServiceId, setAssignServiceId] = useState('');

  // Package Form Modal State
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);

  // Services in this sub-category
  const subCatServices = categoryServices.filter((s: any) => s.subCategoryId === subCat.id);

  // Collect all packages from services in this sub-category
  const allPackages = subCatServices.flatMap((s: any) =>
    (s.packages || []).map((p: ServicePackage) => ({ ...p, _serviceName: s.name }))
  );

  // Extract all distinct existing section titles
  const existingSections = Array.from(
    new Set(
      allPackages
        .map((p: any) => p.sectionTitle)
        .filter((t: any): t is string => Boolean(t && t.trim()))
    )
  );

  // Group packages by section title sequence:
  // If a package has a section title, it starts a new section.
  // Subsequent packages without a title belong to that same section.
  const sections: PackageSectionGroup[] = [];
  let activeSection: PackageSectionGroup | null = null;

  for (const pkg of allPackages) {
    if (pkg.sectionTitle && pkg.sectionTitle.trim()) {
      activeSection = {
        title: pkg.sectionTitle.trim(),
        packages: [pkg],
      };
      sections.push(activeSection);
    } else {
      if (!activeSection) {
        activeSection = {
          title: null,
          packages: [],
        };
        sections.push(activeSection);
      }
      activeSection.packages.push(pkg);
    }
  }

  // Delete package mutation
  const deletePkgMutation = useMutation({
    mutationFn: async (pkgId: string) => {
      await apiClient.delete(`/admin/packages/${pkgId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-services'] });
      queryClient.invalidateQueries({ queryKey: ['sub-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-catalog-services-list'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error?.message || err.message || 'Failed to delete package');
    },
  });

  const handleDeletePackage = (pkg: any) => {
    if (window.confirm(`Are you sure you want to delete package "${pkg.name}"?`)) {
      deletePkgMutation.mutate(pkg.id);
    }
  };

  const thumbImg = subCat.bannerImages?.[0] || subCat.iconUrl;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
      {/* Tile Header */}
      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Banner / Icon Thumbnail */}
        <div className="w-16 h-14 sm:w-20 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-indigo-50 border border-indigo-100 flex items-center justify-center relative">
          {thumbImg ? (
            <img src={thumbImg} alt={subCat.name} className="w-full h-full object-cover" />
          ) : (
            <Layers className="w-6 h-6 text-indigo-500" />
          )}
          {subCat.bannerVideo && (
            <span
              className="absolute bottom-1 left-1 bg-black/75 backdrop-blur-xs text-white p-0.5 rounded text-[9px] flex items-center shadow-xs"
              title="Has Banner Video"
            >
              <Video className="w-3 h-3 text-emerald-400" />
            </span>
          )}
          {subCat.bannerImages && subCat.bannerImages.length > 1 && (
            <span className="absolute top-1 right-1 bg-black/75 backdrop-blur-xs text-white px-1 py-0.2 rounded text-[9px] font-semibold">
              +{subCat.bannerImages.length}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm text-gray-900">{subCat.name}</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {allPackages.length} {allPackages.length === 1 ? 'package' : 'packages'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                subCat.isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {subCat.isActive ? 'Active' : 'Inactive'}
            </span>
            {subCat.bannerImages && subCat.bannerImages.length > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {subCat.bannerImages.length} {subCat.bannerImages.length === 1 ? 'banner' : 'banners'}
              </span>
            )}
            {existingSections.length > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                {existingSections.length} {existingSections.length === 1 ? 'section' : 'sections'}
              </span>
            )}
          </div>
          {allPackages.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              {allPackages.length} package{allPackages.length !== 1 ? 's' : ''} organized in {sections.length} {sections.length === 1 ? 'section' : 'sections'}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Create Package - opens Create Package modal */}
          <button
            onClick={() => {
              setEditingPackage(null);
              setIsPackageModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
          >
            <Package className="w-3.5 h-3.5" />
            Create Package
          </button>

          {/* Assign */}
          <button
            onClick={() => {
              setAssignServiceId(subCatServices[0]?.id || '');
              setAssignOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-semibold transition"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Assign
          </button>

          {/* Edit Sub-Category with pencil icon */}
          <button
            onClick={() => onEdit(subCat)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Edit Sub-Category"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Packages dropdown toggle */}
          <button
            onClick={() => setPackagesOpen(!packagesOpen)}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title={packagesOpen ? 'Hide packages' : 'Show packages'}
          >
            {packagesOpen ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Packages Section Accordion */}
      {packagesOpen && (
        <div className="border-t border-indigo-100 bg-gradient-to-b from-indigo-50/30 to-gray-50/50 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Packages in {subCat.name} ({allPackages.length})</span>
            </div>
            <button
              onClick={() => {
                setEditingPackage(null);
                setIsPackageModalOpen(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Package
            </button>
          </div>

          {allPackages.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500 bg-white rounded-xl border border-dashed border-gray-300 space-y-2">
              <Package className="w-6 h-6 text-gray-300 mx-auto" />
              <p className="font-semibold text-gray-600">No packages created for this sub-category yet.</p>
              <p className="text-gray-400">Click "Create Package" above to add your first service package.</p>
              <button
                onClick={() => {
                  setEditingPackage(null);
                  setIsPackageModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Package Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((sec, secIdx) => (
                <div
                  key={secIdx}
                  className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden"
                >
                  {/* Section Title Heading */}
                  {sec.title ? (
                    <div className="bg-gradient-to-r from-indigo-50 via-purple-50/50 to-white px-4 py-2.5 border-b border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-bold text-xs text-indigo-950 uppercase tracking-wide">
                          {sec.title}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
                          {sec.packages.length} {sec.packages.length === 1 ? 'service' : 'services'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">Section {secIdx + 1}</span>
                    </div>
                  ) : sections.length > 1 ? (
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">General Packages</span>
                      <span className="text-[10px] text-gray-400">{sec.packages.length} services</span>
                    </div>
                  ) : null}

                  {/* Packages in this Section */}
                  <div className="divide-y divide-gray-100 p-2 space-y-1">
                    {sec.packages.map((pkg: any) => {
                      const orig = Number(pkg.originalPrice) || 0;
                      const disc = Number(pkg.discountedPrice) || 0;
                      const savings = orig > disc ? orig - disc : 0;
                      const savingsPct = orig > 0 && orig > disc ? Math.round((savings / orig) * 100) : 0;

                      return (
                        <div
                          key={pkg.id}
                          className="p-3 rounded-lg hover:bg-gray-50/80 transition flex flex-col sm:flex-row items-start sm:items-center gap-3"
                        >
                          {/* Card Thumbnail */}
                          {pkg.cardImage ? (
                            <img
                              src={pkg.cardImage}
                              alt={pkg.name}
                              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-200"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-5 h-5 text-indigo-400" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-gray-900">{pkg.name}</span>
                              {pkg.badgeText && (
                                <span className="text-[9px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">
                                  {pkg.badgeText}
                                </span>
                              )}
                              {pkg.detailBannerVideo && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold flex items-center gap-1">
                                  <Video className="w-2.5 h-2.5" /> Video
                                </span>
                              )}
                              {pkg.offersBanner && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold">
                                  Offer Banner
                                </span>
                              )}
                            </div>

                            {/* Cost and Discount side by side */}
                            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                              <span className="text-xs font-extrabold text-indigo-700">
                                ₹{disc.toFixed(0)}
                              </span>
                              {orig > disc && (
                                <span className="text-[11px] text-gray-400 line-through">
                                  ₹{orig.toFixed(0)}
                                </span>
                              )}
                              {savings > 0 && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  Save ₹{savings.toFixed(0)} ({savingsPct}% OFF)
                                </span>
                              )}
                              <span className="text-[11px] text-gray-500 font-medium">
                                • {pkg.duration || '60 mins'}
                              </span>
                              {pkg.highlights?.length > 0 && (
                                <span className="text-[10px] text-gray-400">
                                  • {pkg.highlights.length} highlights
                                </span>
                              )}
                              {pkg.processSteps?.length > 0 && (
                                <span className="text-[10px] text-gray-400">
                                  • {pkg.processSteps.length} process steps
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons: Edit & Delete */}
                          <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPackage(pkg);
                                setIsPackageModalOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Edit Package"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePackage(pkg)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Package"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Package Form Modal (Create / Edit) */}
      <PackageFormModal
        isOpen={isPackageModalOpen}
        onClose={() => {
          setIsPackageModalOpen(false);
          setEditingPackage(null);
        }}
        subCategory={subCat}
        existing={editingPackage}
        existingSections={existingSections}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['category-services'] });
          queryClient.invalidateQueries({ queryKey: ['sub-categories'] });
          queryClient.invalidateQueries({ queryKey: ['all-catalog-services-list'] });
          setIsPackageModalOpen(false);
          setEditingPackage(null);
          setPackagesOpen(true);
        }}
      />

      {/* Assign Modal */}
      <AssignModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        preselectedServiceId={assignServiceId}
        allServices={allServices}
        vendors={vendors}
      />
    </div>
  );
};

// ─── Main Category Detail Page ────────────────────────────────────────────────

export const CategoryDetailPage: React.FC = () => {
  const { categoryId, id } = useParams<{ categoryId?: string; id?: string }>();
  const activeId = categoryId || id;
  const queryClient = useQueryClient();

  const [isCreateSubCatOpen, setIsCreateSubCatOpen] = useState(false);
  const [editingSubCat, setEditingSubCat] = useState<ServiceSubCategory | null>(null);

  // Fetch category info
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ServiceCategory[] }>('/admin/categories');
      return res.data.data;
    },
  });
  const category = categories.find((c) => c.id === activeId);

  // Fetch sub-categories for this category
  const { data: subCategories = [], isLoading: subCatLoading } = useQuery({
    queryKey: ['sub-categories', activeId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ServiceSubCategory[] }>(
        `/admin/categories/${activeId}/sub-categories`
      );
      return res.data.data;
    },
    enabled: !!activeId,
  });

  // Fetch all services for this category
  const { data: categoryServices = [] } = useQuery({
    queryKey: ['category-services', activeId],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/services?limit=100&categoryId=${activeId}`);
      return res.data?.data || [];
    },
    enabled: !!activeId,
  });

  // Fetch all services for assign modal
  const { data: allServices = [] } = useQuery({
    queryKey: ['all-catalog-services-list'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/services?limit=100');
      return res.data?.data || [];
    },
  });

  // Fetch vendors for assign modal
  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors-list-selector'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/vendors?limit=100');
      return res.data?.data || [];
    },
  });

  const isLoading = catLoading || subCatLoading;

  return (
    <div className="flex-1 flex flex-col w-full h-full space-y-4">
      {/* Category Header */}
      {catLoading ? (
        <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span className="text-sm text-gray-500">Loading category details…</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          {/* Left: Icon + Name */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center p-1.5">
              {category?.iconUrl ? (
                <img src={category.iconUrl} alt={category.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900">{category?.name || 'Category'}</h1>
                {category && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      category.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
                {!subCatLoading && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {subCategories.length} sub-{subCategories.length === 1 ? 'category' : 'categories'}
                  </span>
                )}
              </div>
              {category?.description && (
                <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
              )}
            </div>
          </div>

          {/* Right: Create Sub-Category Button */}
          <button
            onClick={() => setIsCreateSubCatOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Sub-Category
          </button>
        </div>
      )}

      {/* Sub-Categories List */}
      <div className="flex-1 w-full bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 min-h-[calc(100vh-13rem)] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-sm">Loading sub-categories…</span>
            </div>
          </div>
        ) : subCategories.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Layers className="w-8 h-8 text-indigo-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-500">No sub-categories yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Click "Create Sub-Category" to upload 1-4 banner pictures, optional video, and organize packages.
              </p>
            </div>
            <button
              onClick={() => setIsCreateSubCatOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Sub-Category
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-indigo-500" />
              Sub-Categories ({subCategories.length})
            </div>
            {subCategories.map((subCat) => (
              <SubCategoryTile
                key={subCat.id}
                subCat={subCat}
                categoryServices={categoryServices}
                vendors={vendors}
                allServices={allServices}
                onEdit={(sc) => setEditingSubCat(sc)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Sub-Category Modal */}
      <Modal
        isOpen={isCreateSubCatOpen}
        onClose={() => setIsCreateSubCatOpen(false)}
        title="Create Sub-Category"
        maxWidth="lg"
      >
        <SubCategoryForm
          categoryId={activeId!}
          existingCount={subCategories.length}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['sub-categories', activeId] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsCreateSubCatOpen(false);
          }}
          onCancel={() => setIsCreateSubCatOpen(false)}
        />
      </Modal>

      {/* Edit Sub-Category Modal */}
      <Modal
        isOpen={!!editingSubCat}
        onClose={() => setEditingSubCat(null)}
        title={editingSubCat ? `Edit Sub-Category: ${editingSubCat.name}` : 'Edit Sub-Category'}
        maxWidth="lg"
      >
        {editingSubCat && (
          <SubCategoryForm
            key={editingSubCat.id}
            categoryId={activeId!}
            existing={editingSubCat}
            existingCount={subCategories.length}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['sub-categories', activeId] });
              queryClient.invalidateQueries({ queryKey: ['categories'] });
              setEditingSubCat(null);
            }}
            onCancel={() => setEditingSubCat(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default CategoryDetailPage;
