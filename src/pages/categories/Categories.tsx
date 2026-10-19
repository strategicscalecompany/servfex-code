import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Layers,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Upload,
  X,
  FolderOpen,
  GripVertical,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { ServiceCategory, ServiceSubCategory } from '../../types';
import { Modal } from '../../components/common/Modal';
import { ConfirmModal } from '../../components/common/ConfirmModal';

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

// ─── Icon Upload Widget ───────────────────────────────────────────────────────

interface IconUploadProps {
  preview: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
}

const IconUpload: React.FC<IconUploadProps> = ({ preview, onChange, label = 'Icon (PNG)' }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const b64 = await toBase64(file);
      onChange(b64);
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
        {label}
      </label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="relative cursor-pointer border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 transition-colors bg-gray-50 hover:bg-indigo-50/30 flex items-center justify-center h-28 gap-4"
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="icon preview"
              className="h-16 w-16 object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="absolute top-1.5 right-1.5 p-0.5 bg-white rounded-full shadow hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-500">Click to change</span>
          </>
        ) : (
          <div className="text-center">
            <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
            <span className="text-xs text-gray-500">
              Drop PNG here or <span className="text-indigo-600 font-medium">browse</span>
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

// ─── Sub-Category Panel ───────────────────────────────────────────────────────

interface SubCategoryPanelProps {
  categoryId: string;
  categoryName: string;
}

const SubCategoryPanel: React.FC<SubCategoryPanelProps> = ({ categoryId, categoryName }) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingSubCat, setDeletingSubCat] = useState<ServiceSubCategory | null>(null);
  const [subName, setSubName] = useState('');
  const [subOrder, setSubOrder] = useState(0);

  const { data: subCategories = [], isLoading } = useQuery({
    queryKey: ['sub-categories', categoryId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ServiceSubCategory[] }>(
        `/admin/categories/${categoryId}/sub-categories`
      );
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/admin/categories/${categoryId}/sub-categories`, {
        name: subName.trim(),
        displayOrder: subOrder,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-categories', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsAdding(false);
      setSubName('');
      setSubOrder(0);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, displayOrder }: { id: string; name: string; displayOrder: number }) => {
      await apiClient.patch(`/admin/sub-categories/${id}`, { name, displayOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-categories', categoryId] });
      setEditingId(null);
      setSubName('');
      setSubOrder(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.delete(`/admin/sub-categories/${id}`, { data: { reason } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-categories', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeletingSubCat(null);
    },
  });

  const startEdit = (sc: ServiceSubCategory) => {
    setEditingId(sc.id);
    setSubName(sc.name);
    setSubOrder(sc.displayOrder);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSubName('');
    setSubOrder(0);
  };

  if (isLoading) {
    return (
      <div className="px-6 pb-4 pt-2 text-xs text-gray-400">Loading sub-categories…</div>
    );
  }

  return (
    <div className="border-t border-indigo-100 bg-indigo-50/30">
      <div className="px-6 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
          Sub-Categories in {categoryName}
        </span>
        {!isAdding && (
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setSubName(''); setSubOrder(subCategories.length); }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Sub-Category
          </button>
        )}
      </div>

      {/* Add Row */}
      {isAdding && (
        <div className="mx-6 mb-3 p-3 bg-white rounded-lg border border-indigo-200 flex items-center gap-2">
          <input
            autoFocus
            type="text"
            placeholder="Sub-category name (e.g. Large Appliances)"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <input
            type="number"
            title="Display order"
            value={subOrder}
            onChange={(e) => setSubOrder(parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-md text-center"
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!subName.trim() || createMutation.isPending}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {createMutation.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => { setIsAdding(false); setSubName(''); }}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* List */}
      {subCategories.length === 0 && !isAdding ? (
        <p className="px-6 pb-4 text-xs text-gray-400 italic">No sub-categories yet. Add one above.</p>
      ) : (
        <ul className="pb-3">
          {subCategories.map((sc) => (
            <li key={sc.id} className="px-6 py-2 flex items-center gap-3 hover:bg-indigo-50/60 transition group">
              <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0" />

              {editingId === sc.id ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <input
                    type="number"
                    value={subOrder}
                    onChange={(e) => setSubOrder(parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1 text-sm border border-gray-300 rounded-md text-center"
                  />
                  <button
                    onClick={() => updateMutation.mutate({ id: sc.id, name: subName.trim(), displayOrder: subOrder })}
                    disabled={!subName.trim() || updateMutation.isPending}
                    className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {updateMutation.isPending ? '…' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-gray-700">{sc.name}</span>
                  <span className="text-xs text-gray-400 font-mono">#{sc.displayOrder}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    sc.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {sc.isActive ? 'Active' : 'Off'}
                  </span>
                  <span className="text-xs text-gray-400">{sc._count?.services ?? 0} svc</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => startEdit(sc)}
                      className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingSubCat(sc)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!deletingSubCat}
        onClose={() => setDeletingSubCat(null)}
        onConfirm={(reason) => {
          if (deletingSubCat) deleteMutation.mutate({ id: deletingSubCat.id, reason });
        }}
        title="Delete Sub-Category"
        message={`Delete "${deletingSubCat?.name}"? Services in this sub-category will become uncategorised.`}
        confirmText="Delete"
        requireReason
        danger
      />
    </div>
  );
};

// ─── Main Categories Page ─────────────────────────────────────────────────────

export const Categories: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ServiceCategory | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIconBase64, setFormIconBase64] = useState<string | null>(null);
  // When editing keep existing URL to display as preview
  const [existingIconUrl, setExistingIconUrl] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: ServiceCategory[] }>('/admin/categories');
      return res.data.data;
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormDisplayOrder(0);
    setFormIsActive(true);
    setFormIconBase64(null);
    setExistingIconUrl(null);
  };

  const handleEditClick = (cat: ServiceCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setFormDisplayOrder(cat.displayOrder);
    setFormIsActive(cat.isActive);
    setFormIconBase64(null);
    setExistingIconUrl(cat.iconUrl || null);
  };

  const buildPayload = () => ({
    name: formName.trim(),
    slug: formSlug.trim() || autoSlug(formName),
    description: formDescription.trim() || undefined,
    displayOrder: formDisplayOrder,
    isActive: formIsActive,
    // Only send iconUrl if a new file was selected
    ...(formIconBase64 ? { iconUrl: formIconBase64 } : {}),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/admin/categories', buildPayload());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsAddModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/admin/categories/${id}`, buildPayload());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingCategory(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.delete(`/admin/categories/${id}`, { data: { reason } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeletingCategory(null);
    },
  });

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Icon preview = new b64 takes priority, else existing URL
  const iconPreview = formIconBase64 ?? existingIconUrl;

  // ─── Form JSX (shared between add + edit modals) ──────────────────────────
  const renderForm = (onSubmit: () => void, isPending: boolean, submitLabel: string) => (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="space-y-4"
    >
      <IconUpload
        preview={iconPreview}
        onChange={(b64) => {
          setFormIconBase64(b64);
          if (!b64) setExistingIconUrl(null);
        }}
        label="Category Icon (PNG recommended)"
      />

      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          Category Name *
        </label>
        <input
          type="text"
          required
          value={formName}
          onChange={(e) => {
            setFormName(e.target.value);
            setFormSlug(autoSlug(e.target.value));
          }}
          placeholder="e.g. AC & Appliance Repair"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          URL Slug *
        </label>
        <input
          type="text"
          required
          value={formSlug}
          onChange={(e) => setFormSlug(e.target.value)}
          placeholder="e.g. ac-appliance-repair"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Display Order
          </label>
          <input
            type="number"
            value={formDisplayOrder}
            onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          Description (optional)
        </label>
        <textarea
          rows={2}
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          placeholder="Brief summary of services in this category"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
        />
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => { setIsAddModalOpen(false); setEditingCategory(null); resetForm(); }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-60"
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Service Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage categories, sub-categories, and display priorities
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories by name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading categories…</div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FolderTree className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-700">No categories found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first category to start organizing services</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Sub-cats</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <React.Fragment key={category.id}>
                  <tr
                    className="border-b border-gray-100 hover:bg-gray-50/80 transition cursor-pointer"
                    onClick={() =>
                      setExpandedCategoryId(
                        expandedCategoryId === category.id ? null : category.id
                      )
                    }
                  >
                    {/* Expand toggle */}
                    <td className="px-6 py-4 text-gray-400">
                      {expandedCategoryId === category.id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </td>

                    {/* Order */}
                    <td className="px-6 py-4 font-mono font-medium text-gray-900">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded text-xs">
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        #{category.displayOrder}
                      </span>
                    </td>

                    {/* Category name + icon */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center overflow-hidden shrink-0 border border-indigo-100">
                          {category.iconUrl ? (
                            <img
                              src={category.iconUrl}
                              alt={category.name}
                              className="w-7 h-7 object-contain"
                            />
                          ) : (
                            <FolderOpen className="w-5 h-5 text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{category.name}</div>
                          {category.description && (
                            <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{category.slug}</td>

                    {/* Sub-cats count */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        <Layers className="w-3 h-3" />
                        {category._count?.subCategories ?? category.subCategories?.length ?? 0}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {category.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleEditClick(category)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(category)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title="Archive Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Sub-category expandable panel */}
                  {expandedCategoryId === category.id && (
                    <tr>
                      <td colSpan={7} className="p-0">
                        <SubCategoryPanel
                          categoryId={category.id}
                          categoryName={category.name}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); resetForm(); }}
        title="Add New Category"
      >
        {renderForm(
          () => createMutation.mutate(),
          createMutation.isPending,
          'Create Category'
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => { setEditingCategory(null); resetForm(); }}
        title={`Edit: ${editingCategory?.name ?? ''}`}
      >
        {renderForm(
          () => { if (editingCategory) updateMutation.mutate(editingCategory.id); },
          updateMutation.isPending,
          'Save Changes'
        )}
      </Modal>

      {/* Archive Confirm */}
      <ConfirmModal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={(reason) => {
          if (deletingCategory) deleteMutation.mutate({ id: deletingCategory.id, reason });
        }}
        title="Archive Category"
        message={`Archive "${deletingCategory?.name}"? This hides it from the customer app. Services remain untouched.`}
        confirmText="Archive Category"
        requireReason
        danger
      />
    </div>
  );
};
