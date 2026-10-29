import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import React, { useState, useEffect } from 'react';
import {
  Home,
  Wrench,
  Calendar,
  User,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle2,
  IndianRupee,
  Car,
  Shield,
  Headphones,
  Star,
  Clock,
  Sparkles,
  Fan,
  Zap,
  Paintbrush,
  Bug,
  Hammer,
  Refrigerator,
  ShoppingCart,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Smartphone,
  Eye,
  EyeOff,
  Sliders,
  Check,
  Pencil,
  RotateCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';


interface HomePreviewCategory {
  id: string;
  name: string;
  icon: any;
}

interface HomePreviewService {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  durationText: string;
  startingPrice: number;
  icon: any;
}

// ─── Promo Slide Interface ───────────────────────────────────────────────────
interface PromoSlideItem {
  id: string;
  tag: string;
  headline: string;
  subtext: string;
  accentColor: string;
  bgColor: string;
  isActive: boolean;
}

// ─── Section Configuration ───────────────────────────────────────────────────
interface SectionConfig {
  id: string;
  name: string;
  componentName: string;
  description: string;
  enabled: boolean;
}

interface HomeServiceSection {
  id: string;
  title: string;
  subtitle: string;
  serviceIds: string[];
  enabled: boolean;
}

const DEFAULT_SERVICE_SECTIONS: HomeServiceSection[] = [];

const isBlankOrDefaultSectionTitle = (title: string): boolean => {
  const normalized = title.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === 'popular services' ||
    normalized === 'services' ||
    /^service section\s*\d+$/.test(normalized)
  );
};

const mapHomeServiceSection = (section: any, index: number): HomeServiceSection => ({
  id: typeof section?.id === 'string' && section.id ? section.id : `HS-${index + 1}`,
  title: typeof section?.title === 'string' ? section.title : '',
  subtitle: typeof section?.subtitle === 'string' ? section.subtitle : '',
  serviceIds: Array.isArray(section?.serviceIds)
    ? section.serviceIds.filter((id: unknown) => typeof id === 'string')
    : [],
  enabled: section?.enabled !== false,
});

// Cycling search hints from Android ServFexSearchBar.kt
const SEARCH_HINTS = [
  'Sofa Cleaning',
  'AC Repair',
  'Plumbing',
  'Bathroom Cleaning',
  'Car Detailing',
  'Pest Control',
  'Electrical Work',
  'Home Shifting',
];

