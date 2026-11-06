import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, Search, Users, Layers, IndianRupee } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Modal } from '../common/Modal';

export type AssignableService = {
  id: string;
  name: string;
  startingPrice?: number | string | null;
  category?: { name?: string | null } | null;
};

export type AssignablePartner = {
  id: string;
  companyName?: string | null;
  location?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  services: AssignableService[];
  partners: AssignablePartner[];
  /** Pre-check these service IDs when the modal opens. */
  preselectedServiceIds?: string[];
  /** Pre-check these partner IDs when the modal opens. */
  preselectedPartnerIds?: string[];
  onAssigned?: () => void;
};

const EMPTY_IDS: string[] = [];

const basePriceOf = (service?: AssignableService | null): string => {
  const price = Number(service?.startingPrice);
  return Number.isFinite(price) && price > 0 ? String(price) : '';
};

export const AssignServicesToPartnersModal: React.FC<Props> = ({
  isOpen,
  onClose,
  services,
  partners,
  preselectedServiceIds = EMPTY_IDS,
  preselectedPartnerIds = EMPTY_IDS,
  onAssigned,
}) => {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [priceByServiceId, setPriceByServiceId] = useState<Record<string, string>>({});
  const [serviceQuery, setServiceQuery] = useState('');
  const [partnerQuery, setPartnerQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const wasOpenRef = useRef(false);
  const servicesRef = useRef(services);
  const preselectedServiceIdsRef = useRef(preselectedServiceIds);
  const preselectedPartnerIdsRef = useRef(preselectedPartnerIds);

  servicesRef.current = services;
  preselectedServiceIdsRef.current = preselectedServiceIds;
  preselectedPartnerIdsRef.current = preselectedPartnerIds;

  // Initialize selection only when the modal transitions closed → open.
  // Avoid depending on array props (new references every parent render).
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    const catalog = servicesRef.current;
    const initialIds = [...new Set((preselectedServiceIdsRef.current || EMPTY_IDS).filter(Boolean))];
    const initialPartnerIds = [...new Set((preselectedPartnerIdsRef.current || EMPTY_IDS).filter(Boolean))];
    const nextPrices: Record<string, string> = {};
    for (const id of initialIds) {
      nextPrices[id] = basePriceOf(catalog.find((s) => s.id === id));
    }

    setSelectedServiceIds(initialIds);
    setSelectedPartnerIds(initialPartnerIds);
    setPriceByServiceId(nextPrices);
    setServiceQuery('');
    setPartnerQuery('');
    setError(null);
  }, [isOpen]);

  // If catalog arrives after open, fill any missing base prices once.
  useEffect(() => {
    if (!isOpen || selectedServiceIds.length === 0 || services.length === 0) return;
    setPriceByServiceId((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of selectedServiceIds) {
        if (!next[id]) {
          const filled = basePriceOf(services.find((s) => s.id === id));
          if (filled) {
            next[id] = filled;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [isOpen, selectedServiceIds, services]);

  const filteredServices = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => {
      const hay = `${s.name} ${s.category?.name || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [services, serviceQuery]);

  const filteredPartners = useMemo(() => {
    const q = partnerQuery.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) => {
      const hay = `${p.companyName || ''} ${p.location || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [partners, partnerQuery]);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );

  const selectedPartners = useMemo(
    () => partners.filter((p) => selectedPartnerIds.includes(p.id)),
    [partners, selectedPartnerIds]
  );

  const assignmentCount = selectedServiceIds.length * selectedPartnerIds.length;

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        setPriceByServiceId((prices) => {
          const next = { ...prices };
          delete next[serviceId];
          return next;
        });
        return prev.filter((id) => id !== serviceId);
      }
      setPriceByServiceId((prices) => ({
        ...prices,
        [serviceId]: prices[serviceId] ?? basePriceOf(services.find((s) => s.id === serviceId)),
      }));
      return [...prev, serviceId];
    });
  };

  const togglePartner = (partnerId: string) => {
    setSelectedPartnerIds((prev) =>
      prev.includes(partnerId) ? prev.filter((id) => id !== partnerId) : [...prev, partnerId]
    );
  };

  const selectAllFilteredServices = () => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      const nextPrices = { ...priceByServiceId };
      for (const s of filteredServices) {
        next.add(s.id);
        if (!nextPrices[s.id]) nextPrices[s.id] = basePriceOf(s);
      }
      setPriceByServiceId(nextPrices);
      return [...next];
    });
  };

  const clearServices = () => {
    setSelectedServiceIds([]);
    setPriceByServiceId({});
  };

  const selectAllFilteredPartners = () => {
    setSelectedPartnerIds((prev) => {
      const next = new Set(prev);
      for (const p of filteredPartners) next.add(p.id);
      return [...next];
    });
  };

  const assignMutation = useMutation({
    mutationFn: async () => {
      const tasks: Promise<unknown>[] = [];
      for (const partnerId of selectedPartnerIds) {
        for (const serviceId of selectedServiceIds) {
          const raw = priceByServiceId[serviceId];
          const parsed = raw != null && String(raw).trim() !== '' ? Number(raw) : NaN;
          const catalogBase = Number(services.find((s) => s.id === serviceId)?.startingPrice);
          // Keep live catalog pricing unless admin sets a true hub-specific override.
          const isHubOverride =
            Number.isFinite(parsed) &&
            Number.isFinite(catalogBase) &&
            Math.abs(parsed - catalogBase) > 0.009;
          tasks.push(
            apiClient.post(`/admin/vendors/${partnerId}/services`, {
              serviceId,
              customPrice: isHubOverride ? parsed : null,
              isActive: true,
            })
          );
        }
      }
      const results = await Promise.allSettled(tasks);
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        throw new Error(`${failed} of ${results.length} assignments failed. Refresh and retry the ones that are missing.`);
      }
      return results.length;
    },
    onSuccess: (count) => {
      onAssigned?.();
      onClose();
      setError(null);
      // keep a soft breadcrumb in case parent wants to toast later
      void count;
    },
    onError: (err: any) => {
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to assign services'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServiceIds.length === 0) {
      setError('Select at least one service.');
      return;
    }
    if (selectedPartnerIds.length === 0) {
      setError('Select at least one partner.');
      return;
    }
    for (const service of selectedServices) {
      const raw = priceByServiceId[service.id];
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setError(`Enter a valid price for "${service.name}".`);
        return;
      }
    }
    setError(null);
    assignMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Services to Partners"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-slate-500 -mt-1">
          Pick one or more services, set each price, then choose the partners who should offer them.
        </p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        {/* 1. Services */}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              1. Services *
              <span className="ml-1 font-semibold text-indigo-600 normal-case tracking-normal">
                ({selectedServiceIds.length} selected)
              </span>
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button type="button" onClick={selectAllFilteredServices} className="text-indigo-600 hover:underline font-semibold">
                Select shown
              </button>
              <span className="text-slate-300">|</span>
              <button type="button" onClick={clearServices} className="text-slate-500 hover:underline font-semibold">
                Clear
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
              placeholder="Search services or categories…"
              className="input-sm w-full pl-8"
            />
          </div>

          <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
            {filteredServices.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-slate-400">No services match your search.</div>
            ) : (
              filteredServices.map((service) => {
                const checked = selectedServiceIds.includes(service.id);
                return (
                  <label
                    key={service.id}
                    className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-slate-50 ${
                      checked ? 'bg-indigo-50/60' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(service.id)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 leading-snug">
                        {service.name}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        {service.category?.name ? `${service.category.name} · ` : ''}
                        Base ₹{Number(service.startingPrice || 0).toLocaleString('en-IN')}
                      </span>
                    </span>
                    {checked && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />}
                  </label>
                );
              })
            )}
          </div>
        </section>

        {/* 2. Prices for selected services */}
        <section className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-indigo-600" />
            2. Prices for selected services
          </label>

          {selectedServices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-400 text-center">
              Select services above to set or keep their prices.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span>Service</span>
                <span>Price (₹)</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
                {selectedServices.map((service) => (
                  <div
                    key={service.id}
                    className="grid grid-cols-[minmax(0,1fr)_120px] gap-2 items-center px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{service.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Catalog base ₹{Number(service.startingPrice || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceByServiceId[service.id] ?? ''}
                      onChange={(e) =>
                        setPriceByServiceId((prev) => ({
                          ...prev,
                          [service.id]: e.target.value,
                        }))
                      }
                      className="input-sm w-full text-right font-semibold"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            Prices prefill from each service&apos;s starting price. Edit only the ones that need a partner-specific amount.
          </p>
        </section>

        {/* 3. Partners */}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              3. Partners *
              <span className="ml-1 font-semibold text-indigo-600 normal-case tracking-normal">
                ({selectedPartnerIds.length} selected)
              </span>
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button type="button" onClick={selectAllFilteredPartners} className="text-indigo-600 hover:underline font-semibold">
                Select shown
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setSelectedPartnerIds([])}
                className="text-slate-500 hover:underline font-semibold"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={partnerQuery}
              onChange={(e) => setPartnerQuery(e.target.value)}
              placeholder="Search partners or locations…"
              className="input-sm w-full pl-8"
            />
          </div>

          <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
            {filteredPartners.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-slate-400">No partners match your search.</div>
            ) : (
              filteredPartners.map((partner) => {
                const checked = selectedPartnerIds.includes(partner.id);
                return (
                  <label
                    key={partner.id}
                    className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-slate-50 ${
                      checked ? 'bg-indigo-50/60' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePartner(partner.id)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 leading-snug">
                        {partner.companyName || 'Partner'}
                      </span>
                      {partner.location && (
                        <span className="block text-[11px] text-slate-500 mt-0.5 truncate">
                          {partner.location}
                        </span>
                      )}
                    </span>
                    {checked && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />}
                  </label>
                );
              })
            )}
          </div>
        </section>

        {/* Summary */}
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-3 py-2.5 text-xs text-indigo-900">
          {assignmentCount > 0 ? (
            <>
              Ready to create <span className="font-bold">{assignmentCount}</span> assignment
              {assignmentCount === 1 ? '' : 's'}:{' '}
              <span className="font-bold">{selectedServices.length}</span> service
              {selectedServices.length === 1 ? '' : 's'} ×{' '}
              <span className="font-bold">{selectedPartners.length}</span> partner
              {selectedPartners.length === 1 ? '' : 's'}.
            </>
          ) : (
            <>Select at least one service and one partner to continue.</>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={assignMutation.isPending || assignmentCount === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 transition"
          >
            {assignMutation.isPending
              ? `Assigning ${assignmentCount}…`
              : assignmentCount > 0
                ? `Assign ${assignmentCount} link${assignmentCount === 1 ? '' : 's'}`
                : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
