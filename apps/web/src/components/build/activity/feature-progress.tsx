'use client';

import { cn } from '@/lib/utils';
import { ShimmerText } from './shimmer-text';
import { CheckCircle, XCircle, Circle } from 'lucide-react';
// Note: CheckCircle used in both FeatureProgress (for passed features) and FeatureProgressCompact (for completion state)

type FeatureStatus = 'pending' | 'in_progress' | 'testing' | 'passed' | 'failed';

interface Feature {
  id: string;
  title: string;
  status: FeatureStatus;
  testsPassed?: number;
  testsFailed?: number;
}

interface FeatureProgressProps {
  features: Feature[];
  currentFeatureId?: string;
  className?: string;
}

/**
 * FeatureProgress - Shows feature completion with shimmer for active feature
 */
export function FeatureProgress({
  features,
  currentFeatureId,
  className,
}: FeatureProgressProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {features.map((feature, index) => {
        const isActive = feature.id === currentFeatureId || feature.status === 'in_progress' || feature.status === 'testing';
        
        return (
          <FeatureItem
            key={feature.id}
            feature={feature}
            index={index + 1}
            isActive={isActive}
          />
        );
      })}
    </div>
  );
}

interface FeatureItemProps {
  feature: Feature;
  index: number;
  isActive: boolean;
}

function FeatureItem({ feature, index, isActive }: FeatureItemProps) {
  const statusConfig = {
    pending: {
      icon: Circle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
    in_progress: {
      icon: Circle,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    testing: {
      icon: Circle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    passed: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    failed: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  };

  const config = statusConfig[feature.status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
        isActive && config.bgColor
      )}
    >
      {/* Status icon or spinner */}
      <div className="relative flex h-5 w-5 items-center justify-center">
        {isActive && (feature.status === 'in_progress' || feature.status === 'testing') ? (
          <>
            <div className="absolute h-5 w-5 rounded-full bg-primary/30 animate-pulse-ring" />
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          </>
        ) : (
          <Icon className={cn('h-5 w-5', config.color)} />
        )}
      </div>

      {/* Feature info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">#{index}</span>
          {isActive ? (
            <ShimmerText className="text-sm font-medium truncate">
              {feature.title}
            </ShimmerText>
          ) : (
            <span
              className={cn(
                'text-sm truncate',
                feature.status === 'passed' && 'text-muted-foreground line-through',
                feature.status === 'pending' && 'text-muted-foreground'
              )}
            >
              {feature.title}
            </span>
          )}
        </div>

        {/* Status text for active features */}
        {isActive && (
          <ShimmerText subtle className="text-xs text-muted-foreground">
            {feature.status === 'testing' ? 'Running tests...' : 'Building...'}
          </ShimmerText>
        )}

        {/* Test results for completed */}
        {feature.status === 'passed' && feature.testsPassed !== undefined && (
          <span className="text-xs text-green-600">
            {feature.testsPassed} tests passed
          </span>
        )}
        {feature.status === 'failed' && feature.testsFailed !== undefined && (
          <span className="text-xs text-red-600">
            {feature.testsFailed} tests failed
          </span>
        )}
      </div>
    </div>
  );
}

/** Planning phase for more granular UI feedback */
export type PlanningPhase = 'none' | 'researching' | 'designing' | 'generating';

/** Phase-specific display configuration */
const PHASE_CONFIG: Record<PlanningPhase, { message: string; detail: string; color: string }> = {
  none: { message: 'Analyzing...', detail: '', color: 'bg-primary' },
  researching: { 
    message: 'Researching design...', 
    detail: 'Finding inspiration from top sites',
    color: 'bg-blue-500'
  },
  designing: { 
    message: 'Creating design system...', 
    detail: 'Building DESIGN.md with tokens & theme',
    color: 'bg-purple-500'
  },
  generating: { 
    message: 'Generating feature list...', 
    detail: 'Creating comprehensive test cases',
    color: 'bg-amber-500'
  },
};

/**
 * Compact feature list for sidebar
 * Shows current activity when no detailed features are available
 */
export function FeatureProgressCompact({
  completed,
  total,
  currentFeature,
  isGeneratingFeatureList,
  planningPhase = 'generating',
  className,
}: {
  completed: number;
  total: number;
  currentFeature?: string;
  isGeneratingFeatureList?: boolean;
  planningPhase?: PlanningPhase;
  className?: string;
}) {
  const isActive = total === 0 || completed < total;
  
  // Check if we're in the feature list generation phase (legacy support)
  const showGeneratingMessage = isGeneratingFeatureList || 
    (total === 0 && currentFeature?.toLowerCase().includes('feature list'));
  
  // Get phase configuration
  const phaseConfig = total === 0 && showGeneratingMessage 
    ? PHASE_CONFIG[planningPhase] 
    : PHASE_CONFIG.none;
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* Status message */}
      {total === 0 ? (
        showGeneratingMessage ? (
          // Planning phase in progress - show phase-specific UI
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="relative flex h-3 w-3 items-center justify-center">
                <div className={cn("absolute h-3 w-3 rounded-full animate-pulse-ring", `${phaseConfig.color}/30`)} />
                <div className={cn("h-1.5 w-1.5 rounded-full", phaseConfig.color)} />
              </div>
              <ShimmerText>{phaseConfig.message}</ShimmerText>
            </div>
            <p className="text-xs text-muted-foreground pl-5">
              {phaseConfig.detail}
            </p>
          </div>
        ) : (
          // Just analyzing
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="relative flex h-3 w-3 items-center justify-center">
              <div className="absolute h-3 w-3 rounded-full bg-primary/30 animate-pulse-ring" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <span>Analyzing project...</span>
          </div>
        )
      ) : completed === total ? (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>All features complete!</span>
        </div>
      ) : (
        /* Current feature or activity */
        currentFeature && (
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3 items-center justify-center shrink-0">
              <div className="absolute h-3 w-3 rounded-full bg-primary/30 animate-pulse-ring" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
            <ShimmerText className="text-sm truncate">
              {currentFeature}
            </ShimmerText>
          </div>
        )
      )}
      
      {/* Completion summary */}
      {total > 0 && isActive && (
        <p className="text-xs text-muted-foreground">
          {completed} of {total} features implemented
        </p>
      )}
    </div>
  );
}
