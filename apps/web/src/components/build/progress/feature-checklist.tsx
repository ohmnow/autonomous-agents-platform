'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Loader2, XCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { AgentEvent } from '@/hooks/use-event-stream';

interface Feature {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'testing' | 'passed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  testsPassed?: number;
  testsFailed?: number;
  durationMs?: number;
}

interface FeatureChecklistProps {
  events: AgentEvent[];
  className?: string;
  maxVisible?: number;
}

const statusConfig = {
  pending: {
    icon: Circle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Pending',
  },
  in_progress: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'In Progress',
  },
  testing: {
    icon: Loader2,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    label: 'Testing',
  },
  passed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Passed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Failed',
  },
};

export function FeatureChecklist({
  events,
  className,
  maxVisible = 10,
}: FeatureChecklistProps) {
  const [expanded, setExpanded] = useState(false);

  // Extract features from events
  const { features, progress } = useMemo(() => {
    const featureMap = new Map<string, Feature>();
    let completed = 0;
    let total = 0;

    for (const event of events) {
      // Handle feature_start events
      if (event.type === 'feature_start') {
        const featureId = event.featureId as string;
        featureMap.set(featureId, {
          id: featureId,
          title: (event.title as string) || (event.description as string) || `Feature ${featureId}`,
          description: event.description as string | undefined,
          status: 'in_progress',
          startedAt: event.timestamp,
        });
        total = Math.max(total, event.totalFeatures as number || 0);
      }

      // Handle feature_end events
      if (event.type === 'feature_end') {
        const featureId = event.featureId as string;
        const existing = featureMap.get(featureId);
        const success = event.success as boolean;

        featureMap.set(featureId, {
          ...existing,
          id: featureId,
          title: existing?.title || `Feature ${featureId}`,
          status: success ? 'passed' : 'failed',
          completedAt: event.timestamp,
          testsPassed: event.testsPassed as number | undefined,
          testsFailed: event.testsFailed as number | undefined,
          durationMs: event.durationMs as number | undefined,
        });

        if (success) completed++;
      }

      // Also check for progress events
      if (event.type === 'progress') {
        total = Math.max(total, event.total as number || 0);
        completed = Math.max(completed, event.completed as number || 0);
      }
    }

    // Sort features by status (in_progress first, then pending, then completed)
    const sortedFeatures = Array.from(featureMap.values()).sort((a, b) => {
      const order = { in_progress: 0, testing: 1, pending: 2, failed: 3, passed: 4 };
      return (order[a.status] || 5) - (order[b.status] || 5);
    });

    return {
      features: sortedFeatures,
      progress: { completed, total },
    };
  }, [events]);

  const percentComplete = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  const visibleFeatures = expanded ? features : features.slice(0, maxVisible);
  const hasMore = features.length > maxVisible;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Features</span>
          <span className="text-sm font-normal text-muted-foreground">
            {progress.completed} / {progress.total || '?'}
          </span>
        </CardTitle>
        {progress.total > 0 && (
          <Progress value={percentComplete} className="h-2 mt-2" />
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {features.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Waiting for features to be extracted...
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {visibleFeatures.map((feature, index) => (
                <FeatureItem
                  key={feature.id}
                  feature={feature}
                  index={index}
                />
              ))}
            </AnimatePresence>

            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-2 flex items-center justify-center gap-1 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{expanded ? 'Show less' : `Show ${features.length - maxVisible} more`}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform',
                    expanded && 'rotate-180'
                  )}
                />
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface FeatureItemProps {
  feature: Feature;
  index: number;
}

function FeatureItem({ feature, index }: FeatureItemProps) {
  const config = statusConfig[feature.status];
  const Icon = config.icon;
  const isActive = feature.status === 'in_progress' || feature.status === 'testing';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        layout: { duration: 0.2 },
      }}
      className={cn(
        'flex items-center gap-3 py-2 px-2 rounded-md transition-colors border-b last:border-0',
        isActive && config.bgColor,
        isActive && '-mx-2'
      )}
    >
      {/* Status Icon */}
      <motion.div
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Icon
          className={cn(
            'h-5 w-5',
            config.color,
            isActive && 'animate-spin'
          )}
        />
      </motion.div>

      {/* Feature Info */}
      <div className="flex-1 min-w-0">
        <motion.span
          className={cn(
            'text-sm block truncate',
            feature.status === 'passed' && 'line-through text-muted-foreground',
            feature.status === 'pending' && 'text-muted-foreground',
            isActive && 'font-medium'
          )}
        >
          {feature.title}
        </motion.span>

        {/* Additional info for active/completed */}
        {isActive && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground"
          >
            {feature.status === 'testing' ? 'Running tests...' : 'Building...'}
          </motion.span>
        )}

        {feature.status === 'passed' && feature.durationMs && (
          <span className="text-xs text-green-600">
            ✓ {formatDuration(feature.durationMs)}
          </span>
        )}

        {feature.status === 'failed' && (
          <span className="text-xs text-red-600">
            ✗ Failed
          </span>
        )}
      </div>
    </motion.div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
