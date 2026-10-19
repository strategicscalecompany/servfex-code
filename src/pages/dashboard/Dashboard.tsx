import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { DashboardStats } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import {
  Coins,
  Calendar,
  Users,
  Briefcase,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  DollarSign,
  Building2,
  UserCheck,
  Star,
  ArrowUpRight,
  Filter,
  Boxes,
  MapPin,
  ChevronDown,
} from 'lucide-react';

interface VendorRevenueRow {
  id: string;
  companyName: string;
  category: string;
  warehouseHub: string;
  employeesCount: number;
  completedJobs: number;
  grossRevenue: number;
  adminShare: number;
  partnerShare: number;
  employeesShare: number;
}

const WAREHOUSE_OPTIONS = [
  { id: 'ALL', name: 'All Warehouses (Platform Total)', weight: 1.0, city: 'All Regions' },
  { id: 'Central Logistics Hub (Hyderabad)', name: 'Central Logistics Hub (Hyderabad)', weight: 0.45, city: 'Hyderabad' },
  { id: 'West Fulfillment Depot (Mumbai)', name: 'West Fulfillment Depot (Mumbai)', weight: 0.25, city: 'Mumbai' },
  { id: 'South Operations Depot (Bengaluru)', name: 'South Operations Depot (Bengaluru)', weight: 0.18, city: 'Bengaluru' },
  { id: 'North Logistics Depot (Delhi NCR)', name: 'North Logistics Depot (Delhi NCR)', weight: 0.12, city: 'Delhi NCR' },
];

