import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

export function DashboardPanel({
  title,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn('flex h-full min-w-0 flex-col', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-fairway-900">
          {Icon && <Icon className="h-5 w-5 shrink-0 text-fairway-700" aria-hidden />}
          {title}
        </h2>
        {action}
      </div>
      <div className={cn('min-h-0 flex-1', contentClassName)}>{children}</div>
    </Card>
  );
}
