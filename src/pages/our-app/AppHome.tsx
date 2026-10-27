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
  Plus,
  Trash2,
  Smartphone,
  Eye,
  Sliders,
  Check,
  RotateCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

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
  // ── Header & Location State ──
  const [deliveringLocation, setDeliveringLocation] = useState('Jubilee Hills, Hyderabad');
  const [gpsVerified, setGpsVerified] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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
  const categories = [
    { id: 'cat_ac', name: 'AC Repair', icon: Fan },
    { id: 'cat_cleaning', name: 'Home Cleaning', icon: Sparkles },
    { id: 'cat_electric', name: 'Electrician', icon: Zap },
    { id: 'cat_plumbing', name: 'Plumbing', icon: Wrench },
    { id: 'cat_appliance', name: 'Appliance', icon: Refrigerator },
    { id: 'cat_painting', name: 'Painting', icon: Paintbrush },
    { id: 'cat_pest', name: 'Pest Control', icon: Bug },
    { id: 'cat_carpenter', name: 'Carpenter', icon: Hammer },
  ];

  // ── Popular Services State (exact items matching ServFexServiceCard.kt) ──
  const popularServices = [
    {
      id: 'srv_ac_jet',
      name: 'Master Jet-Pump AC Clean',
      rating: 4.8,
      reviewCount: 1240,
      durationText: '60 mins',
      startingPrice: 499,
      icon: Fan,
    },
    {
      id: 'srv_kitchen_deep',
      name: 'Intense Kitchen Deep Cleaning',
      rating: 4.9,
      reviewCount: 850,
      durationText: '90 mins',
      startingPrice: 899,
      icon: Sparkles,
    },
    {
      id: 'srv_bath_clean',
      name: 'Complete Bathroom Sanitization',
      rating: 4.8,
      reviewCount: 2100,
      durationText: '60 mins',
      startingPrice: 449,
      icon: Sparkles,
    },
    {
      id: 'srv_electric_inspect',
      name: 'Switchboard & Wiring Inspection',
      rating: 4.7,
      reviewCount: 1890,
      durationText: '45 mins',
      startingPrice: 249,
      icon: Zap,
    },
  ];

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
      id: 'SEC-POPULAR',
      name: 'Popular Services Section',
      componentName: 'ServFexServiceCard.kt',
      description: 'Header with "View All", 60dp icon boxes, ★ rating, duration, and Book pill',
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

  const handlePublish = () => {
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 3000);
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
            className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Publish Home Layout</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls (Left 7 cols) & Frameless Mobile Screen (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Layout Customizer & Component Toggles (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Quick Presets for Location */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Delivery Location & Doorstep GPS</h3>
                <p className="text-xs text-slate-500">Configures the Hero Header location bar and Urban Company prompt.</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Urban Company Model
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold self-center mr-1">Presets:</span>
              {[
                'Jubilee Hills, Hyderabad',
                'HSR Layout, Bengaluru, KA',
                'Indiranagar, Bengaluru',
                'Bandra West, Mumbai',
                'Cyber City, Gurugram',
              ].map((loc) => (
                <button
                  key={loc}
                  onClick={() => setDeliveringLocation(loc)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                    deliveringLocation === loc
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Delivering Location Address</label>
                <input
                  type="text"
                  value={deliveringLocation}
                  onChange={(e) => setDeliveringLocation(e.target.value)}
                  placeholder="e.g. Jubilee Hills, Hyderabad"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex flex-col justify-end space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={gpsVerified}
                    onChange={(e) => setGpsVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-semibold text-slate-700">Display "GPS VERIFIED"</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showLocationPrompt}
                    onChange={(e) => setShowLocationPrompt(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-semibold text-slate-700">Display UC Location Prompt Banner</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Promotional Slides Management */}
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

          {/* Section 3: Modular Sections Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Customer App Sections (8 Modular Components)</h3>
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
                    {categories.map((cat) => {
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

              {/* 6. POPULAR SERVICES SECTION (ServFexServiceCard.kt) */}
              {isSectionEnabled('SEC-POPULAR') && (
                <div className="px-4 space-y-3">
                  {/* ServFexSectionHeader.kt */}
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <h2 className="text-[20px] font-semibold text-[#0A0A0A] leading-tight">
                        Popular Services
                      </h2>
                      <p className="text-[14px] text-[#4B5563] pt-0.5 leading-snug">
                        Most booked in your area this week
                      </p>
                    </div>
                    <span className="text-[12px] font-medium text-[#0A0A0A] cursor-pointer hover:underline shrink-0">
                      View All
                    </span>
                  </div>

                  {/* List of Popular Service Cards (Exact 1-column mobile stack) */}
                  <div className="space-y-3">
                    {popularServices.map((service) => {
                      const IconComponent = service.icon;
                      return (
                        <div
                          key={service.id}
                          className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3 cursor-pointer hover:shadow-md transition"
                        >
                          {/* Top row: 60dp icon box + title/rating/duration */}
                          <div className="flex items-start gap-3">
                            <div className="w-[60px] h-[60px] rounded-xl bg-[#F4F5F7] flex items-center justify-center shrink-0">
                              <IconComponent className="w-8 h-8 text-[#0A0A0A]" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-[16px] font-semibold text-[#0A0A0A] truncate leading-tight">
                                {service.name}
                              </h3>

                              <div className="flex items-center gap-2 pt-1 text-[12px]">
                                {/* Star Rating */}
                                <div className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                                  <span className="font-semibold text-[#0A0A0A]">
                                    {service.rating.toFixed(1)}
                                  </span>
                                  <span className="text-[#4B5563]">
                                    ({service.reviewCount})
                                  </span>
                                </div>

                                <span className="text-[#4B5563]">•</span>

                                {/* Duration */}
                                <div className="flex items-center gap-1 text-[#4B5563]">
                                  <Clock className="w-3 h-3" />
                                  <span>{service.durationText}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom row: Starting from ₹Price + Book button */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[14px] text-[#4B5563]">
                                Starting from
                              </span>
                              <span className="text-[16px] font-bold text-[#0A0A0A]">
                                ₹{service.startingPrice}
                              </span>
                            </div>

                            <button className="px-4 py-2 rounded-xl text-[14px] font-semibold text-white bg-[#0A0A0A] hover:bg-slate-800 transition shadow-xs">
                              Book
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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

              {/* Spacing: 32dp at bottom of list */}
              <div className="h-8" />
            </div>

            {/* 8. FIXED BOTTOM NAVIGATION BAR (ServFexBottomNav.kt: 64dp height, white) */}
            {isSectionEnabled('SEC-BOTTOM-NAV') && (
              <div className="bg-white border-t border-[#E5E7EB] h-16 flex items-center justify-around px-2 shrink-0">
                {/* Tab 1: Home */}
                <div
                  onClick={() => setSelectedNavTab('home')}
                  className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition ${
                    selectedNavTab === 'home' ? 'text-[#0A0A0A]' : 'text-[#4B5563]'
                  }`}
                >
                  <Home className="w-6 h-6 stroke-[2]" />
                  <span className="text-[12px] font-medium pt-1">Home</span>
                </div>

                {/* Tab 2: Services */}
                <div
                  onClick={() => setSelectedNavTab('services')}
                  className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition ${
                    selectedNavTab === 'services' ? 'text-[#0A0A0A]' : 'text-[#4B5563]'
                  }`}
                >
                  <Wrench className="w-6 h-6 stroke-[2]" />
                  <span className="text-[12px] font-medium pt-1">Services</span>
                </div>

                {/* Tab 3: Bookings */}
                <div
                  onClick={() => setSelectedNavTab('bookings')}
                  className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition ${
                    selectedNavTab === 'bookings' ? 'text-[#0A0A0A]' : 'text-[#4B5563]'
                  }`}
                >
                  <Calendar className="w-6 h-6 stroke-[2]" />
                  <span className="text-[12px] font-medium pt-1">Bookings</span>
                </div>

                {/* Tab 4: Profile */}
                <div
                  onClick={() => setSelectedNavTab('profile')}
                  className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition ${
                    selectedNavTab === 'profile' ? 'text-[#0A0A0A]' : 'text-[#4B5563]'
                  }`}
                >
                  <User className="w-6 h-6 stroke-[2]" />
                  <span className="text-[12px] font-medium pt-1">Profile</span>
                </div>
              </div>
            )}

            {/* Home Navigation Gesture Pill */}
            <div className="bg-white pb-1.5 flex justify-center">
              <div className="w-28 h-1 bg-slate-300 rounded-full" />
            </div>
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