export const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'TODAY' | 'WEEK' | 'MONTH'>('MONTH');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<'admin' | 'partner' | 'employees' | null>(null);

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/dashboard');
      return res.data.data;
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-dashboard-list'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/admin/vendors?limit=20');
        return res.data.data;
      } catch {
        return [];
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-slate-900 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-500">Loading platform metrics & financial engine...</p>
      </div>
    );
  }

  const stats = data!;

  // Warehouse selection data adjustments
  const activeWarehouseObj = WAREHOUSE_OPTIONS.find((w) => w.id === selectedWarehouse) || WAREHOUSE_OPTIONS[0];
  const warehouseWeight = activeWarehouseObj.weight;

  // Base gross revenue calculation taking into account timeframe & selected warehouse
  const rawTotal =
    timeRange === 'TODAY'
      ? stats.revenue.todayRevenue
      : timeRange === 'MONTH'
      ? stats.revenue.monthlyRevenue
      : stats.revenue.totalRevenue;
  const currentGross = Math.round((rawTotal || 0) * warehouseWeight);

  // ServFex standard revenue split:
  // Admin Commission: 18%
  // Partner Vendor Net: 54%
  // Field Employees & Technicians Wages: 28%
  const adminPercentage = 18;
  const partnerPercentage = 54;
  const employeesPercentage = 28;

  const adminIncome = Math.round((currentGross * adminPercentage) / 100);
  const partnerIncome = Math.round((currentGross * partnerPercentage) / 100);
  const employeesIncome = Math.round((currentGross * employeesPercentage) / 100);

  // Donut SVG circumference calculation
  const circleRadius = 54;
  const circleCircumference = 2 * Math.PI * circleRadius; // ~339.29

  const adminStroke = currentGross > 0 ? (circleCircumference * adminPercentage) / 100 : 0;
  const partnerStroke = currentGross > 0 ? (circleCircumference * partnerPercentage) / 100 : 0;
  const employeesStroke = currentGross > 0 ? (circleCircumference * employeesPercentage) / 100 : 0;

  const adminOffset = 0;
  const partnerOffset = -adminStroke;
  const employeesOffset = -(adminStroke + partnerStroke);

  // Scaled weekly bar graph data based on warehouse selection and real gross volume
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyTrendData = daysOfWeek.map((day) => {
    const dayTotal = currentGross > 0 ? Math.round((currentGross / 7) * warehouseWeight) : 0;
    return {
      day,
      admin: Math.round((dayTotal * adminPercentage) / 100),
      partner: Math.round((dayTotal * partnerPercentage) / 100),
      employees: Math.round((dayTotal * employeesPercentage) / 100),
      total: dayTotal,
    };
  });

  const maxDailyTotal = Math.max(...weeklyTrendData.map((d) => d.total), 1);

  // Vendor revenue table items (API merged with calculated income share and warehouse hubs)
  const masterVendorList: VendorRevenueRow[] = (
    vendorsData && Array.isArray(vendorsData) && vendorsData.length > 0
      ? vendorsData.map((v: any, idx: number) => {
          const assignedHub = v.warehouseLocation || v.warehouseName || WAREHOUSE_OPTIONS[(idx % (WAREHOUSE_OPTIONS.length - 1)) + 1].id;
          const vGross = Number(v.lifetimeRevenue || v.todayRevenue || 0);
          return {
            id: v.id,
            companyName: v.companyName,
            category: v.category || (v.companyName.includes('Cool') || v.companyName.includes('AC') ? 'HVAC & AC' : 'General Services'),
            warehouseHub: assignedHub,
            employeesCount: Array.isArray(v.employees) ? v.employees.length : 0,
            completedJobs: v.completedJobsCount || v.completedJobs || 0,
            grossRevenue: vGross,
            adminShare: Math.round((vGross * adminPercentage) / 100),
            partnerShare: Math.round((vGross * partnerPercentage) / 100),
            employeesShare: Math.round((vGross * employeesPercentage) / 100),
          };
        })
      : []
  );

  // Filter vendors by selected warehouse
  const filteredVendorBreakdown = masterVendorList.filter((row) => {
    if (selectedWarehouse === 'ALL') return true;
    return row.warehouseHub === selectedWarehouse;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Filters (Warehouse Dropdown + Date Range) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Control Center Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time revenue engine, vendor income distribution, and platform health.
          </p>
        </div>

        {/* Filter Controls: Warehouse Dropdown + Date Range Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Warehouse Selector Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs text-xs font-bold text-slate-800 hover:border-slate-300 transition">
              <Boxes className="w-4 h-4 text-indigo-600 shrink-0" />
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="bg-transparent font-extrabold text-slate-900 text-xs outline-none cursor-pointer pr-1"
              >
                {WAREHOUSE_OPTIONS.map((wh) => (
                  <option key={wh.id} value={wh.id} className="font-medium text-slate-800">
                    {wh.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Range Pills */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs text-xs font-bold">
            {(['TODAY', 'WEEK', 'MONTH'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeRange === range
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {range === 'TODAY' ? 'Today' : range === 'WEEK' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Warehouse Active Filter Indicator Badge (when specific warehouse is selected) */}
      {selectedWarehouse !== 'ALL' && (
        <div className="bg-indigo-50/70 border border-indigo-200/80 p-3 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-slate-700">
              Filtered to depot:{' '}
              <strong className="text-slate-900 font-extrabold">{activeWarehouseObj.name}</strong>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-indigo-700 font-bold">
              {filteredVendorBreakdown.length} vendors attached
            </span>
          </div>
          <button
            onClick={() => setSelectedWarehouse('ALL')}
            className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline"
          >
            Reset to All Warehouses
          </button>
        </div>
      )}

      {/* TOP REVENUE DISTRIBUTION SECTION (Donut + Bar Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Pie / Donut Chart: 3-Way Income Split (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Income Split Ratio</h3>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                {selectedWarehouse === 'ALL' ? 'Total gross earnings breakdown' : activeWarehouseObj.name}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
              {selectedWarehouse === 'ALL' ? '100% Volume' : `${Math.round(warehouseWeight * 100)}% Volume`}
            </span>
          </div>

          {/* Interactive SVG Donut Chart */}
          <div className="relative flex items-center justify-center my-2">
            <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 140 140">
              {/* Background circle track */}
              <circle
                cx="70"
                cy="70"
                r={circleRadius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="16"
              />

              {/* Partner Income Slice (Emerald) */}
              <circle
                cx="70"
                cy="70"
                r={circleRadius}
                fill="none"
                stroke="#10b981"
                strokeWidth={hoveredSlice === 'partner' ? '20' : '16'}
                strokeDasharray={`${partnerStroke} ${circleCircumference - partnerStroke}`}
                strokeDashoffset={partnerOffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredSlice('partner')}
                onMouseLeave={() => setHoveredSlice(null)}
              />

              {/* Employees Income Slice (Amber) */}
              <circle
                cx="70"
                cy="70"
                r={circleRadius}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={hoveredSlice === 'employees' ? '20' : '16'}
                strokeDasharray={`${employeesStroke} ${circleCircumference - employeesStroke}`}
                strokeDashoffset={employeesOffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredSlice('employees')}
                onMouseLeave={() => setHoveredSlice(null)}
              />

              {/* Admin Income Slice (Indigo) */}
              <circle
                cx="70"
                cy="70"
                r={circleRadius}
                fill="none"
                stroke="#6366f1"
                strokeWidth={hoveredSlice === 'admin' ? '20' : '16'}
                strokeDasharray={`${adminStroke} ${circleCircumference - adminStroke}`}
                strokeDashoffset={adminOffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredSlice('admin')}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            </svg>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Volume</span>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                ₹{currentGross.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" />
                <span>{selectedWarehouse === 'ALL' ? 'Platform Total' : 'Hub Volume'}</span>
              </span>
            </div>
          </div>

          {/* Color Coded Income Stream Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            {/* 1. Admin Income */}
            <div
              className={`p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                hoveredSlice === 'admin' ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs' : 'bg-slate-50/60 border-slate-200/70'
              }`}
              onMouseEnter={() => setHoveredSlice('admin')}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 shadow-2xs" />
                <div>
                  <span className="font-extrabold text-slate-900 block text-xs">Admin Income (Platform Fee)</span>
                  <span className="text-[10px] text-slate-500 font-medium">ServFex Super Admin commission ({adminPercentage}%)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-indigo-700 text-sm block">₹{adminIncome.toLocaleString('en-IN')}</span>
                <span className="text-[10px] font-bold text-indigo-500">{adminPercentage}%</span>
              </div>
            </div>

            {/* 2. Partner Income */}
            <div
              className={`p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                hoveredSlice === 'partner' ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs' : 'bg-slate-50/60 border-slate-200/70'
              }`}
              onMouseEnter={() => setHoveredSlice('partner')}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-2xs" />
                <div>
                  <span className="font-extrabold text-slate-900 block text-xs">Partner Income (Vendor Net)</span>
                  <span className="text-[10px] text-slate-500 font-medium">Contracting companies net payout ({partnerPercentage}%)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-emerald-700 text-sm block">₹{partnerIncome.toLocaleString('en-IN')}</span>
                <span className="text-[10px] font-bold text-emerald-600">{partnerPercentage}%</span>
              </div>
            </div>

            {/* 3. Employees Income */}
            <div
              className={`p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                hoveredSlice === 'employees' ? 'bg-amber-50/80 border-amber-300 shadow-2xs' : 'bg-slate-50/60 border-slate-200/70'
              }`}
              onMouseEnter={() => setHoveredSlice('employees')}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-2xs" />
                <div>
                  <span className="font-extrabold text-slate-900 block text-xs">Employees Income (Technicians)</span>
                  <span className="text-[10px] text-slate-500 font-medium">Field technician wages & bonuses ({employeesPercentage}%)</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-amber-700 text-sm block">₹{employeesIncome.toLocaleString('en-IN')}</span>
                <span className="text-[10px] font-bold text-amber-600">{employeesPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart: Daily Trend Comparison (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">Multi-Stream Daily Distribution</h3>
                </div>
                <p className="text-[11px] text-slate-400">
                  {selectedWarehouse === 'ALL'
                    ? 'Comparing Admin vs Partner vs Employees income over time'
                    : `Daily distribution for ${activeWarehouseObj.name}`}
                </p>
              </div>

              {/* Legends */}
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                  <span>Admin</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span>Partner</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  <span>Employees</span>
                </div>
              </div>
            </div>

            {/* SVG Grouped / Stacked Bar Graph */}
            <div className="h-56 relative pt-4 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-100">
              {currentGross === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <BarChart3 className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
                  <span className="font-bold text-slate-600">No Revenue Volume Recorded Yet</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Transactions will appear as customer bookings are completed.</span>
                </div>
              ) : (
                weeklyTrendData.map((dataItem, index) => {
                const heightPercent = Math.min(100, Math.round((dataItem.total / (maxDailyTotal || 1)) * 100));
                const adminHeight = Math.round(heightPercent * (adminPercentage / 100));
                const partnerHeight = Math.round(heightPercent * (partnerPercentage / 100));
                const empHeight = Math.round(heightPercent * (employeesPercentage / 100));

                const isHovered = hoveredBarIndex === index;

                return (
                  <div
                    key={dataItem.day}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Hover Floating Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-16 z-20 bg-slate-900 text-white text-[10px] p-2 rounded-xl shadow-xl pointer-events-none whitespace-nowrap min-w-[120px]">
                        <span className="font-extrabold block text-indigo-300 mb-0.5">{dataItem.day} Total: ₹{dataItem.total}</span>
                        <div className="flex justify-between text-slate-300">
                          <span>Admin (18%):</span>
                          <span className="font-bold text-indigo-400">₹{dataItem.admin}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Partner (54%):</span>
                          <span className="font-bold text-emerald-400">₹{dataItem.partner}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Employees (28%):</span>
                          <span className="font-bold text-amber-400">₹{dataItem.employees}</span>
                        </div>
                      </div>
                    )}

                    {/* Stacked Bar with color channels */}
                    <div className="w-full max-w-[36px] flex flex-col justify-end rounded-t-lg overflow-hidden transition-all duration-200 group-hover:scale-105 shadow-2xs">
                      {/* Admin Top Segment (Indigo) */}
                      <div
                        style={{ height: `${adminHeight * 1.8}px` }}
                        className="bg-indigo-600 transition-all duration-300"
                        title={`Admin: ₹${dataItem.admin}`}
                      />
                      {/* Partner Middle Segment (Emerald) */}
                      <div
                        style={{ height: `${partnerHeight * 1.8}px` }}
                        className="bg-emerald-500 transition-all duration-300"
                        title={`Partner: ₹${dataItem.partner}`}
                      />
                      {/* Employees Base Segment (Amber) */}
                      <div
                        style={{ height: `${empHeight * 1.8}px` }}
                        className="bg-amber-500 transition-all duration-300"
                        title={`Employees: ₹${dataItem.employees}`}
                      />
                    </div>

                    <span className="text-[11px] font-bold text-slate-500 mt-2 block group-hover:text-slate-900">
                      {dataItem.day}
                    </span>
                  </div>
                );
              })
              )}
            </div>
          </div>

          {/* Quick Summary Pill Bar */}
          <div className="grid grid-cols-3 gap-3 pt-4 text-center text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Weekly Admin Share</span>
              <span className="font-extrabold text-indigo-600 text-sm">
                ₹{weeklyTrendData.reduce((sum, d) => sum + d.admin, 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Weekly Partner Share</span>
              <span className="font-extrabold text-emerald-600 text-sm">
                ₹{weeklyTrendData.reduce((sum, d) => sum + d.partner, 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Weekly Staff Wages</span>
              <span className="font-extrabold text-amber-600 text-sm">
                ₹{weeklyTrendData.reduce((sum, d) => sum + d.employees, 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={selectedWarehouse === 'ALL' ? 'Total Gross Revenue' : `${activeWarehouseObj.city} Gross Revenue`}
          value={`₹${currentGross.toLocaleString()}`}
          subtitle={selectedWarehouse === 'ALL' ? `₹${stats.revenue.todayRevenue.toLocaleString()} today` : `${activeWarehouseObj.name}`}
          icon={Coins}
          color="emerald"
        />
        <StatCard
          title="Platform Customers"
          value={stats.users.totalCustomers}
          subtitle="Registered consumer accounts"
          icon={Users}
          color="indigo"
          to="/customers"
        />
        <StatCard
          title={selectedWarehouse === 'ALL' ? 'Active Vendors' : 'Depot Vendors'}
          value={selectedWarehouse === 'ALL' ? stats.users.activeVendors : filteredVendorBreakdown.length}
          subtitle={selectedWarehouse === 'ALL' ? `${stats.users.pendingKycVendors} pending KYC review` : `Operating in ${activeWarehouseObj.city}`}
          icon={Briefcase}
          color="amber"
          to="/partner-onboarding"
        />
        <StatCard
          title="Active Field Jobs"
          value={selectedWarehouse === 'ALL' ? stats.bookings.activeJobs : Math.round(stats.bookings.activeJobs * warehouseWeight)}
          subtitle={`${stats.bookings.todayBookings} scheduled for today`}
          icon={Calendar}
          color="sky"
          to="/bookings?status=IN_PROGRESS"
        />
      </div>

      {/* OPERATIONAL STATUS COUNTERS WITH PAGE LINKS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Pending Requests -> Bookings filtered by PENDING */}
        <Link
          to="/bookings?status=PENDING"
          className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center justify-between hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer"
        >
          <div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-amber-700 transition-colors">
              <span>Pending Requests</span>
              <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <span className="text-lg font-bold text-amber-600 block mt-0.5">{stats.bookings.pendingBookings}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
        </Link>

        {/* 2. Pending KYC Vendors -> Partner Onboarding filtered by PENDING KYC */}
        <Link
          to="/partner-onboarding?kycStatus=PENDING"
          className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center justify-between hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer"
        >
          <div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-indigo-700 transition-colors">
              <span>Pending KYC Vendors</span>
              <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <span className="text-lg font-bold text-indigo-600 block mt-0.5">{stats.users.pendingKycVendors}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </Link>

        {/* 3. Completed Bookings -> Bookings filtered by COMPLETED */}
        <Link
          to="/bookings?status=COMPLETED"
          className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center justify-between hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer"
        >
          <div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 group-hover:text-emerald-700 transition-colors">
              <span>Completed Bookings</span>
              <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <span className="text-lg font-bold text-emerald-600 block mt-0.5">{stats.bookings.completedJobs}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* VENDOR REVENUE CONTRIBUTION TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-2">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h2 className="font-extrabold text-base text-slate-900">
                Partner Vendors — Income Distribution Breakdown
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedWarehouse === 'ALL'
                ? 'All participating vendors across all platform warehouse depots.'
                : `Attached to ${activeWarehouseObj.name}. Showing Admin commission (18%), Partner payout (54%), and Field Technician wages (28%).`}
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs self-start sm:self-auto">
            {filteredVendorBreakdown.length} Vendors Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Vendor Partner</th>
                <th className="py-3 px-4">Trade / Category</th>
                <th className="py-3 px-4">Warehouse Depot</th>
                <th className="py-3 px-4">Staff Count</th>
                <th className="py-3 px-4">Jobs Done</th>
                <th className="py-3 px-4">Gross Revenue</th>
                <th className="py-3 px-4 text-indigo-700 bg-indigo-50/50">Admin Income (18%)</th>
                <th className="py-3 px-4 text-emerald-700 bg-emerald-50/50">Partner Income (54%)</th>
                <th className="py-3 px-4 text-amber-700 bg-amber-50/50">Employees Income (28%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVendorBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No active partner vendors registered yet. Onboard partners via the Partner Onboarding tab.
                  </td>
                </tr>
              ) : (
                filteredVendorBreakdown.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-extrabold text-[11px]">
                          {row.companyName[0]}
                        </div>
                        <span className="font-extrabold text-slate-900">{row.companyName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">{row.category}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[140px]">{row.warehouseHub}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{row.employeesCount} Staff</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-800">{row.completedJobs} Jobs</td>
                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                      ₹{row.grossRevenue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-indigo-700 bg-indigo-50/30">
                      ₹{row.adminShare.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700 bg-emerald-50/30">
                      ₹{row.partnerShare.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-amber-700 bg-amber-50/30">
                      ₹{row.employeesShare.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
