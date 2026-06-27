import { Building2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type ClubLogoSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<ClubLogoSize, string> = {
  sm: 'h-10 w-10 rounded-lg',
  md: 'h-14 w-14 rounded-xl',
  lg: 'h-20 w-20 rounded-2xl',
};

const iconSizes: Record<ClubLogoSize, string> = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-10 w-10',
};

export function ClubLogo({
  name,
  logoUrl,
  size = 'md',
  className,
}: {
  name: string;
  logoUrl: string | null;
  size?: ClubLogoSize;
  className?: string;
}) {
  const shell = cn(
    'flex shrink-0 items-center justify-center overflow-hidden border border-sand-300/70 bg-fairway-50',
    sizeClasses[size],
    className,
  );

  if (logoUrl) {
    return (
      <div className={shell}>
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={shell}>
      <Building2 className={cn('text-fairway-700', iconSizes[size])} aria-hidden />
      <span className="sr-only">{name} logo unavailable</span>
    </div>
  );
}
