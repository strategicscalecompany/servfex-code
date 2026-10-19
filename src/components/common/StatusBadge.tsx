import React from 'react';
import clsx from 'clsx';
import { BookingStatus, PaymentStatus, KycStatus, UserStatus } from '../../types';

interface StatusBadgeProps {
  status: BookingStatus | PaymentStatus | KycStatus | UserStatus | string;
  size?: 'sm' | 'md';
}

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  // Booking Statuses
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  ACCEPTED: { bg: 'bg-blue-50', text: 'text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  ASSIGNED: { bg: 'bg-indigo-50', text: 'text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  ON_THE_WAY: { bg: 'bg-purple-50', text: 'text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  ARRIVED: { bg: 'bg-cyan-50', text: 'text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
  IN_PROGRESS: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  AWAITING_CUSTOMER_CONFIRMATION: { bg: 'bg-amber-50', text: 'text-amber-800 border-amber-300', dot: 'bg-amber-600' },
  AWAITING_PAYMENT: { bg: 'bg-orange-50', text: 'text-orange-800 border-orange-300', dot: 'bg-orange-600' },
  COMPLETED: { bg: 'bg-green-50', text: 'text-green-700 border-green-200', dot: 'bg-green-600' },
  CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  DECLINED: { bg: 'bg-slate-50', text: 'text-slate-700 border-slate-200', dot: 'bg-slate-500' },
  DISPUTED: { bg: 'bg-red-50', text: 'text-red-800 border-red-300', dot: 'bg-red-600' },

  // KYC / Verification
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', dot: 'bg-rose-500' },

  // User Statuses
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  INACTIVE: { bg: 'bg-slate-50', text: 'text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  SUSPENDED: { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', dot: 'bg-rose-600' },
  PENDING_APPROVAL: { bg: 'bg-amber-50', text: 'text-amber-700 border-amber-200', dot: 'bg-amber-500' },

  // Payment Statuses
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  FAILED: { bg: 'bg-rose-50', text: 'text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  REFUNDED: { bg: 'bg-purple-50', text: 'text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  PARTIALLY_REFUNDED: { bg: 'bg-indigo-50', text: 'text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normalized = status.toUpperCase();
  const style = statusStyles[normalized] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold rounded-full border',
        style.bg,
        style.text,
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', style.dot)} />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
