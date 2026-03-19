import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant: 'danger' | 'warning' | 'success' | 'info';
}

const variantStyles = {
  danger: 'bg-status-danger-bg border-status-danger/20',
  warning: 'bg-status-warning-bg border-status-warning/20',
  success: 'bg-status-success-bg border-status-success/20',
  info: 'bg-status-info-bg border-status-info/20',
};

const iconStyles = {
  danger: 'text-status-danger',
  warning: 'text-status-warning',
  success: 'text-status-success',
  info: 'text-status-info',
};

export default function KpiCard({ title, value, icon: Icon, variant }: KpiCardProps) {
  return (
    <div className={cn(
      "rounded-lg border p-4 flex items-center gap-4",
      variantStyles[variant]
    )}>
      <div className={cn("p-2.5 rounded-lg bg-card", iconStyles[variant])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}
