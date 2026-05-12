import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  badge?: string;
  variant?: 'primary' | 'warning' | 'success' | 'error';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon, 
  badge, 
  variant = 'primary' 
}) => {
  const variants = {
    primary: {
      iconBg: 'bg-primary-container/10',
      iconColor: 'text-primary-container',
      border: 'hover:border-primary-container/30',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-400'
    },
    warning: {
      iconBg: 'bg-tertiary-container/10',
      iconColor: 'text-tertiary-container',
      border: 'hover:border-tertiary-container/30',
      badgeBg: 'bg-tertiary-container/5',
      badgeText: 'text-tertiary-container'
    },
    success: {
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      border: 'hover:border-green-600/30',
      badgeBg: 'bg-green-50',
      badgeText: 'text-green-600'
    },
    error: {
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      border: 'hover:border-rose-600/30',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-600'
    }
  };

  const style = variants[variant];

  return (
    <div className={`bg-white p-6 rounded-xl border border-[#e0e4e8] transition-colors ${style.border}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${style.iconBg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined ${style.iconColor}`} data-icon={icon}>
            {icon}
          </span>
        </div>
        {badge && (
          <span className={`text-[10px] font-bold ${style.badgeBg} ${style.badgeText} px-2 py-1 rounded`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-display font-display text-on-surface">{value}</p>
      <p className={`text-label-bold mt-1 uppercase tracking-widest ${style.iconColor}`}>
        {label}
      </p>
    </div>
  );
};
