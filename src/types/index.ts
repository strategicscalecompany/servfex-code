export type UserRole = 'SUPER_ADMIN' | 'CUSTOMER' | 'VENDOR' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';
export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'ASSIGNED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'AWAITING_CUSTOMER_CONFIRMATION'
  | 'AWAITING_PAYMENT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DECLINED'
  | 'DISPUTED';

export interface EligibleVendor {
  vendorId: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  location: string;
  rating: number;
  reviewCount: number;
  commissionRate: number;
  isServiceCompatible: boolean;
  totalEmployees: number;
  availableEmployees: number;
  completedToday: number;
  activeJobs: number;
  pendingJobs: number;
  distanceKm: number | null;
  score: number;
  scoringBreakdown: string[];
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentMethod = 'ONLINE' | 'CASH' | 'UPI' | 'CARD' | 'WALLET';
export type RefundStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

export interface Document {
  id: string;
  userId: string;
  type: string;
  title?: string;
  fileUrl: string;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  isVerified?: boolean;
  verificationStatus?: KycStatus;
  verifiedAt?: string | null;
  rejectedReason?: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  profilePhotoUrl?: string | null;
  isVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  documents?: Document[];
  customerProfile?: CustomerProfile | null;
  vendorProfile?: VendorProfile | null;
  employeeProfile?: EmployeeProfile | null;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  totalBookings: number;
  totalSpent: number | string;
  emergencyContact?: string | null;
  notes?: string | null;
  createdAt: string;
  user?: User;
}

export interface VendorProfile {
  id: string;
  userId: string;
  companyName: string;
  businessLicense?: string | null;
  taxId?: string | null;
  kycStatus: KycStatus;
  kycRejectionReason?: string | null;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  bio?: string | null;
  rating: number;
  reviewCount: number;
  commissionRate: number | string;
  isActive: boolean;
  warehouseName?: string | null;
  warehouseLocation?: string | null;
  warehousePhone?: string | null;
  warehouseImageUrl?: string | null;
  createdAt: string;
  user?: User;
  employees?: EmployeeProfile[];
  vendorServices?: VendorService[];
  _count?: {
    employees: number;
    vendorServices: number;
    bookings: number;
    reviews?: number;
  };
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  vendorId: string;
  specialization: string;
  rating: number;
  completedJobs: number;
  phone: string;
  isAvailable: boolean;
  createdAt: string;
  user?: User;
  vendor?: {
    id: string;
    companyName: string;
  };
}

export interface UserAddress {
  id: string;
  userId: string;
  label: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

export interface ServiceSubCategory {
  id: string;
  categoryId: string;
  name: string;
  iconUrl?: string | null;
  bannerImages?: string[];
  bannerVideo?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  services?: Service[];
  _count?: { services: number };
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  /** @deprecated Use iconUrl instead */
  icon?: string | null;
  iconUrl?: string | null;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  subCategories?: ServiceSubCategory[];
  _count?: {
    services: number;
    subCategories?: number;
  };
}

// ---- Package sub-types ----
export interface ProcessStep {
  stepNumber?: number;
  title: string;
  description: string;
  imageUrl?: string | null;
}

export interface Requirement {
  iconUrl: string;
  label: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ServicePackage {
  id: string;
  serviceId: string;
  // New fields
  name: string;
  shortDescription?: string | null;
  badgeText?: string | null;
  sectionTitle?: string | null;
  originalPrice: string | number;
  discountedPrice: string | number;
  savingsLabel?: string | null;
  pricePerUnitLabel?: string | null;
  duration: string;
  cardImage?: string | null;
  detailBannerImages: string[];
  detailBannerVideo?: string | null;
  offersBanner?: string | null;
  highlightsTitle?: string | null;
  highlights: string[];
  processTitle?: string | null;
  processSteps: ProcessStep[];
  whatsIncludedTitle?: string | null;
  whatsIncluded: string[];
  requirementsTitle?: string | null;
  requirements: Requirement[];
  pleaseNoteTitle?: string | null;
  pleaseNote: string[];
  faqsTitle?: string | null;
  faqs: FAQ[];
  reviews?: Array<{ reviewerName: string; rating: number; comment: string; date?: string }>;
  displayOrder: number;
  isActive: boolean;
  // Deprecated legacy fields kept for booking compat
  /** @deprecated Use name */
  title?: string | null;
  /** @deprecated Use shortDescription */
  description?: string | null;
  /** @deprecated Use discountedPrice */
  price?: string | number | null;
  durationMinutes?: number | null;
  features?: string[] | null;
  isPopular?: boolean | null;
  createdAt?: string;
}

export interface VendorService {
  id: string;
  vendorId: string;
  serviceId: string;
  customPrice?: number | string | null;
  isActive: boolean;
  availability: string;
  vendor?: {
    id: string;
    companyName: string;
    rating: number;
    user?: { name: string; phone: string };
  };
}

export interface Service {
  id: string;
  categoryId: string;
  category?: { id: string; name: string; iconUrl?: string | null };
  subCategoryId?: string | null;
  subCategory?: { id: string; name: string } | null;
  name: string;
  slug: string;
  description: string;
  startingPrice: number | string;
  priceUnit: string;
  durationText: string;
  rating: number;
  reviewCount: number;
  /** @deprecated Use iconUrl */
  iconName?: string | null;
  /** @deprecated Use bannerImages[0] */
  imageUrl?: string | null;
  iconUrl?: string | null;
  bannerImages: string[];
  bannerVideo?: string | null;
  isPopular: boolean;
  isActive: boolean;
  packages?: ServicePackage[];
  vendorServices?: VendorService[];
  _count?: {
    vendorServices: number;
    bookings: number;
  };
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  serviceId: string;
  packageId?: string | null;
  addressId: string;
  vendorId?: string | null;
  employeeId?: string | null;
  scheduledDate: string;
  scheduledTimeSlot: string;
  status: BookingStatus;
  basePrice: number | string;
  taxes: number | string;
  discountAmount: number | string;
  extraCharges: number | string;
  totalAmount: number | string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  customer?: {
    id: string;
    user: { name: string; phone: string; email: string };
  };
  service?: { id: string; name: string; iconName?: string };
  package?: { id: string; title: string };
  vendor?: { id: string; companyName: string };
  employee?: {
    id: string;
    user: { name: string; phone: string };
  };
  address?: UserAddress;
  statusHistory?: BookingStatusHistory[];
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  oldStatus?: BookingStatus | null;
  newStatus: BookingStatus;
  changedBy: string;
  changedByRole: UserRole;
  reason?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  transactionRef: string;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  createdAt: string;
  booking?: {
    id: string;
    bookingNumber: string;
    totalAmount: number | string;
    customer?: { user: { name: string; phone: string } };
    service?: { name: string };
  };
  refunds?: Refund[];
}

export interface Refund {
  id: string;
  paymentId: string;
  bookingId: string;
  amount: number | string;
  reason: string;
  status: RefundStatus;
  processedBy: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId?: string | null;
  customerId: string;
  serviceId: string;
  vendorId?: string | null;
  employeeId?: string | null;
  rating: number;
  comment?: string | null;
  isHidden: boolean;
  reportCount: number;
  createdAt: string;
  customer?: { id: string; name: string; email: string };
  service?: { id: string; name: string };
  vendor?: { id: string; companyName: string };
  employee?: { user: { name: string } };
  booking?: { id: string; bookingNumber: string };
}

export interface AuditLog {
  id: string;
  superAdminId: string;
  superAdmin?: { id: string; name: string; email: string };
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  changes?: any;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  users: {
    totalCustomers: number;
    totalVendors: number;
    activeVendors: number;
    pendingKycVendors: number;
    totalEmployees: number;
  };
  bookings: {
    todayBookings: number;
    pendingBookings: number;
    activeJobs: number;
    completedJobs: number;
    cancelledJobs: number;
  };
  revenue: {
    totalRevenue: number;
    monthlyRevenue: number;
    todayRevenue: number;
    currency: string;
  };
  recentBookings: Booking[];
  recentVendors: VendorProfile[];
  recentAuditLogs: AuditLog[];
}
