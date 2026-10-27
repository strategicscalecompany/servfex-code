import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { hostMediaIfNeeded, hostMediaList } from '../../api/upload';
import { Service, ServiceCategory, ServiceSubCategory, ServicePackage } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  Home,
  Sparkles,
  Search,
  Plus,
  Eye,
  Star,
  Clock,
  Package,
  Loader2,
  Check,
  UserCheck,
  Layers,
  Upload,
  X,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Video,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Tag,
  ArrowDown,
  GripVertical,
  ListChecks,
  FileText,
  Info,
  HelpCircle,
  Smartphone,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Share2,
  ShoppingBag,
  Droplets,
  Zap,
  ShieldCheck,
  FolderTree,
  FolderOpen,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const autoSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Icon Upload (reused from Categories) ────────────────────────────────────

interface IconUploadProps {
  preview: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
  height?: string;
}

const IconUpload: React.FC<IconUploadProps> = ({
  preview,
  onChange,
  label = 'Icon (PNG)',
  height = 'h-24',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const b64 = await toBase64(file);
      onChange(b64);
    },
    [onChange]
  );
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 transition-colors bg-gray-50 hover:bg-indigo-50/30 flex items-center justify-center ${height}`}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" className="max-h-full max-w-full object-contain rounded-lg p-1" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="absolute top-1.5 right-1.5 p-0.5 bg-white rounded-full shadow hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="text-center">
            <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
            <span className="text-xs text-gray-500">
              Drop here or <span className="text-indigo-600 font-medium">browse</span>
            </span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};

// ─── Multi-image slot ─────────────────────────────────────────────────────────

const ImageSlot: React.FC<{
  index: number;
  value: string | null;
  onChange: (b64: string | null) => void;
}> = ({ index, value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="relative cursor-pointer h-28 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 bg-gray-50 flex items-center justify-center overflow-hidden"
    >
      {value ? (
        <>
          <img src={value} alt={`banner ${index + 1}`} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="absolute top-1 right-1 p-0.5 bg-white rounded-full shadow text-gray-400 hover:text-red-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <div className="text-center">
          <ImageIcon className="w-5 h-5 mx-auto mb-1 text-gray-300" />
          <span className="text-xs text-gray-400">Banner {index + 1}</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) onChange(await toBase64(file));
          e.target.value = '';
        }}
      />
    </div>
  );
};

// ─── Package Manager ──────────────────────────────────────────────────────────

const PackageManager: React.FC<{ service: Service; onClose: () => void }> = ({ service, onClose }) => {
  const queryClient = useQueryClient();
  const [isAddPkgOpen, setIsAddPkgOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<ServicePackage | null>(null);
  const [deletingPkg, setDeletingPkg] = useState<ServicePackage | null>(null);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['packages', service.id],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ServicePackage[] }>(
        `/admin/services/${service.id}/packages`
      );
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.delete(`/admin/packages/${id}`, { data: { reason } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages', service.id] });
      setDeletingPkg(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{service.name} — Packages</h3>
        <button
          onClick={() => setIsAddPkgOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Package
        </button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-gray-400 text-sm">Loading packages…</div>
      ) : packages.length === 0 ? (
        <div className="py-10 text-center text-gray-400">
          <Package className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm">No packages yet. Add the first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg, idx) => (
            <div
              key={pkg.id}
              className={`rounded-xl border p-4 flex gap-4 items-center ${
                idx === 0 ? 'border-indigo-200 bg-indigo-50/40' : 'border-gray-200 bg-white'
              }`}
            >
              {pkg.cardImage ? (
                <img src={pkg.cardImage} alt={pkg.name} className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-200" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{pkg.name}</span>
                  {pkg.badgeText && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">
                      {pkg.badgeText}
                    </span>
                  )}
                  {idx === 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                      Hero Card
                    </span>
                  )}
                </div>
                {pkg.shortDescription && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pkg.shortDescription}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-sm font-bold text-gray-900">₹{Number(pkg.discountedPrice)}</span>
                  {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.discountedPrice) && (
                    <span className="text-xs text-gray-400 line-through">₹{Number(pkg.originalPrice)}</span>
                  )}
                  {pkg.savingsLabel && (
                    <span className="text-xs text-emerald-600 font-semibold">{pkg.savingsLabel}</span>
                  )}
                  <span className="text-xs text-gray-400">{pkg.duration}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setEditingPkg(pkg)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingPkg(pkg)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Package Modal */}
      <Modal
        isOpen={isAddPkgOpen || !!editingPkg}
        onClose={() => { setIsAddPkgOpen(false); setEditingPkg(null); }}
        title={editingPkg ? `Edit: ${editingPkg.name}` : 'Add Package'}
        maxWidth="2xl"
      >
        <PackageForm
          serviceId={service.id}
          existing={editingPkg}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['packages', service.id] });
            setIsAddPkgOpen(false);
            setEditingPkg(null);
          }}
          onCancel={() => { setIsAddPkgOpen(false); setEditingPkg(null); }}
        />
      </Modal>

      <ConfirmModal
        isOpen={!!deletingPkg}
        onClose={() => setDeletingPkg(null)}
        onConfirm={(reason) => {
          if (deletingPkg) deleteMutation.mutate({ id: deletingPkg.id, reason });
        }}
        title="Delete Package"
        message={`Delete "${deletingPkg?.name}"? This cannot be undone if no bookings exist.`}
        confirmText="Delete Package"
        requireReason
        danger
      />
    </div>
  );
};

// ─── Package Form ─────────────────────────────────────────────────────────────

interface PackageFormProps {
  serviceId: string;
  existing?: ServicePackage | null;
  onSuccess: () => void;
  onCancel: () => void;
}

type StringList = string[];
type ProcessStep = { title: string; description: string; imagePreview?: string | null };
type Requirement = { iconPreview?: string | null; label: string };
type FAQ = { question: string; answer: string };

const PackageForm: React.FC<PackageFormProps> = ({ serviceId, existing, onSuccess, onCancel }) => {
  // Basic
  const [name, setName] = useState(existing?.name ?? '');
  const [shortDescription, setShortDescription] = useState(existing?.shortDescription ?? '');
  const [badgeText, setBadgeText] = useState(existing?.badgeText ?? '');
  // Pricing
  const [originalPrice, setOriginalPrice] = useState(existing ? String(Number(existing.originalPrice)) : '');
  const [discountedPrice, setDiscountedPrice] = useState(existing ? String(Number(existing.discountedPrice)) : '');
  const [savingsLabel, setSavingsLabel] = useState(existing?.savingsLabel ?? '');
  const [pricePerUnitLabel, setPricePerUnitLabel] = useState(existing?.pricePerUnitLabel ?? '');
  const [duration, setDuration] = useState(existing?.duration ?? '60 mins');
  // Card image
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(existing?.cardImage ?? null);
  // Detail banners (up to 4)
  const [detailBanners, setDetailBanners] = useState<(string | null)[]>(
    existing?.detailBannerImages?.length
      ? [...existing.detailBannerImages, null, null, null, null].slice(0, 4)
      : [null, null, null, null]
  );
  // Content lists
  const [highlights, setHighlights] = useState<StringList>(existing?.highlights ?? []);
  const [newHighlight, setNewHighlight] = useState('');
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>(
    existing?.processSteps?.map((s) => ({ title: s.title, description: s.description, imagePreview: s.imageUrl })) ?? []
  );
  const [whatsIncluded, setWhatsIncluded] = useState<StringList>(existing?.whatsIncluded ?? []);
  const [newIncluded, setNewIncluded] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>(
    existing?.requirements?.map((r) => ({ iconPreview: r.iconUrl, label: r.label })) ?? []
  );
  const [pleaseNote, setPleaseNote] = useState<StringList>(existing?.pleaseNote ?? []);
  const [newNote, setNewNote] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>(existing?.faqs ?? []);
  const [displayOrder, setDisplayOrder] = useState(existing?.displayOrder ?? 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cardImage = await hostMediaIfNeeded(cardImagePreview, 'servfex/packages/cards');
      const detailBannerImages = await hostMediaList(detailBanners, 'servfex/packages/banners');
      const hostedProcessSteps = await Promise.all(
        processSteps.map(async (s, i) => ({
          stepNumber: i + 1,
          title: s.title,
          description: s.description,
          imageUrl: (await hostMediaIfNeeded(s.imagePreview, 'servfex/packages/steps')) ?? null,
        }))
      );
      const hostedRequirements = await Promise.all(
        requirements.map(async (r) => ({
          iconUrl: (await hostMediaIfNeeded(r.iconPreview, 'servfex/packages/icons')) ?? '',
          label: r.label,
        }))
      );

      const payload = {
        name: name.trim(),
        shortDescription: shortDescription.trim() || undefined,
        badgeText: badgeText.trim() || undefined,
        originalPrice: parseFloat(originalPrice),
        discountedPrice: parseFloat(discountedPrice),
        savingsLabel: savingsLabel.trim() || undefined,
        pricePerUnitLabel: pricePerUnitLabel.trim() || undefined,
        duration: duration.trim(),
        cardImage,
        detailBannerImages,
        highlights,
        processSteps: hostedProcessSteps,
        whatsIncluded,
        requirements: hostedRequirements,
        pleaseNote,
        faqs,
        displayOrder,
      };
      if (existing) {
        await apiClient.patch(`/admin/packages/${existing.id}`, payload);
      } else {
        await apiClient.post(`/admin/services/${serviceId}/packages`, payload);
      }
    },
    onSuccess,
  });

  const addToList = (list: StringList, setList: React.Dispatch<React.SetStateAction<StringList>>, val: string, setVal: React.Dispatch<React.SetStateAction<string>>) => {
    if (val.trim()) { setList([...list, val.trim()]); setVal(''); }
  };

  const removeFromList = (list: StringList, setList: React.Dispatch<React.SetStateAction<StringList>>, idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const sectionTitle = (icon: React.ReactNode, text: string) => (
    <div className="flex items-center gap-2 pt-4 pb-2 border-t border-gray-100 mt-2">
      <span className="text-indigo-600">{icon}</span>
      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{text}</span>
    </div>
  );

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}
      className="space-y-3 max-h-[75vh] overflow-y-auto pr-1"
    >
      {/* A. Basic */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label-xs">Package Name *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Foam-jet AC Service (2 ACs)"
            className="input-sm w-full" />
        </div>
        <div className="col-span-2">
          <label className="label-xs">Short Bio</label>
          <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)}
            placeholder="One-line summary shown on card"
            className="input-sm w-full" />
        </div>
        <div>
          <label className="label-xs">Badge Text</label>
          <input value={badgeText} onChange={(e) => setBadgeText(e.target.value)}
            placeholder="e.g. Free gas check"
            className="input-sm w-full" />
        </div>
        <div>
          <label className="label-xs">Display Order</label>
          <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
            className="input-sm w-full" />
        </div>
      </div>

      {/* B. Pricing */}
      {sectionTitle(<IndianRupee className="w-3.5 h-3.5" />, 'Pricing')}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-xs">Original Price (₹) *</label>
          <input required type="number" min="0" step="0.01" value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            placeholder="1299" className="input-sm w-full" />
        </div>
        <div>
          <label className="label-xs">Discounted Price (₹) *</label>
          <input required type="number" min="0" step="0.01" value={discountedPrice}
            onChange={(e) => setDiscountedPrice(e.target.value)}
            placeholder="1098" className="input-sm w-full" />
        </div>
        <div>
          <label className="label-xs">Savings Label</label>
          <input value={savingsLabel} onChange={(e) => setSavingsLabel(e.target.value)}
            placeholder="Save ₹201 (15% off)" className="input-sm w-full" />
        </div>
        <div>
          <label className="label-xs">Per Unit Label</label>
          <input value={pricePerUnitLabel} onChange={(e) => setPricePerUnitLabel(e.target.value)}
            placeholder="e.g. per AC" className="input-sm w-full" />
        </div>
        <div className="col-span-2">
          <label className="label-xs">Duration</label>
          <input value={duration} onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 60–90 mins" className="input-sm w-full" />
        </div>
      </div>

      {/* C. Card Image */}
      {sectionTitle(<ImageIcon className="w-3.5 h-3.5" />, 'Card Image')}
      <IconUpload preview={cardImagePreview} onChange={setCardImagePreview} label="" height="h-32" />

      {/* D. Detail Banners (up to 4) */}
      {sectionTitle(<ImageIcon className="w-3.5 h-3.5" />, 'Detail Banners (up to 4)')}
      <div className="grid grid-cols-4 gap-2">
        {detailBanners.map((b, i) => (
          <ImageSlot key={i} index={i} value={b} onChange={(val) => {
            const next = [...detailBanners];
            next[i] = val;
            setDetailBanners(next);
          }} />
        ))}
      </div>

      {/* E. Highlights */}
      {sectionTitle(<ListChecks className="w-3.5 h-3.5" />, 'Highlights')}
      <div className="flex gap-2">
        <input value={newHighlight} onChange={(e) => setNewHighlight(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addToList(highlights, setHighlights, newHighlight, setNewHighlight); }}}
          placeholder="Add highlight point…" className="input-sm flex-1" />
        <button type="button" onClick={() => addToList(highlights, setHighlights, newHighlight, setNewHighlight)}
          className="btn-secondary text-xs px-3">Add</button>
      </div>
      <ul className="space-y-1">
        {highlights.map((h, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="flex-1">{h}</span>
            <button type="button" onClick={() => removeFromList(highlights, setHighlights, i)} className="text-gray-300 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* F. Process Steps */}
      {sectionTitle(<FileText className="w-3.5 h-3.5" />, 'Our Process (Steps)')}
      {processSteps.map((step, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Step {i + 1}</span>
            <button type="button" onClick={() => setProcessSteps(processSteps.filter((_, j) => j !== i))}
              className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
          </div>
          <input value={step.title} onChange={(e) => {
            const s = [...processSteps]; s[i] = { ...s[i], title: e.target.value }; setProcessSteps(s);
          }} placeholder="Step title" className="input-sm w-full" />
          <textarea rows={2} value={step.description} onChange={(e) => {
            const s = [...processSteps]; s[i] = { ...s[i], description: e.target.value }; setProcessSteps(s);
          }} placeholder="Brief description of this step" className="input-sm w-full" />
          <IconUpload
            preview={step.imagePreview ?? null}
            onChange={(b64) => {
              const s = [...processSteps]; s[i] = { ...s[i], imagePreview: b64 }; setProcessSteps(s);
            }}
            label="Step Image (optional)"
            height="h-20"
          />
        </div>
      ))}
      <button type="button" onClick={() => setProcessSteps([...processSteps, { title: '', description: '' }])}
        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
        <Plus className="w-3.5 h-3.5" /> Add Step
      </button>

      {/* G. What's Included */}
      {sectionTitle(<Check className="w-3.5 h-3.5" />, "What's Included")}
      <div className="flex gap-2">
        <input value={newIncluded} onChange={(e) => setNewIncluded(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addToList(whatsIncluded, setWhatsIncluded, newIncluded, setNewIncluded); }}}
          placeholder="Add included item…" className="input-sm flex-1" />
        <button type="button" onClick={() => addToList(whatsIncluded, setWhatsIncluded, newIncluded, setNewIncluded)}
          className="btn-secondary text-xs px-3">Add</button>
      </div>
      <ul className="space-y-1">
        {whatsIncluded.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="flex-1">{item}</span>
            <button type="button" onClick={() => removeFromList(whatsIncluded, setWhatsIncluded, i)} className="text-gray-300 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* H. Requirements (icon + label grid) */}
      {sectionTitle(<GripVertical className="w-3.5 h-3.5" />, 'What We Need From You')}
      {requirements.map((req, i) => (
        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
          <IconUpload
            preview={req.iconPreview ?? null}
            onChange={(b64) => {
              const r = [...requirements]; r[i] = { ...r[i], iconPreview: b64 }; setRequirements(r);
            }}
            label=""
            height="h-12"
          />
          <input value={req.label} onChange={(e) => {
            const r = [...requirements]; r[i] = { ...r[i], label: e.target.value }; setRequirements(r);
          }} placeholder="Label (e.g. Clear access)" className="input-sm flex-1" />
          <button type="button" onClick={() => setRequirements(requirements.filter((_, j) => j !== i))}
            className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button type="button" onClick={() => setRequirements([...requirements, { iconPreview: null, label: '' }])}
        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
        <Plus className="w-3.5 h-3.5" /> Add Requirement
      </button>

      {/* I. Please Note */}
      {sectionTitle(<Info className="w-3.5 h-3.5" />, 'Please Note')}
      <div className="flex gap-2">
        <input value={newNote} onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addToList(pleaseNote, setPleaseNote, newNote, setNewNote); }}}
          placeholder="Add note…" className="input-sm flex-1" />
        <button type="button" onClick={() => addToList(pleaseNote, setPleaseNote, newNote, setNewNote)}
          className="btn-secondary text-xs px-3">Add</button>
      </div>
      <ul className="space-y-1">
        {pleaseNote.map((note, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="flex-1">{note}</span>
            <button type="button" onClick={() => removeFromList(pleaseNote, setPleaseNote, i)} className="text-gray-300 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* J. FAQs */}
      {sectionTitle(<HelpCircle className="w-3.5 h-3.5" />, 'FAQs')}
      {faqs.map((faq, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">FAQ {i + 1}</span>
            <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}
              className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
          </div>
          <input value={faq.question} onChange={(e) => {
            const f = [...faqs]; f[i] = { ...f[i], question: e.target.value }; setFaqs(f);
          }} placeholder="Question" className="input-sm w-full" />
          <textarea rows={2} value={faq.answer} onChange={(e) => {
            const f = [...faqs]; f[i] = { ...f[i], answer: e.target.value }; setFaqs(f);
          }} placeholder="Answer" className="input-sm w-full" />
        </div>
      ))}
      <button type="button" onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
        <Plus className="w-3.5 h-3.5" /> Add FAQ
      </button>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-1">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" disabled={saveMutation.isPending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60">
          {saveMutation.isPending ? 'Saving…' : existing ? 'Save Changes' : 'Create Package'}
        </button>
      </div>
    </form>
  );
};

// ─── Add Service Multi-step Form ──────────────────────────────────────────────

interface AddServiceFormProps {
  categories: ServiceCategory[];
  initialCategory?: ServiceCategory | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const AddServiceForm: React.FC<AddServiceFormProps> = ({ categories, initialCategory, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  // Step 1 — Category & Sub-category (Direct text input with auto-matching / auto-creation)
  const [categoryName, setCategoryName] = useState(initialCategory?.name || '');
  const [subCategoryName, setSubCategoryName] = useState('');
  // Step 2 — Name & Icon
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  // Step 3 — Banners
  const [banners, setBanners] = useState<(string | null)[]>([null, null, null]);
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  // Step 4 — Pricing
  const [startingPrice, setStartingPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('per service');
  const [durationText, setDurationText] = useState('60 mins');
  const [isPopular, setIsPopular] = useState(false);

  // Match existing category by name (case-insensitive)
  const matchedCategory = categories.find(
    (c) => c.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
  );

  const { data: subCategories = [] } = useQuery({
    queryKey: ['sub-categories', matchedCategory?.id],
    queryFn: async () => {
      if (!matchedCategory?.id) return [];
      const res = await apiClient.get<{ success: boolean; data: ServiceSubCategory[] }>(
        `/admin/categories/${matchedCategory.id}/sub-categories`
      );
      return res.data.data;
    },
    enabled: !!matchedCategory?.id,
  });

  // Match existing sub-category by name
  const matchedSubCategory = subCategories.find(
    (sc) => sc.name.trim().toLowerCase() === subCategoryName.trim().toLowerCase()
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const autoSlug = (n: string) =>
        n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/, '') + `-${Date.now().toString().slice(-4)}`;

      // 1. Resolve Category ID (use existing or create on the fly)
      let resolvedCategoryId = matchedCategory?.id;
      const trimmedCatName = categoryName.trim();
      if (!resolvedCategoryId) {
        const catRes = await apiClient.post<{ success: boolean; data: ServiceCategory }>('/admin/categories', {
          name: trimmedCatName,
          slug: autoSlug(trimmedCatName),
          description: `${trimmedCatName} services`,
        });
        resolvedCategoryId = catRes.data.data.id;
      }

      // 2. Resolve Sub-Category ID (if provided)
      let resolvedSubCategoryId: string | undefined = undefined;
      const trimmedSubName = subCategoryName.trim();
      if (trimmedSubName) {
        if (matchedSubCategory?.id) {
          resolvedSubCategoryId = matchedSubCategory.id;
        } else {
          // Double-check if already exists under resolvedCategoryId
          const subRes = await apiClient.get<{ success: boolean; data: ServiceSubCategory[] }>(
            `/admin/categories/${resolvedCategoryId}/sub-categories`
          );
          const existingSub = subRes.data?.data?.find(
            (sc) => sc.name.trim().toLowerCase() === trimmedSubName.toLowerCase()
          );

          if (existingSub) {
            resolvedSubCategoryId = existingSub.id;
          } else {
            const newSubRes = await apiClient.post<{ success: boolean; data: ServiceSubCategory }>(
              `/admin/categories/${resolvedCategoryId}/sub-categories`,
              { name: trimmedSubName }
            );
            resolvedSubCategoryId = newSubRes.data?.data?.id;
          }
        }
      }

      // 3. Host media first so POST /admin/services stays a small JSON body.
      // Shipping data-URIs through the Vite proxy resets the connection.
      const iconUrl = await hostMediaIfNeeded(iconPreview, 'servfex/services/icons');
      const bannerImages = await hostMediaList(banners, 'servfex/services/banners');
      const bannerVideo = await hostMediaIfNeeded(videoFile, 'servfex/services/videos');

      await apiClient.post('/admin/services', {
        categoryId: resolvedCategoryId,
        subCategoryId: resolvedSubCategoryId || undefined,
        name: name.trim(),
        slug: autoSlug(name),
        description: description.trim() || name.trim(),
        iconUrl,
        bannerImages,
        bannerVideo,
        startingPrice: parseFloat(startingPrice) || 0,
        priceUnit: priceUnit.trim(),
        durationText: durationText.trim(),
        isPopular,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['sub-categories'] });
      onSuccess();
    },
  });

  const steps = ['Category', 'Details', 'Banners', 'Pricing'];

  return (
    <div className="space-y-5">
      {/* Step Progress */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                i + 1 === step ? 'text-indigo-600' : i + 1 < step ? 'text-emerald-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i + 1 === step ? 'bg-indigo-600 text-white' :
                i + 1 < step ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              {s}
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        if (step === 1) {
          if (!categoryName.trim()) return;
          setStep(2);
        } else if (step < 4) {
          setStep(step + 1);
        } else {
          createMutation.mutate();
        }
      }}>

        {/* Step 1: Category */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="label-xs mb-1 block">Category *</label>
              <select
                required
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  setSubCategoryName('');
                }}
                className="input-sm w-full"
              >
                <option value="">— Select Category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-xs mb-1 block">Sub-Category (Optional)</label>
              {subCategories.length > 0 ? (
                <select
                  value={subCategoryName}
                  onChange={(e) => setSubCategoryName(e.target.value)}
                  className="input-sm w-full"
                >
                  <option value="">— Select Sub-Category (Optional) —</option>
                  {subCategories.map((sc) => (
                    <option key={sc.id} value={sc.name}>
                      {sc.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={subCategoryName}
                  onChange={(e) => setSubCategoryName(e.target.value)}
                  placeholder="Sub-category name (optional)"
                  className="input-sm w-full"
                />
              )}
            </div>
          </div>
        )}

        {/* Step 2: Name & Icon */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="label-xs">Service Name *</label>
              <input required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AC Service" className="input-sm w-full" />
            </div>
            <div>
              <label className="label-xs">Short Description</label>
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description shown on cards" className="input-sm w-full" />
            </div>
            <IconUpload
              preview={iconPreview}
              onChange={setIconPreview}
              label="Service Icon (PNG recommended)"
              height="h-32"
            />
          </div>
        )}

        {/* Step 3: Banners */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Upload up to 3 banner images and optionally 1 video.</p>
            <div className="grid grid-cols-3 gap-3">
              {banners.map((b, i) => (
                <ImageSlot key={i} index={i} value={b} onChange={(val) => {
                  const next = [...banners]; next[i] = val; setBanners(next);
                }} />
              ))}
            </div>
            <div>
              <label className="label-xs">Banner Video (optional)</label>
              <div
                onClick={() => videoRef.current?.click()}
                className="cursor-pointer h-20 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 bg-gray-50 flex items-center justify-center gap-2 text-sm text-gray-400"
              >
                {videoFile ? (
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-indigo-500" />
                    <span className="text-xs text-gray-600 font-medium">Video selected</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}
                      className="text-gray-400 hover:text-red-500 ml-2"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <>
                    <Video className="w-5 h-5" />
                    <span className="text-xs">Click to select video</span>
                  </>
                )}
              </div>
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setVideoFile(await toBase64(file));
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        )}

        {/* Step 4: Pricing */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-xs">Starting Price (₹)</label>
                <input type="number" min="0" step="0.01" value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  placeholder="0" className="input-sm w-full" />
              </div>
              <div>
                <label className="label-xs">Price Unit</label>
                <input value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)}
                  placeholder="per service" className="input-sm w-full" />
              </div>
              <div>
                <label className="label-xs">Duration Text</label>
                <input value={durationText} onChange={(e) => setDurationText(e.target.value)}
                  placeholder="e.g. 60–90 mins" className="input-sm w-full" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">Mark as Popular</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-5 mt-2 border-t border-gray-100">
          <button type="button" onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button type="submit" disabled={createMutation.isPending}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60">
            {createMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : step === 4 ? (
              'Create Service'
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Service Live Preview Component (30% Pane) ──────────────────────────────

interface ServicePreviewPanelProps {
  service: Service | null;
  onManagePackages: (service: Service) => void;
  onAssignService: (service: Service) => void;
}

// ─── Service Live Preview Component (30% Pane — Authentic Mobile UI) ─────────

const DEMO_PACKAGES: ServicePackage[] = [
  {
    id: 'demo-hero',
    serviceId: 'demo',
    name: 'Foam-jet service (2 ACs)',
    shortDescription: 'Deep clean indoor & outdoor AC units with foam & high-pressure jet',
    badgeText: 'Free gas check',
    originalPrice: 1498,
    discountedPrice: 1098,
    savingsLabel: 'Save ₹400 (26% off)',
    pricePerUnitLabel: '₹549/AC',
    duration: '2 hrs',
    cardImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=60',
    detailBannerImages: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=60',
    ],
    highlights: [
      'Applicable for both window or split ACs',
      'Indoor unit deep cleaning with foam & jet spray',
      'Pre and post service performance checks included',
    ],
    processSteps: [
      {
        stepNumber: 1,
        title: 'Pre-service checks',
        description: 'Pre-service inspection includes a free gas level check & comprehensive diagnosis.',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60',
      },
      {
        stepNumber: 2,
        title: 'Indoor unit cleaning',
        description: 'Indoor unit cleaned thoroughly via specialized foam & high-pressure jet spray.',
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=60',
      },
      {
        stepNumber: 3,
        title: 'Outdoor unit cleaning',
        description: 'Outdoor unit cleaned with power jet spray for optimized heat transfer & cooling.',
        imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=60',
      },
    ],
    whatsIncluded: [
      'Free inspection & gas check followed by a service quotation',
      'Foam + jet technology deep cleaning for 2 AC units',
      'Final temperature & airflow check after repair',
      'Complete clean-up of the surrounding work area',
    ],
    requirements: [
      { iconUrl: '', label: 'Bucket & water' },
      { iconUrl: '', label: 'Power point' },
      { iconUrl: '', label: 'Ladder / stool' },
      { iconUrl: '', label: 'Clear area' },
    ],
    pleaseNote: [
      'Warranty does not cover spare parts provided by the customer',
      'The outer unit shall be cleaned with a jet spray if easily accessible without safety hazard',
    ],
    faqs: [
      {
        question: 'How often should I get foam-jet AC service?',
        answer: 'We recommend foam-jet deep cleaning once every 6 months or before summer peaks.',
      },
      {
        question: 'Will jet spray damage or dirty my walls?',
        answer: 'No, technicians use a waterproof funnel spill-jacket that channels all runoff cleanly into buckets.',
      },
    ],
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'demo-compact',
    serviceId: 'demo',
    name: 'Foam-jet service (3 ACs)',
    shortDescription: 'Deep cleaning for 3 split or window AC units',
    badgeText: 'Best Value',
    originalPrice: 1797,
    discountedPrice: 1497,
    savingsLabel: 'Save ₹300',
    pricePerUnitLabel: '₹499/AC',
    duration: '3 hrs',
    cardImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
    detailBannerImages: [],
    highlights: [
      'Foam & power jet wash for 3 indoor units',
      'Outdoor condenser coil cleaning included',
    ],
    processSteps: [],
    whatsIncluded: ['Full cleaning of 3 units', 'Pre & post diagnosis checks'],
    requirements: [
      { iconUrl: '', label: 'Water' },
      { iconUrl: '', label: 'Electricity' },
      { iconUrl: '', label: 'Stool' },
      { iconUrl: '', label: 'Access' },
    ],
    pleaseNote: ['Takes approx 3 hours.'],
    faqs: [],
    displayOrder: 2,
    isActive: true,
  },
];

// ─── Demo Categories & Services Fallback ────────────────────────────────────

const DEMO_CATEGORIES: ServiceCategory[] = [
  {
    id: 'demo-cat-1',
    name: 'AC & Appliance Repair',
    slug: 'ac-appliance-repair',
    iconUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=120&auto=format&fit=crop&q=80',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    subCategories: [
      {
        id: 'demo-sub-1',
        categoryId: 'demo-cat-1',
        name: 'Large Appliances',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        services: [
          {
            id: 'demo-svc-ac',
            categoryId: 'demo-cat-1',
            subCategoryId: 'demo-sub-1',
            name: 'AC Repair & Service',
            slug: 'ac-repair',
            description: 'Foam-jet technology deep cleaning & diagnostic repair for split and window ACs.',
            startingPrice: 449,
            priceUnit: 'service',
            durationText: '45 mins',
            rating: 4.82,
            reviewCount: 3120,
            iconUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&auto=format&fit=crop&q=80',
            bannerImages: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80'],
            isActive: true,
            createdAt: new Date().toISOString(),
          } as unknown as Service,
          {
            id: 'demo-svc-wm',
            categoryId: 'demo-cat-1',
            subCategoryId: 'demo-sub-1',
            name: 'Washing Machine',
            slug: 'washing-machine',
            description: 'Complete checkup, drum deep-clean, spin issues & motor repair.',
            startingPrice: 299,
            priceUnit: 'inspection',
            durationText: '40 mins',
            rating: 4.76,
            reviewCount: 1850,
            iconUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=200&auto=format&fit=crop&q=80',
            bannerImages: ['https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80'],
            isActive: true,
            createdAt: new Date().toISOString(),
          } as unknown as Service,
          {
            id: 'demo-svc-fridge',
            categoryId: 'demo-cat-1',
            subCategoryId: 'demo-sub-1',
            name: 'Refrigerator',
            slug: 'refrigerator',
            description: 'Gas refill, cooling diagnostics, thermostat & compressor fixes.',
            startingPrice: 349,
            priceUnit: 'visit',
            durationText: '50 mins',
            rating: 4.79,
            reviewCount: 1420,
            iconUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=200&auto=format&fit=crop&q=80',
            bannerImages: ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&auto=format&fit=crop&q=80'],
            isActive: true,
            createdAt: new Date().toISOString(),
          } as unknown as Service,
        ],
      },
      {
        id: 'demo-sub-2',
        categoryId: 'demo-cat-1',
        name: 'Other Appliances',
        displayOrder: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        services: [
          {
            id: 'demo-svc-micro',
            categoryId: 'demo-cat-1',
            subCategoryId: 'demo-sub-2',
            name: 'Microwave & Oven',
            slug: 'microwave',
            description: 'Heating repair, keypad & PCB diagnosis, deep degreasing.',
            startingPrice: 249,
            priceUnit: 'checkup',
            durationText: '30 mins',
            rating: 4.71,
            reviewCount: 980,
            iconUrl: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=200&auto=format&fit=crop&q=80',
            isActive: true,
            createdAt: new Date().toISOString(),
          } as unknown as Service,
          {
            id: 'demo-svc-chimney',
            categoryId: 'demo-cat-1',
            subCategoryId: 'demo-sub-2',
            name: 'Chimney & Hood',
            slug: 'chimney',
            description: 'Deep degreasing, motor overhaul, duct clean.',
            startingPrice: 499,
            priceUnit: 'service',
            durationText: '60 mins',
            rating: 4.85,
            reviewCount: 1100,
            iconUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&auto=format&fit=crop&q=80',
            isActive: true,
            createdAt: new Date().toISOString(),
          } as unknown as Service,
        ],
      },
    ],
  },
  {
    id: 'demo-cat-2',
    name: 'Cleaning & Pest',
    slug: 'cleaning-pest',
    iconUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120&auto=format&fit=crop&q=80',
    displayOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    subCategories: [
      {
        id: 'demo-sub-3',
        categoryId: 'demo-cat-2',
        name: 'Home Cleaning',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        services: [
          {
            id: 'demo-svc-bathroom',
            categoryId: 'demo-cat-2',
            subCategoryId: 'demo-sub-3',
            name: 'Bathroom Deep Clean',
            slug: 'bathroom-clean',
            description: 'Intense tile descaling, stain removal and sanitization.',
            startingPrice: 399,
            priceUnit: 'bathroom',
            durationText: '60 mins',
            rating: 4.88,
            reviewCount: 2200,
            iconUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200&auto=format&fit=crop&q=80',
            isActive: true,
            createdAt: new Date().toISOString(),
          } as unknown as Service,
        ],
      },
    ],
  },
  {
    id: 'demo-cat-3',
    name: 'Electrician & Plumber',
    slug: 'electrician-plumber',
    iconUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=120&auto=format&fit=crop&q=80',
    displayOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    subCategories: [
      {
        id: 'demo-sub-4',
        categoryId: 'demo-cat-3',
        name: 'Electrical Repairs',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        services: [
          {
            id: 'demo-svc-switch',
            categoryId: 'demo-cat-3',
            subCategoryId: 'demo-sub-4',
            name: 'Switch & Socket Fix',
            slug: 'switch-socket',
            description: 'Repairs, replacements and fuse box checks.',
            startingPrice: 149,
            priceUnit: 'point',
            durationText: '30 mins',
            rating: 4.78,
            reviewCount: 1530,
            iconUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&auto=format&fit=crop&q=80',
            isActive: true,
            createdAt: new Date().toISOString(),
          } as unknown as Service,
        ],
      },
    ],
  },
];

interface ServicePreviewPanelProps {
  service: Service | null;
  categories?: ServiceCategory[];
  allServices?: Service[];
  selectedCategoryId?: string | null;
  onSelectCategory?: (category: ServiceCategory) => void;
  onSelectService?: (service: Service) => void;
  onManagePackages: (service: Service) => void;
  onAssignService: (service: Service) => void;
}

const ServicePreviewPanel: React.FC<ServicePreviewPanelProps> = ({
  service,
  categories = [],
  allServices = [],
  selectedCategoryId,
  onSelectCategory,
  onSelectService,
  onManagePackages,
  onAssignService,
}) => {
  const [previewPage, setPreviewPage] = useState<'home' | 'packages' | 'details'>('home');
  const [internalSelectedService, setInternalSelectedService] = useState<Service | null>(null);
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Categories list: real categories if available, else demo categories
  const categoriesList = categories && categories.length > 0 ? categories : DEMO_CATEGORIES;

  const [selectedCatId, setSelectedCatId] = useState<string>(() => {
    return selectedCategoryId || service?.categoryId || categoriesList[0]?.id || '';
  });

  useEffect(() => {
    if (selectedCategoryId) {
      setSelectedCatId(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  // When external service changes (e.g. user clicked a rectangular bar tile on the left 70%),
  // update internal service and automatically jump to packages view
  const prevServiceIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (service && service.id !== prevServiceIdRef.current) {
      prevServiceIdRef.current = service.id;
      setInternalSelectedService(service);
      if (service.categoryId) {
        setSelectedCatId(service.categoryId);
      }
      setPreviewPage('packages');
    }
  }, [service]);

  const activeCategory = categoriesList.find((c) => c.id === selectedCatId) || categoriesList[0];

  // Active service displayed in Packages and Details
  const activeService: Service =
    internalSelectedService ||
    service ||
    (allServices.length > 0 ? allServices[0] : null) ||
    (activeCategory?.subCategories?.[0]?.services?.[0] as Service) ||
    (DEMO_CATEGORIES[0].subCategories![0].services![0] as Service);

  const hasRealPackages = Boolean(activeService?.packages && activeService.packages.length > 0);
  const packagesList: ServicePackage[] = hasRealPackages ? activeService.packages! : DEMO_PACKAGES;
  const currentPackage: ServicePackage = packagesList[selectedPkgIndex] || packagesList[0];

  const heroPackage = packagesList[0];
  const otherPackages = packagesList.slice(1);
  const serviceThumb = activeService?.bannerImages?.[0] || activeService?.imageUrl || activeService?.iconUrl;

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* 3 Pages Navigation Bar: 1. Home | 2. Packages | 3. Details */}
      <div className="p-2 bg-slate-100/90 border-b border-gray-200/80 flex items-center justify-between gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setPreviewPage('home')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            previewPage === 'home'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>1. Home</span>
        </button>

        <button
          type="button"
          onClick={() => setPreviewPage('packages')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            previewPage === 'packages'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>2. Packages</span>
        </button>

        <button
          type="button"
          onClick={() => setPreviewPage('details')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            previewPage === 'details'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>3. Details</span>
        </button>
      </div>

      {/* Scrollable Screen Content */}
      <div className="flex-1 overflow-y-auto max-h-[720px] bg-slate-50/50">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PAGE 1: HOME (Categories & Sub-Categories Discovery)           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {previewPage === 'home' && (
          <div className="space-y-3.5 p-3.5">
            {/* Search Bar Simulation */}
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200/90 shadow-2xs text-gray-400 text-xs">
              <Search className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">Search 'AC service', 'Cleaning'...</span>
            </div>

            {/* Hero Promo Banner */}
            <div className="rounded-2xl p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-xs">
              <div className="relative z-10 space-y-1">
                <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">
                  Up to 40% OFF
                </span>
                <h4 className="font-extrabold text-xs text-white leading-tight">ServFex Verified Services</h4>
                <p className="text-[10px] text-slate-300">Doorstep repair & deep cleaning by background-verified pros</p>
              </div>
              <Sparkles className="w-16 h-16 text-indigo-500/20 absolute -right-2 -bottom-2" />
            </div>

            {/* Category Grid Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-0.5">
                <h5 className="font-black text-xs text-slate-900 uppercase tracking-wider">
                  Categories
                </h5>
                <span className="text-[10px] text-slate-400 font-medium">{categoriesList.length} total</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {categoriesList.map((cat) => {
                  const isCatSelected = cat.id === selectedCatId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCatId(cat.id);
                        onSelectCategory?.(cat);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                        isCatSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/30 shadow-xs'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/60">
                        {cat.iconUrl ? (
                          <img src={cat.iconUrl} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-indigo-500" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 leading-tight line-clamp-2">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-Categories Section for the selected Category */}
            {activeCategory && (
              <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600">Selected Category</span>
                    <h5 className="font-black text-xs text-slate-900">{activeCategory.name}</h5>
                  </div>
                  <span className="text-[9px] text-slate-400">Tap service to view packages</span>
                </div>

                {/* If Category has Sub-Categories */}
                {activeCategory.subCategories && activeCategory.subCategories.length > 0 ? (
                  <div className="space-y-3">
                    {activeCategory.subCategories.map((subCat) => {
                      // Find services for this subcategory from subCat.services or allServices
                      const subServices: Service[] = (subCat.services && subCat.services.length > 0)
                        ? subCat.services
                        : allServices.filter((s) => s.subCategoryId === subCat.id);

                      return (
                        <div key={subCat.id} className="space-y-2">
                          {/* Subcategory Header */}
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                            <h6 className="font-bold text-xs text-slate-800 tracking-wide">{subCat.name}</h6>
                            <span className="text-[9px] text-slate-400">({subServices.length})</span>
                          </div>

                          {/* Services Tiles in this Subcategory */}
                          {subServices.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {subServices.map((svc) => (
                                <div
                                  key={svc.id}
                                  onClick={() => {
                                    setInternalSelectedService(svc);
                                    onSelectService?.(svc);
                                    setSelectedPkgIndex(0);
                                    setPreviewPage('packages');
                                  }}
                                  className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition space-y-1.5 bg-slate-50/40"
                                >
                                  <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-100 relative">
                                    <img
                                      src={svc.bannerImages?.[0] || svc.imageUrl || svc.iconUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80'}
                                      alt={svc.name}
                                      className="w-full h-full object-cover"
                                    />
                                    <span className="absolute bottom-1 right-1 bg-white/95 text-slate-900 px-1 py-0.2 rounded text-[8px] font-bold flex items-center gap-0.5 shadow-2xs">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                      {svc.rating || '4.8'}
                                    </span>
                                  </div>
                                  <h6 className="font-bold text-[11px] text-slate-900 leading-tight line-clamp-1">{svc.name}</h6>
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-extrabold text-indigo-700">₹{Number(svc.startingPrice || 399)}</span>
                                    <span className="text-[9px] text-slate-400">{svc.durationText || '45m'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic pl-3">No services configured under this subcategory.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* If Category has direct services without sub-categories */
                  <div className="space-y-2">
                    {allServices.filter((s) => s.categoryId === activeCategory.id).length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {allServices.filter((s) => s.categoryId === activeCategory.id).map((svc) => (
                          <div
                            key={svc.id}
                            onClick={() => {
                              setInternalSelectedService(svc);
                              onSelectService?.(svc);
                              setSelectedPkgIndex(0);
                              setPreviewPage('packages');
                            }}
                            className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 cursor-pointer transition space-y-1.5 bg-slate-50/40"
                          >
                            <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-100 relative">
                              <img
                                src={svc.bannerImages?.[0] || svc.imageUrl || svc.iconUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80'}
                                alt={svc.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h6 className="font-bold text-[11px] text-slate-900 leading-tight line-clamp-1">{svc.name}</h6>
                            <span className="font-extrabold text-xs text-indigo-700">₹{Number(svc.startingPrice || 399)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400">No sub-categories or services added for this category yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PAGE 2: PACKAGES (Image 1 Layout - Hero & Compact Rows)       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {previewPage === 'packages' && (
          <div className="space-y-3 p-3">
            {/* Navigation sub-bar: Back to Home / Categories */}
            <div className="flex items-center justify-between pb-1">
              <button
                type="button"
                onClick={() => setPreviewPage('home')}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Categories</span>
              </button>
              <div className="text-right truncate font-bold text-xs text-slate-800">
                {activeService?.name}
              </div>
            </div>

            {/* If service has no real packages, show informative helper pill */}
            {!hasRealPackages && (
              <div className="bg-amber-500/90 text-white text-[10px] px-3 py-1.5 rounded-xl font-medium flex items-center justify-between shadow-2xs">
                <span>Showing sample packages preview</span>
                <button
                  type="button"
                  onClick={() => onManagePackages(activeService)}
                  className="underline font-bold"
                >
                  + Add Custom Package
                </button>
              </div>
            )}
                {/* Service Hero Banner */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 h-40 shadow-xs flex items-center justify-center">
                  {serviceThumb ? (
                    <img src={serviceThumb} alt={activeService.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-white p-4">
                      <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-1" />
                      <span className="text-xs font-semibold">ServFex Service</span>
                    </div>
                  )}

                  {/* Floating Badges on Banner */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                    <span className="bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {activeService.category?.name || 'Category'}
                    </span>
                    {activeService.subCategory && (
                      <span className="bg-white/95 backdrop-blur-xs text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {activeService.subCategory.name}
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-slate-900 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{activeService.rating || '4.8'}</span>
                    <span className="text-slate-400 font-normal">({activeService.reviewCount || '1.2k'})</span>
                  </div>

                  {activeService.bannerVideo && (
                    <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1">
                      <Video className="w-3 h-3 text-emerald-400" />
                      <span>Video</span>
                    </div>
                  )}
                </div>

                {/* Service Header Info */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs space-y-1">
                  <h3 className="font-extrabold text-sm text-slate-900">{activeService.name}</h3>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{activeService.description}</p>
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {activeService.durationText}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> ServFex Verified
                    </span>
                  </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center justify-between px-1 pt-1">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    Select a package
                  </h4>
                  <span className="text-[10px] text-slate-500">{packagesList.length} options</span>
                </div>

                {/* Layout A: First / Hero Package Card (Image 1 Spec) */}
                {heroPackage && (
                  <div className="bg-white rounded-2xl border border-indigo-200/90 shadow-xs overflow-hidden">
                    {/* Top Hero Banner inside Card */}
                    <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3 flex items-center justify-between relative overflow-hidden">
                      <div className="space-y-1 pr-2 z-10">
                        {heroPackage.badgeText && (
                          <span className="inline-block bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {heroPackage.badgeText}
                          </span>
                        )}
                        <h5 className="font-extrabold text-xs text-white leading-tight">{heroPackage.name}</h5>
                        {heroPackage.shortDescription && (
                          <p className="text-[10px] text-slate-300 line-clamp-1">{heroPackage.shortDescription}</p>
                        )}
                      </div>
                      {heroPackage.cardImage && (
                        <img
                          src={heroPackage.cardImage}
                          alt={heroPackage.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/20 shadow-sm"
                        />
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h6 className="font-bold text-xs text-slate-900">{heroPackage.name}</h6>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-slate-800">4.75</span>
                            <span>(3.1M reviews)</span>
                          </div>
                        </div>

                        {/* Add Button */}
                        <button
                          type="button"
                          className="px-3.5 py-1 rounded-lg border border-indigo-600 text-indigo-700 font-extrabold text-[11px] hover:bg-indigo-600 hover:text-white transition shadow-2xs"
                        >
                          Add
                        </button>
                      </div>

                      {/* Pricing Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-900">
                          ₹{Number(heroPackage.discountedPrice)}
                        </span>
                        {heroPackage.originalPrice && Number(heroPackage.originalPrice) > Number(heroPackage.discountedPrice) && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{Number(heroPackage.originalPrice)}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">• {heroPackage.duration}</span>
                        {heroPackage.pricePerUnitLabel && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            🟢 {heroPackage.pricePerUnitLabel}
                          </span>
                        )}
                      </div>

                      {/* Highlights Bullet Points */}
                      {heroPackage.highlights && heroPackage.highlights.length > 0 && (
                        <ul className="pt-2 border-t border-slate-100 space-y-1">
                          {heroPackage.highlights.slice(0, 3).map((h, i) => (
                            <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                              <span className="text-slate-400 font-bold">•</span>
                              <span className="line-clamp-1">{h}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* View Details Link (opens Mode 2) */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPkgIndex(0);
                            setPreviewPage('details');
                          }}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
                        >
                          <span>View details</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        {heroPackage.savingsLabel && (
                          <span className="text-[10px] text-emerald-600 font-bold">
                            {heroPackage.savingsLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Layout B: Compact Package Rows (Other Packages) */}
                {otherPackages.map((pkg, idx) => (
                  <div
                    key={pkg.id || idx}
                    className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex items-center justify-between gap-3"
                  >
                    {/* Left: Package Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h6 className="font-bold text-xs text-slate-900 truncate">{pkg.name}</h6>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-800">4.75</span>
                        <span>• {pkg.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900">
                          ₹{Number(pkg.discountedPrice)}
                        </span>
                        {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.discountedPrice) && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{Number(pkg.originalPrice)}
                          </span>
                        )}
                        {pkg.savingsLabel && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                            {pkg.savingsLabel}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPkgIndex(idx + 1);
                          setPreviewPage('details');
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5 pt-1"
                      >
                        <span>View details</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Right: Small Image with badge + Add button */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="relative">
                        {pkg.cardImage ? (
                          <img
                            src={pkg.cardImage}
                            alt={pkg.name}
                            className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                            <Package className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        {pkg.badgeText && (
                          <span className="absolute -top-1.5 right-0 bg-amber-500 text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                            {pkg.badgeText}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1 rounded-lg border border-indigo-600 text-indigo-700 font-extrabold text-[10px] hover:bg-indigo-600 hover:text-white transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* PAGE 3: PACKAGE DETAIL SCREEN (Images 2, 3, 4 Spec)            */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {previewPage === 'details' && (
              <div className="space-y-3.5 bg-slate-50 pb-6">
                {/* Detail Mode Navigation Sub-bar */}
                <div className="px-4 py-2 bg-white flex items-center justify-between border-b border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewPage('packages')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Packages</span>
                  </button>
                  <div className="text-center truncate px-2 font-bold text-xs text-slate-800">
                    {currentPackage.name}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Share2 className="w-3.5 h-3.5" />
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                </div>
                {/* Section 1: Scrollable Banner Carousel (up to 4 images) */}
                <div className="relative bg-slate-900 h-44 overflow-hidden shadow-xs">
                  {currentPackage.detailBannerImages && currentPackage.detailBannerImages.length > 0 ? (
                    <img
                      src={currentPackage.detailBannerImages[0]}
                      alt={currentPackage.name}
                      className="w-full h-full object-cover"
                    />
                  ) : currentPackage.cardImage ? (
                    <img
                      src={currentPackage.cardImage}
                      alt={currentPackage.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center text-white">
                      <Package className="w-10 h-10 text-indigo-400" />
                    </div>
                  )}

                  {/* Carousel Page Indicator Pill */}
                  <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[10px] font-mono">
                    1 / {Math.max(1, currentPackage.detailBannerImages?.length || 1)}
                  </div>
                </div>

                {/* Section 2: Package Header */}
                <div className="bg-white p-3.5 rounded-2xl mx-3 border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {currentPackage.badgeText && (
                        <span className="inline-block bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
                          {currentPackage.badgeText}
                        </span>
                      )}
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {currentPackage.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-900">4.75</span>
                        <span>(3M reviews)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-xs hover:bg-indigo-700 transition"
                    >
                      Add
                    </button>
                  </div>

                  {/* Pricing line */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-base font-extrabold text-slate-900">
                      ₹{Number(currentPackage.discountedPrice)}
                    </span>
                    {currentPackage.originalPrice && Number(currentPackage.originalPrice) > Number(currentPackage.discountedPrice) && (
                      <span className="text-xs text-slate-400 line-through">
                        ₹{Number(currentPackage.originalPrice)}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">• {currentPackage.duration}</span>
                    {currentPackage.pricePerUnitLabel && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        🟢 {currentPackage.pricePerUnitLabel}
                      </span>
                    )}
                  </div>

                  {currentPackage.savingsLabel && (
                    <div className="text-[11px] font-bold text-emerald-600">
                      {currentPackage.savingsLabel}
                    </div>
                  )}
                </div>

                {/* Section 3: Highlights */}
                {currentPackage.highlights && currentPackage.highlights.length > 0 && (
                  <div className="bg-white p-3.5 rounded-2xl mx-3 border border-slate-200/90 shadow-2xs space-y-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Highlights
                    </h5>
                    <ul className="space-y-1.5">
                      {currentPackage.highlights.map((h, i) => (
                        <li key={i} className="text-[11px] text-slate-700 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Section 4: Our Process (Numbered Steps) */}
                {currentPackage.processSteps && currentPackage.processSteps.length > 0 && (
                  <div className="bg-white p-3.5 rounded-2xl mx-3 border border-slate-200/90 shadow-2xs space-y-3">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Our process
                    </h5>
                    <div className="space-y-3">
                      {currentPackage.processSteps.map((step, idx) => (
                        <div key={idx} className="space-y-1.5 border-b border-slate-100 last:border-b-0 pb-3 last:pb-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                              {step.stepNumber || idx + 1}
                            </span>
                            <span className="font-bold text-xs text-slate-900">{step.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 pl-7 leading-relaxed">{step.description}</p>
                          {step.imageUrl && (
                            <div className="pl-7 pt-1">
                              <img
                                src={step.imageUrl}
                                alt={step.title}
                                className="w-full h-24 rounded-xl object-cover border border-slate-200"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 5: What's Included */}
                {currentPackage.whatsIncluded && currentPackage.whatsIncluded.length > 0 && (
                  <div className="bg-white p-3.5 rounded-2xl mx-3 border border-slate-200/90 shadow-2xs space-y-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      What&apos;s included
                    </h5>
                    <ul className="space-y-1.5">
                      {currentPackage.whatsIncluded.map((item, i) => (
                        <li key={i} className="text-[11px] text-slate-700 flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Section 6: What We Need From You (Strictly 4 per row grid) */}
                {currentPackage.requirements && currentPackage.requirements.length > 0 && (
                  <div className="bg-white p-3.5 rounded-2xl mx-3 border border-slate-200/90 shadow-2xs space-y-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      What we need from you
                    </h5>
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {currentPackage.requirements.map((req, i) => (
                        <div key={i} className="flex flex-col items-center text-center space-y-1">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                            {req.iconUrl ? (
                              <img src={req.iconUrl} alt={req.label} className="w-7 h-7 object-contain" />
                            ) : i === 0 ? (
                              <Droplets className="w-5 h-5 text-indigo-500" />
                            ) : i === 1 ? (
                              <Zap className="w-5 h-5 text-amber-500" />
                            ) : i === 2 ? (
                              <Layers className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Sparkles className="w-5 h-5 text-indigo-500" />
                            )}
                          </div>
                          <span className="text-[9px] font-semibold text-slate-700 leading-tight">
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 7: Please Note */}
                {currentPackage.pleaseNote && currentPackage.pleaseNote.length > 0 && (
                  <div className="bg-white p-3.5 rounded-2xl mx-3 border border-slate-200/90 shadow-2xs space-y-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Please note
                    </h5>
                    <ul className="space-y-1.5">
                      {currentPackage.pleaseNote.map((note, i) => (
                        <li key={i} className="text-[11px] text-slate-600 flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Section 8 & 9: FAQs and Reviews Accordion */}
                <div className="bg-white p-3.5 rounded-2xl mx-3 border border-slate-200/90 shadow-2xs space-y-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between">
                    <span>FAQs</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </h5>
                  {currentPackage.faqs && currentPackage.faqs.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {currentPackage.faqs.map((faq, i) => (
                        <div key={i} className="py-2 cursor-pointer" onClick={() => setExpandedFaqIndex(expandedFaqIndex === i ? null : i)}>
                          <div className="flex items-center justify-between font-bold text-[11px] text-slate-900">
                            <span>{faq.question}</span>
                            {expandedFaqIndex === i ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                          {expandedFaqIndex === i && (
                            <p className="text-[10px] text-slate-600 pt-1 leading-relaxed">{faq.answer}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">No FAQs provided for this package.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Booking Bar inside Box (Only on Packages and Details) */}
          {previewPage !== 'home' && (
            <div className="bg-white px-4 py-2.5 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] text-slate-400 block font-normal">
                  {previewPage === 'details' ? 'Package Total' : 'Starting From'}
                </span>
                <span className="text-sm font-extrabold text-slate-900">
                  ₹{Number(previewPage === 'details' ? currentPackage.discountedPrice : (activeService.startingPrice || heroPackage?.discountedPrice || 0))}
                </span>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800 transition"
              >
                Book Now
              </button>
            </div>
          )}

          {/* Admin Action Bar in Box Footer */}
          <div className="p-3 bg-slate-50 border-t border-gray-100 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onManagePackages(activeService)}
              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Configure Packages ({packagesList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => onAssignService(activeService)}
              className="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition border border-gray-300 shadow-2xs flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign</span>
            </button>
          </div>
        </div>
      );
    };

// ─── Add Category Form ───────────────────────────────────────────────────────

interface AddCategoryFormProps {
  defaultOrder?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const AddCategoryForm: React.FC<AddCategoryFormProps> = ({ defaultOrder = 0, onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [displayOrder, setDisplayOrder] = useState<string>(String(defaultOrder));
  const [isActive, setIsActive] = useState(true);
  const [iconBase64, setIconBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const generatedSlug = autoSlug(name) || `cat-${Date.now()}`;
      const payload: any = {
        name: name.trim(),
        slug: generatedSlug,
        displayOrder: parseInt(displayOrder, 10) || 0,
        isActive,
      };
      if (iconBase64) {
        payload.iconUrl = iconBase64;
      }
      const res = await apiClient.post('/admin/categories', payload);
      return res.data;
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to create category';
      setError(msg);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (!name.trim()) {
          setError('Category name is required');
          return;
        }
        createMutation.mutate();
      }}
      className="space-y-4"
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <IconUpload
        preview={iconBase64}
        onChange={(b64) => setIconBase64(b64)}
        label="Category Icon (PNG / SVG / JPG)"
        height="h-28"
      />

      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          Category Name *
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. AC & Appliance Repair, Salon for Women"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Display Order
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={displayOrder}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              setDisplayOrder(digits);
            }}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Active (Visible in App)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending || !name.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60 shadow-sm"
        >
          {createMutation.isPending ? 'Creating Category…' : 'Create Category'}
        </button>
      </div>
    </form>
  );
};

// ─── Edit Category Form ───────────────────────────────────────────────────────

interface EditCategoryFormProps {
  category: ServiceCategory;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditCategoryForm: React.FC<EditCategoryFormProps> = ({ category, onSuccess, onCancel }) => {
  const [name, setName] = useState(category.name);
  const [displayOrder, setDisplayOrder] = useState<string>(String(category.displayOrder ?? 0));
  const [isActive, setIsActive] = useState(category.isActive ?? true);
  const [iconBase64, setIconBase64] = useState<string | null>(null);
  const [existingIconUrl, setExistingIconUrl] = useState<string | null>(category.iconUrl || null);
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: name.trim(),
        displayOrder: parseInt(displayOrder, 10) || 0,
        isActive,
      };
      if (iconBase64) {
        payload.iconUrl = iconBase64;
      }
      const res = await apiClient.patch(`/admin/categories/${category.id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to update category';
      setError(msg);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (!name.trim()) {
          setError('Category name is required');
          return;
        }
        updateMutation.mutate();
      }}
      className="space-y-4"
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <IconUpload
        preview={iconBase64 || existingIconUrl}
        onChange={(b64) => {
          setIconBase64(b64);
          if (!b64) setExistingIconUrl(null);
        }}
        label="Category Icon (PNG / SVG / JPG)"
        height="h-28"
      />

      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          Category Name *
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. AC & Appliance Repair, Salon for Women"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Display Order
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={displayOrder}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              setDisplayOrder(digits);
            }}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Active (Visible in App)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={updateMutation.isPending || !name.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60 shadow-sm"
        >
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

// ─── Main Services Page ───────────────────────────────────────────────────────

export const Services: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'categories' | 'services'>('categories');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ServiceCategory | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(100);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [addServiceCategory, setAddServiceCategory] = useState<ServiceCategory | null>(null);
  const [packagesService, setPackagesService] = useState<Service | null>(null);
  const [archivingService, setArchivingService] = useState<Service | null>(null);
  const [previewServiceId, setPreviewServiceId] = useState<string | null>(null);

  const deleteCategoryMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.delete(`/admin/categories/${id}`, { data: { reason } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeletingCategory(null);
    },
  });

  // Assign to vendor modal
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignServiceId, setAssignServiceId] = useState('');
  const [assignVendorId, setAssignVendorId] = useState('');
  const [assignCustomPrice, setAssignCustomPrice] = useState('');
  const [assignAvailability, setAssignAvailability] = useState('Mon-Sat: 09:00 - 18:00');
  const [assignError, setAssignError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['services', search, categoryFilter, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(categoryFilter ? { categoryId: categoryFilter } : {}),
        ...(search ? { search } : {}),
      });
      const res = await apiClient.get(`/admin/services?${params}`);
      return res.data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ServiceCategory[] }>('/admin/categories');
      return res.data.data;
    },
  });

  const { data: vendorsData = [] } = useQuery({
    queryKey: ['vendors-list-selector'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/vendors?limit=100');
      return res.data?.data || [];
    },
  });

  const { data: allServicesData = [] } = useQuery({
    queryKey: ['all-catalog-services-list'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/services?limit=100');
      return res.data?.data || [];
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.delete(`/admin/services/${id}`, { data: { reason } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['all-catalog-services-list'] });
      setArchivingService(null);
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/admin/vendors/${assignVendorId}/services`, {
        serviceId: assignServiceId,
        customPrice: assignCustomPrice ? parseFloat(assignCustomPrice) : null,
        availability: assignAvailability,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsAssignOpen(false);
      setAssignServiceId('');
      setAssignVendorId('');
      setAssignCustomPrice('');
      setAssignError(null);
    },
    onError: (err: any) => {
      setAssignError(err.response?.data?.message || err.message || 'Failed to assign service');
    },
  });

  const services: Service[] = data?.data ?? [];
  const pagination = data?.pagination;

  const filteredCategories = categories.filter((c) => {
    const q = categorySearch.toLowerCase().trim();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    const matchStatus =
      categoryStatusFilter === 'all'
        ? true
        : categoryStatusFilter === 'active'
        ? c.isActive
        : !c.isActive;
    return matchSearch && matchStatus;
  });

  const selectedPreviewService =
    services.find((s) => s.id === previewServiceId) || services[0] || null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Service Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage services, sub-category groupings, packages and vendor pricing
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setAssignServiceId(''); setAssignVendorId(''); setAssignError(null); setIsAssignOpen(true); }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
          >
            <UserCheck className="w-4 h-4" /> Assign to Partner
          </button>
          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* 70% / 30% Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── 70% Left Section: Categories & Services ── */}
        <div className="w-full lg:w-[70%] space-y-4">
          {/* Top Tabs: Categories vs Services */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <button
              onClick={() => setActiveTab('categories')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'categories'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'services'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Package className="w-4 h-4" />
              Services ({services.length})
            </button>
          </div>

          {activeTab === 'categories' ? (
            <>
              {/* Category Search & Filter */}
              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories by name or slug…"
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <select
                  value={categoryStatusFilter}
                  onChange={(e) => setCategoryStatusFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              {/* Categories Rectangular Bar List */}
              {categories.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-gray-200">
                  <FolderTree className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">No categories created yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "+ Add Category" above to create your first category</p>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-gray-200">
                  <Search className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500 font-medium">No matching categories found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your search or status filter</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCategories.map((category) => {
                    const isSelected = selectedCategoryId === category.id;
                    const subCatCount = category.subCategories?.length || 0;
                    const categoryServices = allServicesData.filter((s: any) => s.categoryId === category.id);

                    return (
                      <div
                        key={category.id}
                        className={`group bg-white rounded-2xl border transition-all overflow-hidden ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-gray-200/90 hover:border-indigo-300 hover:shadow-xs'
                        }`}
                      >
                        <div
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            navigate(`/our-app/services/${category.id}`);
                          }}
                          className="p-4 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors"
                        >
                          {/* Icon / Avatar */}
                          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80 relative flex items-center justify-center p-1.5">
                            {category.iconUrl ? (
                              <img src={category.iconUrl} alt={category.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                <FolderOpen className="w-6 h-6" />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-base text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {category.name}
                              </h3>
                              {categoryServices.length > 0 && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  {categoryServices.length} {categoryServices.length === 1 ? 'service' : 'services'}
                                </span>
                              )}
                            </div>

                            {category.description && (
                              <p className="text-xs text-gray-500 line-clamp-1">{category.description}</p>
                            )}

                            {subCatCount > 0 && (
                              <div className="flex items-center gap-4 pt-1 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1">
                                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                                  {subCatCount} Sub-categories
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div
                            className="flex items-center gap-2 shrink-0 self-end sm:self-center border-t sm:border-t-0 sm:border-l border-gray-100 pt-2 sm:pt-0 sm:pl-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setEditingCategory(category)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Edit Category"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCategoryId(category.id);
                                navigate(`/our-app/services/${category.id}`);
                              }}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition flex items-center gap-1"
                              title="Open Category"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Filters Bar */}
              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search services by name or description…"
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 bg-white"
                  title="Items per page"
                >
                  <option value={100}>Show All on 1 Page (100)</option>
                  <option value={50}>50 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={12}>12 per page</option>
                </select>
              </div>

              {/* Service Rectangular Tiles (Bar Style) */}
              {isLoading ? (
                <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading service catalog…
                </div>
              ) : services.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-gray-200">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-500 font-medium">No services found</p>
                  <p className="text-sm text-gray-400 mt-1">Select a category or add a new category to organize catalog items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => {
                    const isSelected = selectedPreviewService?.id === service.id;
                    const thumbSrc = service.bannerImages?.[0] || service.imageUrl || service.iconUrl;
                    const packageCount = service.packages?.length || 0;

                    return (
                      <div
                        key={service.id}
                        onClick={() => setPreviewServiceId(service.id)}
                        className={`group bg-white rounded-2xl border p-3.5 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-gray-200/90 hover:border-indigo-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Rectangular Bar Thumbnail */}
                        <div className="w-full sm:w-36 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/80 relative flex items-center justify-center">
                          {thumbSrc ? (
                            <img src={thumbSrc} alt={service.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                              <Sparkles className="w-6 h-6" />
                            </div>
                          )}
                          {service.bannerVideo && (
                            <span className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white p-1 rounded-md text-[10px] flex items-center gap-1 shadow-xs">
                              <Video className="w-3 h-3 text-emerald-400" />
                            </span>
                          )}
                          {service.bannerImages && service.bannerImages.length > 1 && (
                            <span className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-xs text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
                              +{service.bannerImages.length}
                            </span>
                          )}
                        </div>

                        {/* Content Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {service.category?.name ?? 'General'}
                            </span>
                            {service.subCategory && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                {service.subCategory.name}
                              </span>
                            )}
                            {service.isPopular && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                ★ Popular
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white ml-auto sm:ml-0">
                                Viewing in Preview →
                              </span>
                            )}
                          </div>

                          {/* Title & Description */}
                          <h3 className="font-bold text-base text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-1 leading-relaxed">
                            {service.description}
                          </p>

                          {/* Metrics bar */}
                          <div className="flex items-center gap-4 pt-1 text-xs text-gray-600">
                            <span className="font-bold text-gray-900">
                              {Number(service.startingPrice) > 0 ? (
                                <>₹{Number(service.startingPrice)} <span className="text-[10px] text-gray-400 font-normal">/ {service.priceUnit}</span></>
                              ) : (
                                <span className="text-indigo-600 font-semibold">{packageCount} Packages</span>
                              )}
                            </span>
                            <span className="flex items-center gap-1 text-gray-400">
                              <Clock className="w-3.5 h-3.5" /> {service.durationText}
                            </span>
                            <span className="flex items-center gap-1 text-amber-600 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {service.rating}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div
                          className="flex sm:flex-col items-center gap-1.5 shrink-0 self-stretch sm:self-center justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-gray-100 pt-2 sm:pt-0 sm:pl-3 w-full sm:w-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setPackagesService(service)}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                            title="Manage Packages"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Packages ({packageCount})</span>
                          </button>
                          <div className="flex items-center gap-1.5 w-full justify-end">
                            <button
                              onClick={() => { setAssignServiceId(service.id); setIsAssignOpen(true); }}
                              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                              title="Assign to Partner"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Assign</span>
                            </button>
                            <button
                              onClick={() => setArchivingService(service)}
                              className="p-1.5 rounded-lg text-rose-500 bg-rose-50 hover:bg-rose-100 transition"
                              title="Archive Service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Services Footer Stats & Optional Pagination */}
              {pagination && pagination.totalPages > 1 ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{services.length}</span> of{' '}
                    <span className="font-semibold text-gray-700">{pagination.total}</span> services
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-600 px-1 font-medium">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      disabled={page === pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : pagination && pagination.total > 0 ? (
                <div className="text-center pt-3 border-t border-gray-100 text-xs text-gray-400">
                  Showing all <span className="font-semibold text-gray-700">{pagination.total}</span> services on this page
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* ── 30% Right Section: Live Customer View Preview ── */}
        <div className="w-full lg:w-[30%] lg:sticky lg:top-6 shrink-0">
          <ServicePreviewPanel
            service={selectedPreviewService}
            categories={categories}
            allServices={allServicesData}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(cat) => setSelectedCategoryId(cat.id)}
            onSelectService={(s) => setPreviewServiceId(s.id)}
            onManagePackages={(s) => setPackagesService(s)}
            onAssignService={(s) => { setAssignServiceId(s.id); setIsAssignOpen(true); }}
          />
        </div>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        title="Add New Category"
        maxWidth="md"
      >
        <AddCategoryForm
          defaultOrder={categories.length}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['services'] });
            queryClient.invalidateQueries({ queryKey: ['all-catalog-services-list'] });
            setIsAddCategoryOpen(false);
          }}
          onCancel={() => setIsAddCategoryOpen(false)}
        />
      </Modal>

      {/* Add Service Modal */}
      <Modal
        isOpen={!!addServiceCategory}
        onClose={() => setAddServiceCategory(null)}
        title={addServiceCategory ? `Add Service to ${addServiceCategory.name}` : 'Add New Service'}
        maxWidth="lg"
      >
        {addServiceCategory && (
          <AddServiceForm
            categories={categories}
            initialCategory={addServiceCategory}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['services'] });
              queryClient.invalidateQueries({ queryKey: ['categories'] });
              queryClient.invalidateQueries({ queryKey: ['all-catalog-services-list'] });
              setAddServiceCategory(null);
            }}
            onCancel={() => setAddServiceCategory(null)}
          />
        )}
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title={editingCategory ? `Edit: ${editingCategory.name}` : 'Edit Category'}
        maxWidth="md"
      >
        {editingCategory && (
          <EditCategoryForm
            category={editingCategory}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['categories'] });
              setEditingCategory(null);
            }}
            onCancel={() => setEditingCategory(null)}
          />
        )}
      </Modal>

      {/* Archive Category Confirm */}
      <ConfirmModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={(reason) => {
          if (deletingCategory) {
            deleteCategoryMutation.mutate({ id: deletingCategory.id, reason: reason || 'Archived by Admin' });
          }
        }}
        title="Archive Category"
        message={`Archive "${deletingCategory?.name}"? This hides it from the customer app.`}
        confirmText="Archive Category"
        requireReason={false}
        danger
      />

      {/* Package Manager Modal */}
      <Modal
        isOpen={!!packagesService}
        onClose={() => setPackagesService(null)}
        title="Package Management"
        maxWidth="2xl"
      >
        {packagesService && (
          <PackageManager service={packagesService} onClose={() => setPackagesService(null)} />
        )}
      </Modal>

      {/* Archive Confirm */}
      <ConfirmModal
        isOpen={!!archivingService}
        onClose={() => setArchivingService(null)}
        onConfirm={(reason) => {
          if (archivingService) archiveMutation.mutate({ id: archivingService.id, reason: reason || 'Archived by Admin' });
        }}
        title="Archive Service"
        message={`Archive "${archivingService?.name}"? It will be hidden from the customer app.`}
        confirmText="Archive Service"
        requireReason={false}
        danger
      />

      {/* Assign to Partner Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => { setIsAssignOpen(false); setAssignError(null); }}
        title="Assign Service to Partner"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!assignServiceId || !assignVendorId) {
              setAssignError('Please select both a service and a partner.');
              return;
            }
            assignMutation.mutate();
          }}
          className="space-y-4"
        >
          {assignError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{assignError}</div>
          )}
          <div>
            <label className="label-xs">Select Catalog Service *</label>
            <select required value={assignServiceId} onChange={(e) => setAssignServiceId(e.target.value)}
              className="input-sm w-full">
              <option value="">— Choose a Service —</option>
              {(allServicesData.length > 0 ? allServicesData : services).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.category?.name ? `[${s.category.name}]` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-xs">Select Partner *</label>
            <select required value={assignVendorId} onChange={(e) => setAssignVendorId(e.target.value)}
              className="input-sm w-full">
              <option value="">— Choose Partner —</option>
              {vendorsData.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.companyName} ({v.location})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-xs">Custom Price (₹) — Optional</label>
            <input type="number" min="0" step="0.01" value={assignCustomPrice}
              onChange={(e) => setAssignCustomPrice(e.target.value)}
              placeholder="Leave blank for catalog base price" className="input-sm w-full" />
          </div>
          <div>
            <label className="label-xs">Availability Schedule</label>
            <input value={assignAvailability} onChange={(e) => setAssignAvailability(e.target.value)}
              placeholder="Mon-Sat: 09:00 - 18:00" className="input-sm w-full" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => { setIsAssignOpen(false); setAssignError(null); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={assignMutation.isPending || !assignServiceId || !assignVendorId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition">
              {assignMutation.isPending ? 'Assigning…' : 'Assign Service'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