export const AppHome: React.FC = () => {
  const queryClient = useQueryClient();

  // ── Real Dynamic Queries from Backend ──
  const { data: homeLayoutData, isLoading: isLayoutLoading } = useQuery({
    queryKey: ['home-layout'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/home-layout');
      return res.data?.data || res.data;
    },
  });

  const { data: liveCategoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get('/catalog/categories');
      return res.data?.data?.categories || res.data?.categories || [];
    },
  });

  const { data: liveServicesData } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await apiClient.get('/catalog/services?limit=100');
      return res.data?.data?.services || res.data?.services || [];
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.put('/admin/home-layout', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-layout'] });
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 4000);
    },
    onError: (err: any) => {
      alert('Failed to publish home layout: ' + (err.response?.data?.message || err.message));
    },
  });

  // ── Header & Location State ──
  const [deliveringLocation, setDeliveringLocation] = useState('Jubilee Hills, Hyderabad');
  const [gpsVerified] = useState(true);
  const [showLocationPrompt] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [serviceSections, setServiceSections] = useState<HomeServiceSection[]>(DEFAULT_SERVICE_SECTIONS);
  const [sectionSearch, setSectionSearch] = useState<Record<string, string>>({});
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  // ── Search Hint Cycling (identical to ServFexSearchBar.kt) ──
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHintIndex((prev) => (prev + 1) % SEARCH_HINTS.length);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  const currentHint = SEARCH_HINTS[currentHintIndex] || 'AC Repair';

  // ── Promo Slides State (identical to HomeScreen.kt promoSlides) ──
  const [slides, setSlides] = useState<PromoSlideItem[]>([
    {
      id: 'SLIDE-1',
      tag: 'Limited Offer',
      headline: '25% off on\nyour first booking',
      subtext: 'Book Now →',
      accentColor: '#FFD166',
      bgColor: '#1A1A2E',
      isActive: true,
    },
    {
      id: 'SLIDE-2',
      tag: 'Home Cleaning',
      headline: 'Sparkling clean\nfrom ₹299',
      subtext: 'Explore →',
      accentColor: '#06D6A0',
      bgColor: '#0F3460',
      isActive: true,
    },
    {
      id: 'SLIDE-3',
      tag: 'AC Service',
      headline: 'Expert AC\nrepair & service',
      subtext: 'Book Now →',
      accentColor: '#90E0EF',
      bgColor: '#1B1B2F',
      isActive: true,
    },
  ]);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Sync loaded database home layout config into local editor state
  useEffect(() => {
    if (homeLayoutData) {
      if (Array.isArray(homeLayoutData.slides) && homeLayoutData.slides.length > 0) {
        setSlides(homeLayoutData.slides);
      }
      if (Array.isArray(homeLayoutData.sections) && homeLayoutData.sections.length > 0) {
        setSections((prev) =>
          prev.map((sec) => {
            const found = homeLayoutData.sections.find((s: any) => s.id === sec.id);
            return found ? { ...sec, enabled: found.enabled } : sec;
          })
        );
      }
      if (homeLayoutData.deliveringLocation) {
        setDeliveringLocation(homeLayoutData.deliveringLocation);
      }
      let nextSections: HomeServiceSection[] = [];
      if (Array.isArray(homeLayoutData.serviceSections) && homeLayoutData.serviceSections.length > 0) {
        nextSections = homeLayoutData.serviceSections.map(mapHomeServiceSection);
      } else if (Array.isArray(homeLayoutData.popularServiceIds) && homeLayoutData.popularServiceIds.length > 0) {
        nextSections = [
          mapHomeServiceSection(
            {
              id: 'HS-POPULAR',
              title:
                typeof homeLayoutData.popularTitle === 'string' &&
                !isBlankOrDefaultSectionTitle(homeLayoutData.popularTitle)
                  ? homeLayoutData.popularTitle
                  : '',
              subtitle: typeof homeLayoutData.popularSubtitle === 'string' ? homeLayoutData.popularSubtitle : '',
              serviceIds: homeLayoutData.popularServiceIds,
              enabled: true,
            },
            0
          ),
        ];
      }
      setServiceSections(nextSections);
      const draft = nextSections.find(
        (section) => isBlankOrDefaultSectionTitle(section.title) || section.serviceIds.length === 0
      );
      setEditingSectionId(draft?.id ?? null);
    }
  }, [homeLayoutData]);


  // Auto-advance promo carousel every 3.5s like Jetpack Compose LaunchedEffect
  useEffect(() => {
    const activeSlides = slides.filter((s) => s.isActive);
    if (activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % activeSlides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [slides]);

  // ── Categories State (exact 8 categories from ServFexCategoryCard.kt) ──
  const [selectedCategory, setSelectedCategory] = useState<string>('AC Repair');
  const DEFAULT_CATEGORIES: HomePreviewCategory[] = [
    { id: 'cat_ac', name: 'AC Repair', icon: Fan },
    { id: 'cat_cleaning', name: 'Home Cleaning', icon: Sparkles },
    { id: 'cat_electric', name: 'Electrician', icon: Zap },
    { id: 'cat_plumbing', name: 'Plumbing', icon: Wrench },
    { id: 'cat_appliance', name: 'Appliance', icon: Refrigerator },
    { id: 'cat_painting', name: 'Painting', icon: Paintbrush },
    { id: 'cat_pest', name: 'Pest Control', icon: Bug },
    { id: 'cat_carpenter', name: 'Carpenter', icon: Hammer },
  ];


  const categories = React.useMemo<HomePreviewCategory[]>(() => {
    if (liveCategoriesData && liveCategoriesData.length > 0) {
      const iconMap: Record<string, any> = {
        ac: Fan,
        clean: Sparkles,
        electric: Zap,
        plumb: Wrench,
        appliance: Refrigerator,
        paint: Paintbrush,
        pest: Bug,
        carpent: Hammer,
      };
      return liveCategoriesData.map((cat: any) => {
        const lower = (cat.name || '').toLowerCase();
        const matchedKey = Object.keys(iconMap).find((k) => lower.includes(k));
        return {
          id: cat.id,
          name: cat.name,
          icon: matchedKey ? iconMap[matchedKey] : Sparkles,
        };
      });
    }
    return DEFAULT_CATEGORIES;
  }, [liveCategoriesData]);

  const catalogServices = React.useMemo(() => (Array.isArray(liveServicesData) ? liveServicesData : []), [liveServicesData]);

  const mapServiceToPreview = (srv: any): HomePreviewService => ({
    id: srv.id,
    name: srv.name,
    rating: srv.rating || 4.8,
    reviewCount: srv.reviewCount || 120,
    durationText: srv.durationText || '60 mins',
    startingPrice: srv.startingPrice || srv.basePrice || 499,
    icon: Sparkles,
  });

  const resolveSectionServices = (ids: string[]): HomePreviewService[] => {
    if (ids.length === 0 || catalogServices.length === 0) return [];
    const byId = new Map(catalogServices.map((srv: any) => [srv.id, srv]));
    return ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map(mapServiceToPreview);
  };

  // ── Bottom Nav Tab State (exact 4 tabs matching ServFexNavTab in ServFexBottomNav.kt) ──
  const [selectedNavTab, setSelectedNavTab] = useState<'home' | 'services' | 'bookings' | 'profile'>('home');

  // ── Section Visibility Toggles (all 8 exact elements) ──
  const [sections, setSections] = useState<SectionConfig[]>([
    {
      id: 'SEC-HERO',
      name: 'Hero Header & GPS Bar',
      componentName: 'HeroHeader.kt',
      description: 'Dark gradient hero (#0F0F1A → #1C1C2E) with doorstep GPS status and refresh button',
      enabled: true,
    },
    {
      id: 'SEC-UC-BANNER',
      name: 'Urban Company Location Banner',
      componentName: 'UC Prompt Surface',
      description: 'Amber bordered banner (#232018) for setting area or granting doorstep GPS',
      enabled: true,
    },
    {
      id: 'SEC-SEARCH-BAR',
      name: 'Slim Search Bar with Cycling Hints',
      componentName: 'ServFexSearchBar.kt',
      description: '44dp slim white bar with animated text cycling 8 service keywords',
      enabled: true,
    },
    {
      id: 'SEC-PROMO-PAGER',
      name: 'Dynamic Promo Carousel',
      componentName: 'PromoBannerPager.kt',
      description: '140dp rounded-2xl cards with tag pills, bold headlines, and dot indicators',
      enabled: true,
    },
    {
      id: 'SEC-CATEGORIES',
      name: 'Categories LazyRow',
      componentName: 'ServFexCategoryCard.kt',
      description: 'Horizontal scrollable 88dp cards with 44dp icon boxes and active highlight',
      enabled: true,
    },
    {
      id: 'SEC-WHY-CHOOSE',
      name: 'Why Choose ServFex (5 Guarantees)',
      componentName: 'WhyChooseItem.kt',
      description: 'White container with 5 verified trust badges from strings.xml',
      enabled: true,
    },
    {
      id: 'SEC-BOTTOM-NAV',
      name: 'Customer App Bottom Navigation',
      componentName: 'ServFexBottomNav.kt',
      description: '64dp bottom bar with 4 tabs: Home, Services, Bookings, Profile',
      enabled: true,
    },
  ]);

  const isSectionEnabled = (id: string) => sections.find((s) => s.id === id)?.enabled ?? true;

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // ── Modal for Adding New Promo Slide ──
  const [isAddSlideOpen, setIsAddSlideOpen] = useState(false);
  const [newSlide, setNewSlide] = useState({
    tag: '',
    headline: '',
    subtext: 'Book Now →',
    accentColor: '#FFD166',
    bgColor: '#1A1A2E',
  });

  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleAddSlide = (e: React.FormEvent) => {
    e.preventDefault();
    const created: PromoSlideItem = {
      id: `SLIDE-${Date.now()}`,
      tag: newSlide.tag,
      headline: newSlide.headline,
      subtext: newSlide.subtext,
      accentColor: newSlide.accentColor,
      bgColor: newSlide.bgColor,
      isActive: true,
    };
    setSlides([...slides, created]);
    setIsAddSlideOpen(false);
    setNewSlide({
      tag: '',
      headline: '',
      subtext: 'Book Now →',
      accentColor: '#FFD166',
      bgColor: '#1A1A2E',
    });
  };

  const deleteSlide = (id: string) => {
    setSlides((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleSlide = (id: string) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const updateServiceSection = (id: string, patch: Partial<HomeServiceSection>) => {
    setServiceSections((prev) => prev.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  };

  const toggleSectionService = (sectionId: string, serviceId: string) => {
    setServiceSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const selected = section.serviceIds.includes(serviceId);
        return {
          ...section,
          serviceIds: selected
            ? section.serviceIds.filter((id) => id !== serviceId)
            : [...section.serviceIds, serviceId],
        };
      })
    );
  };

  const moveSectionService = (sectionId: string, serviceId: string, direction: -1 | 1) => {
    setServiceSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const index = section.serviceIds.indexOf(serviceId);
        if (index < 0) return section;
        const next = index + direction;
        if (next < 0 || next >= section.serviceIds.length) return section;
        const copy = [...section.serviceIds];
        const [item] = copy.splice(index, 1);
        copy.splice(next, 0, item);
        return { ...section, serviceIds: copy };
      })
    );
  };

  const moveServiceSection = (sectionId: string, direction: -1 | 1) => {
    setServiceSections((prev) => {
      const index = prev.findIndex((section) => section.id === sectionId);
      if (index < 0) return prev;
      const next = index + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  };

  const addServiceSection = () => {
    const id = `HS-${Date.now()}`;
    setServiceSections((prev) => [
      ...prev,
      {
        id,
        title: '',
        subtitle: '',
        serviceIds: [],
        enabled: true,
      },
    ]);
    setEditingSectionId(id);
    setSectionSearch((prev) => ({ ...prev, [id]: '' }));
  };

  const deleteServiceSection = (sectionId: string) => {
    setServiceSections((prev) => prev.filter((section) => section.id !== sectionId));
    setEditingSectionId((current) => (current === sectionId ? null : current));
  };

  const isSectionEditing = (section: HomeServiceSection) => editingSectionId === section.id;

  const canAddAnotherSection = !editingSectionId;

  const handlePublish = async () => {
    const firstEnabled = serviceSections.find((section) => section.enabled) || serviceSections[0];
    await publishMutation.mutateAsync({
      slides,
      sections,
      deliveringLocation,
      searchHints: SEARCH_HINTS,
      serviceSections,
      popularTitle: firstEnabled?.title || '',
      popularSubtitle: firstEnabled?.subtitle || '',
      popularServiceIds: firstEnabled?.serviceIds || [],
    });
  };

  const saveServiceSection = async (sectionId: string) => {
    const section = serviceSections.find((item) => item.id === sectionId);
    if (!section || isBlankOrDefaultSectionTitle(section.title) || section.serviceIds.length < 1) return;
    try {
      await handlePublish();
      setEditingSectionId(null);
      setSectionSearch((prev) => ({ ...prev, [sectionId]: '' }));
    } catch {
      // publishMutation.onError already surfaces the failure
    }
  };

  const activeSlides = slides.filter((s) => s.isActive);
  const currentSlide = activeSlides[activeSlideIndex] || activeSlides[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Smartphone className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Our App — Home Layout</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Frameless Mobile Screen
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pure frameless mobile screen preview matching the Customer App (<code className="font-mono text-slate-700">HomeScreen.kt</code>).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {publishSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Published to mobile app!
            </span>
          )}
          <button
            onClick={handlePublish}
            disabled={publishMutation.isPending}
            className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-sm transition inline-flex items-center gap-2"
          >
            {publishMutation.isPending ? (
              <RotateCw className="w-4 h-4 text-amber-400 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span>{publishMutation.isPending ? 'Publishing...' : 'Publish Home Layout'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls (Left 7 cols) & Frameless Mobile Screen (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Layout Customizer & Component Toggles (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Promo Banner Carousel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Promo Banner Carousel ({slides.length} Slides)</h3>
                <p className="text-xs text-slate-500">Directly mapped to <code className="font-mono text-slate-700">promoSlides</code> in HomeScreen.kt.</p>
              </div>
              <button
                onClick={() => setIsAddSlideOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Promo Slide</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                    slide.isActive ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: slide.bgColor }}
                    >
                      <span style={{ color: slide.accentColor }}>{idx + 1}</span>
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase"
                          style={{
                            backgroundColor: `${slide.accentColor}25`,
                            color: slide.accentColor,
                          }}
                        >
                          {slide.tag}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {slide.headline.replace('\n', ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">
                        Action: <strong className="text-slate-700">{slide.subtext}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                        activeSlideIndex === idx
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => toggleSlide(slide.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                        slide.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {slide.isActive ? 'Active' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => deleteSlide(slide.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Home service collections: title, description, services, hide/show */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Home Service Sections</h3>
                <p className="text-xs text-slate-500">
                  Type your own heading, tick every service this section should show, then tap Done. Home shows the first 4; extra services open on View more.
                </p>
              </div>
              <button
                type="button"
                onClick={addServiceSection}
                disabled={!canAddAnotherSection}
                className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:hover:bg-indigo-50 rounded-xl transition inline-flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-4">
              {serviceSections.map((section, sectionIndex) => {
                const searchQuery = (sectionSearch[section.id] || '').trim().toLowerCase();
                const editing = isSectionEditing(section);
                const selectedNames = section.serviceIds
                  .map((id) => catalogServices.find((item: any) => item.id === id)?.name)
                  .filter(Boolean);
                return (
                  <div
                    key={section.id}
                    className={`rounded-2xl border p-4 space-y-3 ${
                      section.enabled ? 'border-slate-200 bg-slate-50/40' : 'border-slate-200 bg-slate-100/70 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          Section {sectionIndex + 1}
                          {!section.enabled ? ' • Hidden' : editing ? ' • Editing' : ''}
                        </p>
                        {!editing && (
                          <>
                            <p className="text-sm font-bold text-slate-900 truncate pt-0.5">
                              {section.title || 'Untitled section'}
                            </p>
                            {section.subtitle.trim() && (
                              <p className="text-xs text-slate-500 truncate">{section.subtitle}</p>
                            )}
                            <p className="text-[11px] text-slate-500 pt-1">
                              {section.serviceIds.length} service{section.serviceIds.length === 1 ? '' : 's'}
                              {selectedNames.length > 0 ? ` · ${selectedNames.slice(0, 3).join(', ')}` : ''}
                              {selectedNames.length > 3 ? '…' : ''}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveServiceSection(section.id, -1)}
                          disabled={sectionIndex === 0}
                          className="p-1 rounded-lg text-slate-500 hover:bg-white disabled:opacity-30"
                          title="Move section up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveServiceSection(section.id, 1)}
                          disabled={sectionIndex === serviceSections.length - 1}
                          className="p-1 rounded-lg text-slate-500 hover:bg-white disabled:opacity-30"
                          title="Move section down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateServiceSection(section.id, { enabled: !section.enabled })}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 ${
                            section.enabled
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-slate-500 bg-white'
                          }`}
                          title={section.enabled ? 'Hide on app' : 'Show on app'}
                        >
                          {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {section.enabled ? 'Visible' : 'Hidden'}
                        </button>
                        {!editing && (
                          <button
                            type="button"
                            onClick={() => setEditingSectionId(section.id)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 inline-flex items-center gap-1"
                            title="Edit section"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteServiceSection(section.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
                          title="Delete section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {editing && (
                      <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Title</span>
                        <input
                          value={section.title}
                          onChange={(e) => updateServiceSection(section.id, { title: e.target.value })}
                          onFocus={(e) => {
                            if (isBlankOrDefaultSectionTitle(e.target.value)) e.target.select();
                          }}
                          placeholder="e.g. AC Repair & Service"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        {isBlankOrDefaultSectionTitle(section.title) && (
                          <p className="text-[11px] text-amber-600">
                            Replace this placeholder with the heading customers should see.
                          </p>
                        )}
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Description</span>
                        <input
                          value={section.subtitle}
                          onChange={(e) => updateServiceSection(section.id, { subtitle: e.target.value })}
                          placeholder="Optional — shown under the title"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </label>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        value={sectionSearch[section.id] || ''}
                        onChange={(e) =>
                          setSectionSearch((prev) => ({ ...prev, [section.id]: e.target.value }))
                        }
                        placeholder="Search services to add…"
                        className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                      {catalogServices
                        .filter((srv: any) => {
                          if (!searchQuery) return true;
                          return String(srv.name || '').toLowerCase().includes(searchQuery);
                        })
                        .map((srv: any) => {
                          const selected = section.serviceIds.includes(srv.id);
                          return (
                            <label
                              key={`${section.id}-${srv.id}`}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSectionService(section.id, srv.id)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 truncate">{srv.name}</p>
                                <p className="text-[11px] text-slate-500">
                                  Starting from ₹{srv.startingPrice || srv.basePrice || 0}
                                  {srv.durationText ? ` • ${srv.durationText}` : ''}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      {catalogServices.length === 0 && (
                        <p className="px-3 py-4 text-xs text-slate-500">No catalog services found yet.</p>
                      )}
                    </div>

                    {section.serviceIds.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                          Display order ({section.serviceIds.length}) · first 4 on Home
                        </p>
                        {section.serviceIds.map((id, index) => {
                          const srv = catalogServices.find((item: any) => item.id === id);
                          if (!srv) return null;
                          return (
                            <div key={`${section.id}-order-${id}`} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 bg-white">
                              <span className="text-sm font-semibold text-slate-900 truncate pr-3">
                                {index + 1}. {srv.name}
                                {index >= 4 ? ' · View more' : ''}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveSectionService(section.id, id, -1)}
                                  disabled={index === 0}
                                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                                  title="Move up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSectionService(section.id, id, 1)}
                                  disabled={index === section.serviceIds.length - 1}
                                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                                  title="Move down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <p className="text-[11px] text-slate-500">
                        {section.serviceIds.length === 0
                          ? 'Select as many services as you want. The editor stays open until you tap Done.'
                          : `${section.serviceIds.length} selected · first 4 appear on Home.`}
                      </p>
                      <button
                        type="button"
                        onClick={() => saveServiceSection(section.id)}
                        disabled={isBlankOrDefaultSectionTitle(section.title) || section.serviceIds.length < 1 || publishMutation.isPending}
                        className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 rounded-xl inline-flex items-center gap-1.5 shrink-0"
                      >
                        <Check className="w-4 h-4" />
                        {publishMutation.isPending ? 'Publishing…' : 'Done & Publish'}
                      </button>
                    </div>
                      </>
                    )}
                  </div>
                );
              })}
              {serviceSections.length === 0 && !isLayoutLoading && (
                <p className="text-xs text-slate-500">No sections yet. Add one to show services on Home.</p>
              )}
            </div>
          </div>

          {/* Section 4: Modular Sections Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Customer App Sections</h3>
              <p className="text-xs text-slate-500">
                Toggle visibility for each individual UI composable rendered inside <code className="font-mono text-slate-700">HomeScreen.kt</code>.
              </p>
            </div>

            <div className="space-y-2">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{sec.name}</span>
                        <code className="text-[10px] text-indigo-600 font-mono px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-100">
                          {sec.componentName}
                        </code>
                      </div>
                      <span className="text-[11px] text-slate-400 block line-clamp-1">{sec.description}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSection(sec.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
                      sec.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        sec.enabled ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: FRAMELESS PURE MOBILE SCREEN VIEW (5 cols, sticky, NO hardware bezel) */}
        <div className="lg:col-span-5 sticky top-6 flex flex-col items-center">
          {/* Header indicator above the screen */}
          <div className="w-[390px] flex items-center justify-between pb-2.5 px-2 text-xs">
            <span className="font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              Mobile Screen (390×844)
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Frameless View
            </span>
          </div>

          {/* Clean Frameless Mobile Screen: NO thick phone bezel, NO hardware notch, pure rounded UI container */}
          <div className="w-[390px] h-[calc(100vh-120px)] max-h-[820px] rounded-[32px] overflow-hidden shadow-2xl border border-slate-200/90 flex flex-col bg-[#F4F5F7] text-[#0A0A0A] relative select-none">
            
            {/* Native Edge-to-Edge Status Bar (rendered cleanly on dark hero gradient) */}
            <div className="bg-[#0F0F1A] px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-bold text-white shrink-0">
              <span>9:41</span>
              <div className="flex items-center gap-1.5 text-white/90">
                <span className="text-[9px] font-mono tracking-tighter">5G</span>
                {/* Wi-Fi Icon */}
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.67 0 6.99 1.48 9.4 3.88L12 18.88 2.6 11.38C5.01 8.98 8.33 7.5 12 7.5z" />
                </svg>
                {/* Battery Icon */}
                <div className="w-4 h-2 border border-white/80 rounded-xs flex items-center p-0.5">
                  <div className="w-full h-full bg-white rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Scrollable Mobile Screen Body (matching Android Column + verticalScroll) */}
            <div className="flex-1 overflow-y-auto space-y-0 text-[#0A0A0A] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              
              {/* 1. HERO HEADER: Dark Gradient (#0F0F1A to #1C1C2E) */}
              {isSectionEnabled('SEC-HERO') && (
                <div className="bg-gradient-to-b from-[#0F0F1A] to-[#1C1C2E] px-4 pt-2 pb-5 text-white space-y-3">
                  
                  {/* Location and Refresh Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer py-1 px-0.5 rounded-lg hover:bg-white/5 transition">
                      <MapPin
                        className={`w-[18px] h-[18px] shrink-0 ${
                          gpsVerified ? 'text-[#06D6A0]' : 'text-[#FFD166]'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-medium tracking-[1px] text-white/55 uppercase">
                            DELIVERING TO
                          </span>
                          <span
                            className={`px-1.5 py-[1px] rounded text-[9px] font-bold ${
                              gpsVerified
                                ? 'bg-[#06D6A0]/20 text-[#06D6A0]'
                                : 'bg-[#FFD166]/20 text-[#FFD166]'
                            }`}
                          >
                            {isLocating ? 'LOCATING...' : gpsVerified ? 'GPS VERIFIED' : 'TAP TO SET'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-[13px] font-semibold text-white truncate max-w-[210px] leading-tight">
                            {deliveringLocation}
                          </span>
                          <ChevronDown className="w-[18px] h-[18px] text-white/85 shrink-0" />
                        </div>
                      </div>
                    </div>

                    {/* Refresh Button (size 36dp, icon 20dp) */}
                    <button
                      onClick={() => {
                        setIsLocating(true);
                        setTimeout(() => setIsLocating(false), 800);
                      }}
                      title="Refresh catalog"
                      className="w-9 h-9 rounded-full bg-transparent hover:bg-white/10 flex items-center justify-center transition shrink-0"
                    >
                      <RefreshCw className={`w-5 h-5 text-white/85 ${isLocating ? 'animate-spin text-[#06D6A0]' : ''}`} />
                    </button>
                  </div>

                  {/* 2. URBAN COMPANY STYLE LOCATION PROMPT BANNER */}
                  {isSectionEnabled('SEC-UC-BANNER') && (showLocationPrompt || !gpsVerified) && (
                    <div className="p-2.5 rounded-[10px] bg-[#232018] border border-[#FFD166]/45 flex items-center justify-between gap-2.5 shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MapPin className="w-[22px] h-[22px] text-[#FFD166] shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[12px] font-bold text-[#FFD166] block leading-tight">
                            Set your delivery location
                          </span>
                          <span className="text-[11px] text-white/80 block leading-tight pt-0.5 truncate">
                            Select your area or allow GPS to see services & technicians available near you.
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1.5 rounded-[6px] text-[11px] font-bold bg-[#FFD166] text-[#1A1A2E] shrink-0">
                        Select
                      </span>
                    </div>
                  )}

                  {/* 3. SLIM SEARCH BAR (44dp high, rounded-xl, ServFexSearchBar.kt) */}
                  {isSectionEnabled('SEC-SEARCH-BAR') && (
                    <div className="h-11 px-3 bg-white rounded-xl flex items-center gap-2 border border-[#E5E7EB] shadow-xs cursor-pointer">
                      <Search className="w-[18px] h-[18px] text-[#4B5563] shrink-0" />
                      <span className="text-[14px] text-[#4B5563] truncate flex-1 font-normal">
                        Search for '{currentHint}'
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  )}

                  {/* 4. AUTO-SCROLLING PROMO BANNER PAGER (HomeScreen.kt PromoBannerPager) */}
                  {isSectionEnabled('SEC-PROMO-PAGER') && currentSlide && (
                    <div className="space-y-2 pt-1">
                      {/* 140dp Promo Slide Card */}
                      <div
                        className="h-[140px] rounded-2xl p-4 text-white relative overflow-hidden flex items-center justify-between shadow-md cursor-pointer"
                        style={{ backgroundColor: currentSlide.bgColor }}
                      >
                        {/* Decorative Circles from Jetpack Compose Canvas */}
                        <div
                          className="absolute -right-6 -top-6 w-36 h-36 rounded-full pointer-events-none"
                          style={{
                            backgroundColor: `${currentSlide.accentColor}1F`, // ~12% alpha
                          }}
                        />
                        <div
                          className="absolute right-6 top-3 w-24 h-24 rounded-full pointer-events-none"
                          style={{
                            backgroundColor: `${currentSlide.accentColor}14`, // ~8% alpha
                          }}
                        />

                        {/* Silhouette Gradient Overlay on Right */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-[110px] pointer-events-none"
                          style={{
                            background: `linear-gradient(to right, ${currentSlide.bgColor}, ${currentSlide.accentColor}2E)`,
                          }}
                        />

                        {/* Text content on left (62% width) */}
                        <div className="relative z-10 max-w-[62%] space-y-1.5">
                          {/* Tag pill */}
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase"
                            style={{
                              backgroundColor: `${currentSlide.accentColor}33`,
                              color: currentSlide.accentColor,
                            }}
                          >
                            {currentSlide.tag}
                          </span>

                          {/* Headline: 17sp bold, line-height 23sp */}
                          <h4 className="text-[17px] font-bold text-white leading-[23px] whitespace-pre-line">
                            {currentSlide.headline}
                          </h4>

                          {/* Subtext with Arrow */}
                          <div className="flex items-center gap-1 pt-0.5">
                            <span
                              className="text-[12px] font-semibold"
                              style={{ color: currentSlide.accentColor }}
                            >
                              {currentSlide.subtext}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dot Indicators */}
                      <div className="flex items-center justify-center gap-1.5 pt-0.5">
                        {activeSlides.map((_, idx) => (
                          <span
                            key={idx}
                            onClick={() => setActiveSlideIndex(idx)}
                            className={`h-1.5 rounded-full cursor-pointer transition-all ${
                              activeSlideIndex === idx
                                ? 'w-5 bg-[#FFD166]'
                                : 'w-1.5 bg-white/35'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Spacing between Hero and Categories: 16dp */}
              <div className="h-4" />

              {/* 5. CATEGORIES SECTION (LazyRow with 88dp wide cards) */}
              {isSectionEnabled('SEC-CATEGORIES') && (
                <div className="space-y-3">
                  <h2 className="text-[20px] font-semibold text-[#0A0A0A] px-4 leading-tight">
                    Categories
                  </h2>

                  {/* Horizontal Scroll Row (LazyRow) */}
                  <div className="flex items-center gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
                    {categories.map((cat: HomePreviewCategory) => {
                      const IconComponent = cat.icon;
                      const isSelected = selectedCategory === cat.name;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.name)}
                          className={`w-[88px] shrink-0 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition border shadow-xs ${
                            isSelected
                              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                              : 'bg-white text-[#0A0A0A] border-[#E5E7EB] hover:border-slate-300'
                          }`}
                        >
                          {/* 44x44dp Icon Container */}
                          <div
                            className={`w-11 h-11 rounded-lg flex items-center justify-center mb-2 transition ${
                              isSelected ? 'bg-[#0A0A0A]' : 'bg-[#F4F5F7]'
                            }`}
                          >
                            <IconComponent
                              className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-[#0A0A0A]'}`}
                            />
                          </div>

                          {/* Label */}
                          <span
                            className={`text-[12px] font-medium text-center truncate w-full ${
                              isSelected ? 'text-white' : 'text-[#0A0A0A]'
                            }`}
                          >
                            {cat.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Spacing: 16dp */}
              <div className="h-4" />

              {/* 6. ADMIN-MANAGED SERVICE SECTIONS */}
              {serviceSections
                .filter((section) => section.enabled)
                .map((section) => {
                  const sectionServices = resolveSectionServices(section.serviceIds);
                  const previewServices = sectionServices.slice(0, 4);
                  const hasMore = sectionServices.length > 4;
                  return (
                    <div key={`preview-${section.id}`} className="px-4 space-y-3 pb-4">
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <h2 className="text-[20px] font-semibold text-[#0A0A0A] leading-tight">
                            {section.title || 'Services'}
                          </h2>
                          {section.subtitle.trim() && (
                            <p className="text-[14px] text-[#4B5563] pt-0.5 leading-snug">
                              {section.subtitle}
                            </p>
                          )}
                        </div>
                        {hasMore && (
                          <span className="text-[12px] font-medium text-[#0A0A0A] shrink-0">
                            View more
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        {previewServices.length === 0 && (
                          <p className="text-[12px] text-[#6B7280] py-2">No services selected yet.</p>
                        )}
                        {previewServices.map((service: HomePreviewService) => {
                          const IconComponent = service.icon;
                          return (
                            <div
                              key={`${section.id}-${service.id}`}
                              className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-[60px] h-[60px] rounded-xl bg-[#F4F5F7] flex items-center justify-center shrink-0">
                                  <IconComponent className="w-8 h-8 text-[#0A0A0A]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-[16px] font-semibold text-[#0A0A0A] truncate leading-tight">
                                    {service.name}
                                  </h3>
                                  <div className="flex items-center gap-2 pt-1 text-[12px]">
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                                      <span className="font-semibold text-[#0A0A0A]">
                                        {service.rating.toFixed(1)}
                                      </span>
                                      <span className="text-[#4B5563]">({service.reviewCount})</span>
                                    </div>
                                    <span className="text-[#4B5563]">•</span>
                                    <div className="flex items-center gap-1 text-[#4B5563]">
                                      <Clock className="w-3 h-3" />
                                      <span>{service.durationText}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-[14px] text-[#4B5563]">Starting from</span>
                                  <span className="text-[16px] font-bold text-[#0A0A0A]">
                                    ₹{service.startingPrice}
                                  </span>
                                </div>
                                <button className="px-4 py-2 rounded-xl text-[14px] font-semibold text-white bg-[#0A0A0A]">
                                  Book
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {/* Spacing: 16dp */}
              <div className="h-4" />

              {/* 7. WHY CHOOSE SERVFEX SECTION (HomeScreen.kt WhyChooseItem) */}
              {isSectionEnabled('SEC-WHY-CHOOSE') && (
                <div className="bg-white p-6 space-y-4 border-t border-[#E5E7EB]">
                  <h2 className="text-[24px] font-bold text-[#0A0A0A] leading-tight">
                    Why Choose ServFex?
                  </h2>

                  <div className="space-y-4">
                    {/* Item 1: Verified Professionals */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F4F5F7] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-[22px] h-[22px] text-[#0A0A0A]" />
                      </div>
                      <div>
                        <h4 className="text-[16px] font-semibold text-[#0A0A0A] leading-tight">
                          Verified Professionals
                        </h4>
                        <p className="text-[14px] text-[#4B5563] leading-snug pt-0.5">
                          Every expert undergoes strict identity verification and background vetting.
                        </p>
                      </div>
                    </div>

                    {/* Item 2: Transparent Pricing */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F4F5F7] flex items-center justify-center shrink-0 mt-0.5">
                        <IndianRupee className="w-[22px] h-[22px] text-[#0A0A0A]" />
                      </div>
                      <div>
                        <h4 className="text-[16px] font-semibold text-[#0A0A0A] leading-tight">
                          Transparent Pricing
                        </h4>
                        <p className="text-[14px] text-[#4B5563] leading-snug pt-0.5">
                          Standard rates with zero hidden charges. Pay after job satisfaction.
                        </p>
                      </div>
                    </div>

                    {/* Item 3: Live Tracking */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F4F5F7] flex items-center justify-center shrink-0 mt-0.5">
                        <Car className="w-[22px] h-[22px] text-[#0A0A0A]" />
                      </div>
                      <div>
                        <h4 className="text-[16px] font-semibold text-[#0A0A0A] leading-tight">
                          Live Tracking
                        </h4>
                        <p className="text-[14px] text-[#4B5563] leading-snug pt-0.5">
                          Track your specialist live on the map from dispatch to your door.
                        </p>
                      </div>
                    </div>

                    {/* Item 4: Secure Booking */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F4F5F7] flex items-center justify-center shrink-0 mt-0.5">
                        <Shield className="w-[22px] h-[22px] text-[#0A0A0A]" />
                      </div>
                      <div>
                        <h4 className="text-[16px] font-semibold text-[#0A0A0A] leading-tight">
                          Secure Booking
                        </h4>
                        <p className="text-[14px] text-[#4B5563] leading-snug pt-0.5">
                          Encrypted payments and contactless QR-based arrival verification.
                        </p>
                      </div>
                    </div>

                    {/* Item 5: Dedicated Support */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F4F5F7] flex items-center justify-center shrink-0 mt-0.5">
                        <Headphones className="w-[22px] h-[22px] text-[#0A0A0A]" />
                      </div>
                      <div>
                        <h4 className="text-[16px] font-semibold text-[#0A0A0A] leading-tight">
                          Dedicated Support
                        </h4>
                        <p className="text-[14px] text-[#4B5563] leading-snug pt-0.5">
                          24/7 in-app assistance for rescheduling, queries, and refunds.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Space so the last section clears the floating nav */}
              <div className="h-24" />
            </div>

            {/* Floating pill bottom nav */}
            {isSectionEnabled('SEC-BOTTOM-NAV') && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center px-5 pointer-events-none">
                <div className="pointer-events-auto bg-white rounded-full shadow-[0_12px_32px_rgba(0,0,0,0.18)] px-2 py-1.5 flex items-center gap-1">
                  {[
                    { id: 'home', label: 'Home', Icon: Home },
                    { id: 'services', label: 'Cart', Icon: ShoppingCart },
                    { id: 'bookings', label: 'Bookings', Icon: Calendar },
                    { id: 'profile', label: 'Profile', Icon: User },
                  ].map((tab) => {
                    const active = selectedNavTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedNavTab(tab.id as typeof selectedNavTab)}
                        className={`min-w-[64px] flex flex-col items-center justify-center rounded-[28px] px-3.5 py-2 transition ${
                          active ? 'bg-[#E8EAED] text-[#0A0A0A]' : 'text-[#5F6368]'
                        }`}
                      >
                        <tab.Icon className={`w-[22px] h-[22px] ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                        <span className={`text-[11px] pt-0.5 ${active ? 'font-semibold' : 'font-medium'}`}>
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Promo Slide Modal */}
      <Modal isOpen={isAddSlideOpen} onClose={() => setIsAddSlideOpen(false)} title="Create Promotional Banner Slide" maxWidth="md">
        <form onSubmit={handleAddSlide} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Tag Pill Label
            </label>
            <input
              type="text"
              required
              value={newSlide.tag}
              onChange={(e) => setNewSlide({ ...newSlide, tag: e.target.value })}
              placeholder="e.g. Festival Special or Limited Offer"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Headline (Supports multi-line with \n)
            </label>
            <textarea
              required
              rows={2}
              value={newSlide.headline}
              onChange={(e) => setNewSlide({ ...newSlide, headline: e.target.value })}
              placeholder={'e.g. 30% off on\ndeep sanitization'}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Subtext Call to Action
              </label>
              <input
                type="text"
                required
                value={newSlide.subtext}
                onChange={(e) => setNewSlide({ ...newSlide, subtext: e.target.value })}
                placeholder="e.g. Book Now →"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Accent Color
              </label>
              <select
                value={newSlide.accentColor}
                onChange={(e) => setNewSlide({ ...newSlide, accentColor: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900 bg-white"
              >
                <option value="#FFD166">Gold (#FFD166)</option>
                <option value="#06D6A0">Emerald (#06D6A0)</option>
                <option value="#90E0EF">Sky Blue (#90E0EF)</option>
                <option value="#FF6B6B">Coral (#FF6B6B)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddSlideOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
            >
              Add to Carousel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
