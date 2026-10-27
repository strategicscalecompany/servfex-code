import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UserCheck,
  LogOut,
  Shield,
  Menu,
  X,
  Users,
  Briefcase,
  Compass,
  Code2,
  Smartphone,
  Inbox,
  Boxes,
  ChevronDown,
  ChevronRight,
  Calendar,
  Layers,
  CreditCard,
  Settings,
  Bell,
  Activity,
  Home,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { useBookingRealtime } from '../hooks/useBookingRealtime';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { newBooking, dismissNewBooking } = useBookingRealtime();

  // Keep White Collars dropdown open if user is browsing any employees/white-collars sub-page
  const isEmployeePath = location.pathname.startsWith('/employees') || location.pathname.startsWith('/white-collars');
  const [isEmployeesOpen, setIsEmployeesOpen] = useState(true);

  // Keep Our App dropdown open if user is browsing any our-app sub-page
  const isOurAppPath = location.pathname.startsWith('/our-app');
  const [isOurAppOpen, setIsOurAppOpen] = useState(true);

  // Full-bleed edge-to-edge layout for Warehouse Map
  const isWarehousePath = location.pathname.startsWith('/warehouse');
  const isCategoryDetailPage =
    (location.pathname.startsWith('/our-app/services/') && location.pathname !== '/our-app/services') ||
    (location.pathname.startsWith('/services/') && location.pathname !== '/services');

  useEffect(() => {
    if (isEmployeePath) {
      setIsEmployeesOpen(true);
    }
  }, [isEmployeePath]);

  useEffect(() => {
    if (isOurAppPath) {
      setIsOurAppOpen(true);
    }
  }, [isOurAppPath]);

  // Main navigation items
  const primaryNavLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Partner Onboarding', path: '/partner-onboarding', icon: UserCheck },
  ];

  const employeeSubLinks = [
    { name: 'Hub Operation Managers', path: '/employees/operation-managers', icon: Compass },
    { name: 'Development Managers', path: '/employees/development-managers', icon: Code2 },
  ];

  const ourAppSubLinks = [
    { name: 'Home', path: '/our-app/home', icon: Home },
    { name: 'Services', path: '/our-app/services', icon: Sparkles },
  ];

  const secondaryNavLinks = [
    { name: 'Support Inbox', path: '/support-inbox', icon: Inbox, badge: '5' },
    { name: 'Warehouse', path: '/warehouse', icon: Boxes },
  ];

  // Cleaned platform navigation: removed "Services & Catalog" and "Platform Settings"
  const platformNavLinks = [
    { name: 'Bookings', path: '/bookings', icon: Calendar },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Payments & Revenue', path: '/payments', icon: CreditCard },
  ];

  const NavItem = ({
    item,
    badge,
  }: {
    item: { name: string; path: string; icon: React.ComponentType<{ className?: string }> };
    badge?: string;
  }) => {
    const Icon = item.icon;
    return (
      <NavLink
        to={item.path}
        end={item.path === '/'}
        onClick={() => setIsMobileSidebarOpen(false)}
        className={({ isActive }) =>
          clsx(
            'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
            isActive
              ? 'bg-white text-slate-900 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
          )
        }
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
          <span>{item.name}</span>
        </div>
        {badge && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
            {badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 h-screen bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 lg:translate-x-0',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-lg shadow-white/5">
              <Shield className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">ServFex</span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Super Admin
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Main Controls */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Control Center
              </span>
            </div>
            <div className="space-y-1">
              {primaryNavLinks.map((link) => (
                <NavItem key={link.path} item={link} />
              ))}

              {/* White Collars Dropdown Section */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsEmployeesOpen(!isEmployeesOpen)}
                  className={clsx(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group text-left',
                    isEmployeePath
                      ? 'text-white bg-slate-800/80 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-indigo-400" />
                    <span>White Collars</span>
                  </div>
                  {isEmployeesOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Sub-pages dropdown */}
                {isEmployeesOpen && (
                  <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-800 ml-4 py-1">
                    {employeeSubLinks.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className={({ isActive }) =>
                            clsx(
                              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                              isActive
                                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            )
                          }
                        >
                          <SubIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{sub.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Our App Dropdown Section */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsOurAppOpen(!isOurAppOpen)}
                  className={clsx(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group text-left',
                    isOurAppPath
                      ? 'text-white bg-slate-800/80 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 text-sky-400" />
                    <span>Our App</span>
                  </div>
                  {isOurAppOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Sub-pages dropdown for Our App */}
                {isOurAppOpen && (
                  <div className="mt-1 pl-4 space-y-1 border-l-2 border-slate-800 ml-4 py-1">
                    {ourAppSubLinks.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <NavLink
                          key={sub.path}
                          to={sub.path}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className={({ isActive }) =>
                            clsx(
                              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                              isActive
                                ? 'bg-sky-600 text-white font-semibold shadow-xs'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            )
                          }
                        >
                          <SubIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{sub.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Secondary requested pages: Support Inbox, Warehouse */}
              {secondaryNavLinks.map((link) => (
                <NavItem key={link.path} item={link} badge={link.badge} />
              ))}
            </div>
          </div>

          {/* Platform Management */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Platform Operations
              </span>
            </div>
            <div className="space-y-1">
              {platformNavLinks.map((link) => (
                <NavItem key={link.path} item={link} />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer / User Profile */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">
                SA
              </div>
              <div className="truncate">
                <span className="block text-xs font-semibold text-white truncate">
                  {user?.name || 'Super Admin'}
                </span>
                <span className="block text-[10px] text-slate-400 truncate">
                  {user?.email || 'admin@servfex.com'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile Top Navigation */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between lg:hidden sticky top-0 z-30">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-slate-900">ServFex</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Super Admin
            </span>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main
          className={clsx(
            'flex-1',
            isWarehousePath
              ? 'p-0 w-full max-w-none h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden relative'
              : isCategoryDetailPage
              ? 'p-4 sm:p-6 w-full max-w-none flex flex-col min-h-[calc(100vh-3.5rem)]'
              : 'p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto'
          )}
        >
          {newBooking && location.pathname !== '/bookings' && !isWarehousePath && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 shadow-xs animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span className="font-medium text-slate-800">
                  ⚡ New booking request <strong className="text-emerald-700">{newBooking.bookingNumber ? `#${newBooking.bookingNumber}` : ''}</strong> received — click to view.
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    dismissNewBooking();
                    navigate('/bookings?status=ALL');
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 underline transition cursor-pointer"
                >
                  View Bookings
                </button>
                <button
                  onClick={dismissNewBooking}
                  aria-label="Dismiss"
                  className="text-slate-400 hover:text-slate-600 p-1 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
