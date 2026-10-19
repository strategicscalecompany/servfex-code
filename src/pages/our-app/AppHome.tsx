import React, { useState } from 'react';
import {
  Home,
  Smartphone,
  Plus,
  Trash2,
  Edit2,
  Eye,
  MoveUp,
  MoveDown,
  Sparkles,
  Layers,
  Tag,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Search,
  Bell,
  MapPin,
  Star,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  discountTag: string;
  badgeColor: string;
  targetCategory: string;
  isActive: boolean;
  order: number;
}

interface HomeSectionConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

export const AppHome: React.FC = () => {
  const [banners, setBanners] = useState<PromoBanner[]>([
    {
      id: 'BN-1',
      title: 'Summer AC Power Saver Fest',
      subtitle: 'Complete jet-pump deep cleaning & gas top-up',
      discountTag: 'FLAT 25% OFF',
      badgeColor: 'bg-amber-500',
      targetCategory: 'Air Conditioner',
      isActive: true,
      order: 1,
    },
    {
      id: 'BN-2',
      title: 'Monsoon Home Waterproofing & Plumbing',
      subtitle: 'Certified plumbers with 30-day warranty',
      discountTag: '₹200 CASHBACK',
      badgeColor: 'bg-indigo-600',
      targetCategory: 'Plumbing',
      isActive: true,
      order: 2,
    },
    {
      id: 'BN-3',
      title: 'Deep Home Sanitization',
      subtitle: 'Hospital-grade disinfectant & trained staff',
      discountTag: 'LIMITED TIME',
      badgeColor: 'bg-emerald-600',
      targetCategory: 'Cleaning',
      isActive: false,
      order: 3,
    },
  ]);

  const [sections, setSections] = useState<HomeSectionConfig[]>([
    { id: 'SEC-1', name: 'Location & Greeting Bar', type: 'Header', enabled: true },
    { id: 'SEC-2', name: 'Live Search Bar with Voice Input', type: 'Search', enabled: true },
    { id: 'SEC-3', name: 'Dynamic Promotional Carousel', type: 'Banner', enabled: true },
    { id: 'SEC-4', name: 'Instant Categories Grid (8 Icons)', type: 'Grid', enabled: true },
    { id: 'SEC-5', name: 'Most Booked Services Near You', type: 'Horizontal Cards', enabled: true },
    { id: 'SEC-6', name: 'Emergency SOS 15-Min Assistance', type: 'Callout', enabled: true },
    { id: 'SEC-7', name: 'Customer Reviews & Trust Badges', type: 'Social Proof', enabled: true },
  ]);

  const [greetingText, setGreetingText] = useState('Need trusted home services?');
  const [subGreetingText, setSubGreetingText] = useState('Certified technicians at your doorstep in 30 mins');
  const [isAddBannerOpen, setIsAddBannerOpen] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    discountTag: '',
    targetCategory: 'Air Conditioner',
    badgeColor: 'bg-indigo-600',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const toggleBanner = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
  };

  const deleteBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    const created: PromoBanner = {
      id: `BN-${Date.now()}`,
      title: newBanner.title,
      subtitle: newBanner.subtitle,
      discountTag: newBanner.discountTag,
      badgeColor: newBanner.badgeColor,
      targetCategory: newBanner.targetCategory,
      isActive: true,
      order: banners.length + 1,
    };
    setBanners([...banners, created]);
    setIsAddBannerOpen(false);
    setNewBanner({
      title: '',
      subtitle: '',
      discountTag: '',
      targetCategory: 'Air Conditioner',
      badgeColor: 'bg-indigo-600',
    });
  };

  const handleSaveConfig = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Home className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Our App — Home Layout</h1>
              <p className="text-xs text-slate-500">
                Design and manage the Customer Mobile App home screen layout, promo hero banners, and section visibility.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Published to mobile app!
            </span>
          )}
          <button
            onClick={handleSaveConfig}
            className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Publish Home Layout</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Settings & Mobile Mockup Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Layout Controls (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Greeting & Header Config */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">App Home Header & Catchphrase</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Headline Text</label>
                <input
                  type="text"
                  value={greetingText}
                  onChange={(e) => setGreetingText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-500 mb-1">Subtext / Tagline</label>
                <input
                  type="text"
                  value={subGreetingText}
                  onChange={(e) => setSubGreetingText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Promotional Hero Banners */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Home Carousel Banners</h3>
                <p className="text-xs text-slate-500">Live sliding discount cards featured at the top of the mobile home tab.</p>
              </div>
              <button
                onClick={() => setIsAddBannerOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Banner</span>
              </button>
            </div>

            <div className="space-y-3">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                    banner.isActive ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold text-white ${banner.badgeColor}`}>
                        {banner.discountTag}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">{banner.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{banner.subtitle}</p>
                    <span className="text-[10px] font-semibold text-indigo-600 block">
                      Target: {banner.targetCategory}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleBanner(banner.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        banner.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {banner.isActive ? 'Active' : 'Hidden'}
                    </button>
                    <button
                      onClick={() => deleteBanner(banner.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Home Section Reordering & Visibility */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Home Screen Modular Sections</h3>
            <p className="text-xs text-slate-500">
              Toggle visibility for individual customer UI blocks shown on the app's initial landing view.
            </p>

            <div className="space-y-2">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{sec.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{sec.type} Component</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSection(sec.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
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

        {/* Right Side: Live Mobile Preview Mockup (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-slate-900 p-3 rounded-[40px] shadow-2xl max-w-[340px] mx-auto border-4 border-slate-800">
            {/* Phone Screen Container */}
            <div className="bg-slate-50 rounded-[32px] overflow-hidden min-h-[580px] flex flex-col text-slate-900 border border-slate-800 shadow-inner">
              {/* Top Notch / Status Bar */}
              <div className="bg-white px-6 py-2 flex items-center justify-between text-[11px] font-bold text-slate-800 border-b border-slate-100">
                <span>9:41</span>
                <div className="w-16 h-3.5 bg-black rounded-full" />
                <span>5G 100%</span>
              </div>

              {/* In-App Header */}
              <div className="bg-white p-3.5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Jubilee Hills, Hyderabad</span>
                  </div>
                  <Bell className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{greetingText}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{subGreetingText}</p>
              </div>

              {/* In-App Search Bar */}
              <div className="p-3 bg-white border-b border-slate-100">
                <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-xl text-[11px] text-slate-400">
                  <Search className="w-3 h-3 text-slate-400" />
                  <span>Search "AC Deep Clean", "Plumber"...</span>
                </div>
              </div>

              {/* Mock Home Content Scroll */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {/* Active Promo Banner */}
                {banners.filter((b) => b.isActive)[0] && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 text-white shadow-sm space-y-1">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-400 text-slate-900">
                      {banners.filter((b) => b.isActive)[0].discountTag}
                    </span>
                    <h5 className="font-extrabold text-xs">
                      {banners.filter((b) => b.isActive)[0].title}
                    </h5>
                    <p className="text-[10px] text-slate-300">
                      {banners.filter((b) => b.isActive)[0].subtitle}
                    </p>
                  </div>
                )}

                {/* Categories Grid */}
                <div>
                  <span className="text-[11px] font-extrabold text-slate-800 block mb-1.5">
                    Popular Services
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                    <div className="p-2 bg-white rounded-xl shadow-2xs border border-slate-100">
                      <div className="w-6 h-6 mx-auto mb-1 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        ❄️
                      </div>
                      <span>AC Repair</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl shadow-2xs border border-slate-100">
                      <div className="w-6 h-6 mx-auto mb-1 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                        🔧
                      </div>
                      <span>Plumbing</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl shadow-2xs border border-slate-100">
                      <div className="w-6 h-6 mx-auto mb-1 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        ⚡
                      </div>
                      <span>Electrical</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl shadow-2xs border border-slate-100">
                      <div className="w-6 h-6 mx-auto mb-1 rounded bg-rose-50 text-rose-600 flex items-center justify-center">
                        🧹
                      </div>
                      <span>Cleaning</span>
                    </div>
                  </div>
                </div>

                {/* Featured Card */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-900 block">Master Jet-Pump AC Clean</span>
                    <span className="text-[10px] text-slate-500">60 mins • ₹499</span>
                  </div>
                  <button className="px-2.5 py-1 text-[10px] font-bold text-white bg-slate-900 rounded-lg">
                    Book
                  </button>
                </div>
              </div>

              {/* Mock App Bottom Bar */}
              <div className="bg-white p-2.5 border-t border-slate-200 flex items-center justify-around text-[10px] font-bold text-slate-400">
                <div className="text-slate-900 flex flex-col items-center">
                  <Home className="w-3.5 h-3.5 mb-0.5 text-indigo-600" />
                  <span>Home</span>
                </div>
                <div className="flex flex-col items-center">
                  <Layers className="w-3.5 h-3.5 mb-0.5" />
                  <span>Bookings</span>
                </div>
                <div className="flex flex-col items-center">
                  <Star className="w-3.5 h-3.5 mb-0.5" />
                  <span>Rewards</span>
                </div>
                <div className="flex flex-col items-center">
                  <Smartphone className="w-3.5 h-3.5 mb-0.5" />
                  <span>Account</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Banner Modal */}
      <Modal isOpen={isAddBannerOpen} onClose={() => setIsAddBannerOpen(false)} title="Create Home Banner" maxWidth="md">
        <form onSubmit={handleAddBanner} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Banner Title</label>
            <input
              type="text"
              required
              value={newBanner.title}
              onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
              placeholder="e.g. Festive Lighting & Electrician Pack"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Subtitle</label>
            <input
              type="text"
              required
              value={newBanner.subtitle}
              onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
              placeholder="e.g. 50% discount on first booking"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Discount Tag</label>
              <input
                type="text"
                required
                value={newBanner.discountTag}
                onChange={(e) => setNewBanner({ ...newBanner, discountTag: e.target.value })}
                placeholder="e.g. FLAT 30% OFF"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Category Target</label>
              <select
                value={newBanner.targetCategory}
                onChange={(e) => setNewBanner({ ...newBanner, targetCategory: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              >
                <option value="Air Conditioner">Air Conditioner</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Cleaning">Cleaning</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddBannerOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
            >
              Add to Home Screen
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
