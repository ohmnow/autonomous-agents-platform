'use client';

import { cn } from '@/lib/utils';
import { ShimmerText } from './shimmer-text';

interface ActivityIndicatorProps {
  activity: string;
  detail?: string;
  isActive?: boolean;
  className?: string;
  showSpinner?: boolean;
}

/**
 * ActivityIndicator - Shows current agent activity with shimmer effect
 * 
 * Displays what the agent is currently doing with a subtle shimmer
 * animation and optional spinner.
 */
export function ActivityIndicator({
  activity,
  detail,
  isActive = true,
  className,
  showSpinner = true,
}: ActivityIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Animated spinner/pulse indicator */}
      {showSpinner && isActive && (
        <div className="relative flex h-4 w-4 items-center justify-center">
          {/* Outer pulsing ring */}
          <div className="absolute h-4 w-4 rounded-full bg-primary/30 animate-pulse-ring" />
          {/* Inner solid dot */}
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
      )}
      
      {/* Activity text with shimmer */}
      <div className="flex flex-col">
        <ShimmerText
          active={isActive}
          className={cn(
            'text-sm font-medium',
            !isActive && 'text-muted-foreground'
          )}
        >
          {activity}
        </ShimmerText>
        
        {detail && (
          <span className="text-xs text-muted-foreground truncate max-w-[300px]">
            {detail}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact activity indicator for inline use
 */
export function ActivityIndicatorCompact({
  activity,
  isActive = true,
  className,
}: {
  activity: string;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isActive && (
        <div className="relative flex h-3 w-3 items-center justify-center">
          <div className="absolute h-3 w-3 rounded-full bg-primary/30 animate-pulse-ring" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        </div>
      )}
      <ShimmerText active={isActive} className="text-xs">
        {activity}
      </ShimmerText>
    </div>
  );
}
