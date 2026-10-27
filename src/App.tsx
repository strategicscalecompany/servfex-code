import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingRealtimeProvider } from './context/BookingRealtimeContext';
import { AdminLayout } from './layouts/AdminLayout';

// Pages
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Bookings } from './pages/bookings/Bookings';
import { Customers } from './pages/customers/Customers';
import { Vendors } from './pages/vendors/Vendors';
import { VendorDetail } from './pages/vendors/VendorDetail';
import { Employees } from './pages/employees/Employees';
import { WhiteCollars } from './pages/employees/WhiteCollars';
import { OperationManagers } from './pages/employees/OperationManagers';
import { DevelopmentManagers } from './pages/employees/DevelopmentManagers';
import { OurApp } from './pages/our-app/OurApp';
import { AppHome } from './pages/our-app/AppHome';
import { SupportInbox } from './pages/support/SupportInbox';
import { Warehouse } from './pages/warehouse/Warehouse';
import { Services } from './pages/services/Services';
import { CategoryDetailPage } from './pages/services/CategoryDetailPage';
import { Categories } from './pages/categories/Categories';
import { Payments } from './pages/payments/Payments';
import { Reviews } from './pages/reviews/Reviews';
import { PlatformSettings } from './pages/settings/PlatformSettings';
import { BookingSettings } from './pages/settings/BookingSettings';
import { PricingSettings } from './pages/settings/PricingSettings';
import { AppConfig } from './pages/settings/AppConfig';
import { Notifications } from './pages/notifications/Notifications';
import { SystemActivity } from './pages/system/SystemActivity';
import { AuditLogs } from './pages/audit/AuditLogs';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm font-medium">Verifying Super Admin Authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookingRealtimeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="partner-onboarding" element={<Vendors />} />
                <Route path="partner-onboarding/:id" element={<VendorDetail />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="customers" element={<Customers />} />
                <Route path="vendors" element={<Navigate to="/partner-onboarding" replace />} />
                <Route path="vendors/:id" element={<VendorDetail />} />
                
                {/* White Collars Dropdown Sub-pages */}
                <Route path="employees" element={<Navigate to="/employees/operation-managers" replace />} />
                <Route path="employees/technicians" element={<Employees />} />
                <Route path="employees/white-collars" element={<Navigate to="/employees/operation-managers" replace />} />
                <Route path="employees/operation-managers" element={<OperationManagers />} />
                <Route path="employees/development-managers" element={<DevelopmentManagers />} />
                <Route path="white-collars" element={<Navigate to="/employees/operation-managers" replace />} />
                <Route path="white-collars/operation-managers" element={<Navigate to="/employees/operation-managers" replace />} />
                <Route path="white-collars/development-managers" element={<Navigate to="/employees/development-managers" replace />} />

                {/* Our App Dropdown Sub-pages */}
                <Route path="our-app" element={<Navigate to="/our-app/home" replace />} />
                <Route path="our-app/home" element={<AppHome />} />
                <Route path="our-app/services" element={<Services />} />
                <Route path="our-app/services/:categoryId" element={<CategoryDetailPage />} />
                <Route path="our-app/telemetry" element={<OurApp />} />
                
                {/* Legacy route redirects */}
                <Route path="services" element={<Navigate to="/our-app/services" replace />} />
                <Route path="services/:categoryId" element={<Navigate to="/our-app/services/:categoryId" replace />} />

                {/* Support & Warehouse */}
                <Route path="support-inbox" element={<SupportInbox />} />
                <Route path="warehouse" element={<Warehouse />} />

                <Route path="categories" element={<Categories />} />
                <Route path="payments" element={<Payments />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="settings/platform" element={<PlatformSettings />} />
                <Route path="settings/booking" element={<BookingSettings />} />
                <Route path="settings/pricing" element={<PricingSettings />} />
                <Route path="settings/app" element={<AppConfig />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="system" element={<SystemActivity />} />
                <Route path="audit-logs" element={<AuditLogs />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </BookingRealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
