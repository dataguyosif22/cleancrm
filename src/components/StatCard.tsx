import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'slate' | 'amber' | 'red' | 'emerald';
  subtitle?: string;
}

const colorStyles: Record<StatCardProps['color'], { bg: string; icon: string; text: string }> = {
  slate: { bg: 'bg-slate-50', icon: 'text-slate-500', text: 'text-slate-900' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-500', text: 'text-amber-600' },
  red: { bg: 'bg-red-50', icon: 'text-red-500', text: 'text-red-600' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', text: 'text-emerald-600' },
};

export default function StatCard({ label, value, icon: Icon, color, subtitle }: StatCardProps) {
  const styles = colorStyles[color];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className={`w-9 h-9 ${styles.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${styles.icon}`} />
        </div>
      </div>
      <div className={`text-2xl font-bold ${styles.text}`}>{value}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
    </div>
  );
}
