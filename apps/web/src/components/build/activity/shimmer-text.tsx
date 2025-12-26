'use client';

import { cn } from '@/lib/utils';

interface ShimmerTextProps {
  children: React.ReactNode;
  className?: string;
  subtle?: boolean;
  active?: boolean;
}

/**
 * ShimmerText - Text with a shimmering gradient animation
 * 
 * Used to indicate active/in-progress states with a subtle,
 * modern animation effect.
 */
export function ShimmerText({
  children,
  className,
  subtle = false,
  active = true,
}: ShimmerTextProps) {
  return (
    <span
      className={cn(
        'inline-block',
        active && (subtle ? 'animate-shimmer-subtle' : 'animate-shimmer'),
        className
      )}
    >
      {children}
    </span>
  );
}
