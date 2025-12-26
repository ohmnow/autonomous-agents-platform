'use client';

import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TimeEstimateProps {
  estimatedRemainingMs?: number;
  elapsedMs?: number;
  averageFeatureDurationMs?: number;
  className?: string;
}

/**
 * Format milliseconds to human-readable duration
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return 'less than a minute';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 && minutes < 5
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  
  return `${seconds}s`;
}

/**
 * TimeEstimate - Shows estimated time remaining for build
 */
export function TimeEstimate({
  estimatedRemainingMs,
  elapsedMs,
  averageFeatureDurationMs,
  className,
}: TimeEstimateProps) {
  // Show component if we have any time data (including 0 elapsed)
  const hasEstimate = estimatedRemainingMs !== undefined && estimatedRemainingMs > 0;
  const hasElapsed = elapsedMs !== undefined && elapsedMs >= 0;
  
  if (!hasEstimate && !hasElapsed) {
    return null;
  }

  return (
    <div className={cn('space-y-2 text-sm', className)}>
      {/* Elapsed time - show first as it's always relevant when running */}
      {hasElapsed && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Elapsed:</span>
          <span className="font-medium">{formatDuration(elapsedMs!)}</span>
        </div>
      )}

      {/* Estimated remaining */}
      {hasEstimate && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Est. remaining:</span>
          <span className="font-medium">
            ~{formatDuration(estimatedRemainingMs!)}
          </span>
        </div>
      )}

      {/* Average per feature (helpful context) */}
      {averageFeatureDurationMs !== undefined && averageFeatureDurationMs > 0 && (
        <div className="text-xs text-muted-foreground">
          ~{formatDuration(averageFeatureDurationMs)} per feature
        </div>
      )}
    </div>
  );
}

/**
 * Compact time display for header
 */
export function TimeEstimateCompact({
  estimatedRemainingMs,
  className,
}: {
  estimatedRemainingMs?: number;
  className?: string;
}) {
  if (!estimatedRemainingMs || estimatedRemainingMs <= 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <Clock className="h-3 w-3" />
      <span>~{formatDuration(estimatedRemainingMs)} remaining</span>
    </div>
  );
}
