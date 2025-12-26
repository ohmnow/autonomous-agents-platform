'use client';

import { cn } from '@/lib/utils';
import { ShimmerText } from './shimmer-text';
import { ActivityIndicator } from './activity-indicator';
import { TimeEstimateCompact } from './time-estimate';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Square,
} from 'lucide-react';

type BuildStatus = 'PENDING' | 'INITIALIZING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

interface BuildStatusHeaderProps {
  status: BuildStatus;
  activity?: string;
  activityDetail?: string;
  progress?: {
    completed: number;
    total: number;
  };
  estimatedRemainingMs?: number;
  className?: string;
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    color: 'bg-zinc-500',
    textColor: 'text-zinc-400',
    icon: Clock,
  },
  INITIALIZING: {
    label: 'Initializing',
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    icon: Loader2,
  },
  RUNNING: {
    label: 'Running',
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    icon: Loader2,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    icon: CheckCircle,
  },
  FAILED: {
    label: 'Failed',
    color: 'bg-red-500',
    textColor: 'text-red-400',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    icon: Square,
  },
};

/**
 * BuildStatusHeader - Shows build status with activity and time estimate
 */
export function BuildStatusHeader({
  status,
  activity,
  activityDetail,
  progress,
  estimatedRemainingMs,
  className,
}: BuildStatusHeaderProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isRunning = status === 'RUNNING' || status === 'INITIALIZING';

  return (
    <div className={cn('space-y-3', className)}>
      {/* Status badge row */}
      <div className="flex items-center justify-between">
        <Badge className={cn(config.color, 'text-white gap-1.5')}>
          <Icon className={cn('h-3 w-3', isRunning && 'animate-spin')} />
          {isRunning ? (
            <ShimmerText>{config.label}</ShimmerText>
          ) : (
            config.label
          )}
        </Badge>

        {/* Progress counter */}
        {progress && (
          <span className="text-sm text-muted-foreground">
            {progress.completed} / {progress.total} features
          </span>
        )}
      </div>

      {/* Activity indicator (only when running) */}
      {isRunning && activity && (
        <ActivityIndicator
          activity={activity}
          detail={activityDetail}
          isActive={true}
        />
      )}

      {/* Time estimate */}
      {isRunning && (
        <TimeEstimateCompact estimatedRemainingMs={estimatedRemainingMs} />
      )}
    </div>
  );
}
