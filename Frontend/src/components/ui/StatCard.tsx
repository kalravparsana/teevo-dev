import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function StatCard({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  to: string;
}) {
  return (
    <Link to={to} className="group block h-full">
      <Card className="flex h-full min-h-[5.75rem] items-center transition-shadow group-hover:shadow-md">
        <div className="flex w-full items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-fairway-100 text-fairway-700">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-semibold tabular-nums leading-none text-fairway-900">
              {value}
            </p>
            <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-muted">
              {label}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
