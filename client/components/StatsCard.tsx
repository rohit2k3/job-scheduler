import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'indigo' | 'emerald' | 'amber' | 'rose';
}

const colorClasses = {
  indigo: {
    bg: 'bg-indigo-500/10',
    icon: 'text-indigo-500',
    border: 'border-indigo-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-500',
    border: 'border-emerald-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-500',
    border: 'border-amber-500/20',
  },
  rose: {
    bg: 'bg-rose-500/10',
    icon: 'text-rose-500',
    border: 'border-rose-500/20',
  },
};

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  color = 'indigo' 
}: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <div className={`
      p-6 rounded-xl bg-slate-800/50 border ${colors.border}
      hover:bg-slate-800 transition-all duration-200
    `}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className={`mt-2 text-sm ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-slate-500 ml-1">vs last period</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}
