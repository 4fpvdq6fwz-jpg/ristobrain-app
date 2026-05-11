import clsx from 'clsx';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: { value: number; label: string };
  color?: 'orange' | 'green' | 'red' | 'blue' | 'default';
}

const colorMap = {
  orange: 'border-brand-600/30 bg-brand-600/5',
  green: 'border-green-600/30 bg-green-600/5',
  red: 'border-red-600/30 bg-red-600/5',
  blue: 'border-blue-600/30 bg-blue-600/5',
  default: 'border-dark-600',
};

export default function KpiCard({ title, value, subtitle, icon, trend, color = 'default' }: Props) {
  return (
    <div className={clsx('card-dark border', colorMap[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-dark-200 font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-dark-300 mt-1">{subtitle}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-dark-600">
          <span className={clsx('text-xs font-medium', trend.value >= 0 ? 'text-green-400' : 'text-red-400')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-dark-300 ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
