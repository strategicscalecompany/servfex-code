import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tags as TagsIcon, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../../api/client';

type Category = { id: string; name: string };
type TagRow = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  description?: string | null;
  isActive: boolean;
  categories: Category[];
};

export const TagsPage: React.FC = () => {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: TagRow[] }>('/admin/tags');
      return res.data.data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-for-tags'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Category[] }>('/admin/categories');
      return res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/admin/tags', {
        name,
        description: description || undefined,
        categoryIds: selectedCategoryIds,
      });
    },
    onSuccess: () => {
      setName('');
      setDescription('');
      setSelectedCategoryIds([]);
      void qc.invalidateQueries({ queryKey: ['admin-tags'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/tags/${id}`);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-tags'] }),
  });

  const canCreate = name.trim().length >= 2 && selectedCategoryIds.length > 0;

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) || id;
  }, [categories]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TagsIcon className="w-6 h-6 text-indigo-600" />
          Specialist Tags
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Admin-created tags lock professionals to specific categories (e.g. Electrician → Book Inspection).
          HOM flexible tags are managed in the hub portal.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create specialist tag
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm space-y-1">
            <span className="text-slate-600">Name</span>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Electrician"
            />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-slate-600">Description</span>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Inspection only"
            />
          </label>
        </div>
        <div>
          <p className="text-sm text-slate-600 mb-2">Linked categories</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = selectedCategoryIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setSelectedCategoryIds((prev) =>
                      on ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    on
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          disabled={!canCreate || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
        >
          {createMutation.isPending ? 'Creating…' : 'Create tag'}
        </button>
        {createMutation.isError && (
          <p className="text-sm text-red-600">Failed to create tag. Check the name is unique.</p>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 font-semibold text-slate-800">
          Existing specialist tags
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-slate-500">Loading…</p>
        ) : tags.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No specialist tags yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tags.map((tag) => (
              <li key={tag.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{tag.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(tag.categories || [])
                      .map((c) => c.name || categoryName(c.id))
                      .join(', ') || 'No categories'}
                  </p>
                  {!tag.isActive && (
                    <span className="text-xs text-amber-600 font-medium">Inactive</span>
                  )}
                </div>
                {tag.isActive && (
                  <button
                    type="button"
                    onClick={() => deactivateMutation.mutate(tag.id)}
                    className="text-slate-400 hover:text-red-600 p-2"
                    title="Deactivate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TagsPage;
