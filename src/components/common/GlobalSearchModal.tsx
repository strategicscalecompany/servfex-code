import React, { useState, useEffect } from 'react';
import { Search, X, User, Briefcase, Calendar, ShieldCheck, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/admin/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data?.success && res.data?.data) {
          setResults(res.data.data.results);
        }
      } catch {
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24">
        <div
          className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers, vendors, employees, bookings (#SFX-...), services..."
              className="w-full text-base text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
            />
            {isLoading && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results Dropdown */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {!results && !isLoading && (
              <p className="text-center text-xs text-slate-400 py-8">
                Type at least 2 characters to search across the entire ServFex platform.
              </p>
            )}

            {results && (
              <>
                {/* Bookings */}
                {results.bookings?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Bookings
                    </h4>
                    <div className="space-y-1">
                      {results.bookings.map((b: any) => (
                        <div
                          key={b.id}
                          onClick={() => handleSelect('/bookings')}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-200"
                        >
                          <div>
                            <span className="font-bold text-sm text-indigo-600">{b.bookingNumber}</span>
                            <span className="ml-2 text-xs text-slate-600">{b.service?.name}</span>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {b.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customers */}
                {results.customers?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Customers
                    </h4>
                    <div className="space-y-1">
                      {results.customers.map((c: any) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelect('/customers')}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-200"
                        >
                          <div>
                            <span className="font-semibold text-sm text-slate-900">{c.name}</span>
                            <span className="ml-2 text-xs text-slate-500">{c.email}</span>
                          </div>
                          <span className="text-xs text-slate-500">{c.phone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vendors */}
                {results.vendors?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> Vendors
                    </h4>
                    <div className="space-y-1">
                      {results.vendors.map((v: any) => (
                        <div
                          key={v.id}
                          onClick={() => handleSelect('/vendors')}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-200"
                        >
                          <div>
                            <span className="font-bold text-sm text-slate-900">{v.companyName}</span>
                            <span className="ml-2 text-xs text-slate-500">{v.location}</span>
                          </div>
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                            KYC: {v.kycStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services */}
                {results.services?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Services
                    </h4>
                    <div className="space-y-1">
                      {results.services.map((s: any) => (
                        <div
                          key={s.id}
                          onClick={() => handleSelect('/services')}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-200"
                        >
                          <span className="font-semibold text-sm text-slate-900">{s.name}</span>
                          <span className="text-xs font-bold text-slate-600">₹{s.startingPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
