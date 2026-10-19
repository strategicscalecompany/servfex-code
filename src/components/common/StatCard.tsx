import React from 'react';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon | React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  to?: string;
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  sky: 'bg-sky-50 text-sky-600 border-sky-100',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral',
  icon,
  trend,
  color = 'indigo',
  to,
}) => {
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-5 h-5 transition-transform group-hover:scale-110" />;
  };

  const changeText = change || subtitle;

  const CardContent = (
    <div
      className={clsx(
        'bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all',
        to
          ? 'cursor-pointer hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 group'
          : 'hover:shadow-md'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-900 transition-colors flex items-center gap-1">
          <span>{title}</span>
          {to && <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
        </span>
        <div className={clsx('p-2.5 rounded-lg border flex items-center justify-center transition-all', colorMap[color])}>
          {renderIcon()}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span
            className={clsx(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            )}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </span>
        )}
      </div>

      {changeText && (
        <p
          className={clsx(
            'mt-1 text-xs font-medium',
            changeType === 'positive'
              ? 'text-emerald-600'
              : changeType === 'negative'
              ? 'text-rose-600'
              : 'text-slate-500'
          )}
        >
          {changeText}
        </p>
      )}
    </div>
  );

  if (to) {
    return <Link to={to} className="block no-underline">{CardContent}</Link>;
  }

  return CardContent;
};
