'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  List,
  Sparkles,
  Palette,
} from 'lucide-react';

export interface FeatureListItem {
  category: 'functional' | 'style';
  description: string;
  steps: string[];
  passes: boolean;
}

interface FeatureListModalProps {
  features: FeatureListItem[];
  completed: number;
  total: number;
  className?: string;
}

/**
 * FeatureListModal - Shows full feature list in a modal overlay
 */
export function FeatureListModal({
  features,
  completed,
  total,
  className,
}: FeatureListModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<'all' | 'passed' | 'pending'>('all');

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedFeatures(newExpanded);
  };

  const filteredFeatures = features.filter((f) => {
    if (filter === 'passed') return f.passes;
    if (filter === 'pending') return !f.passes;
    return true;
  });

  const functionalCount = features.filter((f) => f.category === 'functional').length;
  const styleCount = features.filter((f) => f.category === 'style').length;
  const passedFunctional = features.filter((f) => f.category === 'functional' && f.passes).length;
  const passedStyle = features.filter((f) => f.category === 'style' && f.passes).length;

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className={cn('gap-1.5', className)}
        onClick={() => setIsOpen(true)}
      >
        <List className="h-3.5 w-3.5" />
        View All Features
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl flex" onClose={() => setIsOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Feature List</span>
              <Badge variant="outline" className="font-normal">
                {completed} / {total} completed
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {/* Summary stats - fixed height */}
          <div className="flex gap-4 py-2 px-6 border-b shrink-0">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">Functional:</span>
              <span className="font-medium">{passedFunctional}/{functionalCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Palette className="h-4 w-4 text-purple-500" />
              <span className="text-muted-foreground">Style:</span>
              <span className="font-medium">{passedStyle}/{styleCount}</span>
            </div>
          </div>

          {/* Filter tabs - fixed height */}
          <div className="flex gap-2 py-2 px-6 shrink-0">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({features.length})
            </Button>
            <Button
              variant={filter === 'passed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('passed')}
              className="gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Passed ({completed})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
              className="gap-1"
            >
              <Circle className="h-3 w-3" />
              Pending ({total - completed})
            </Button>
          </div>

          {/* Feature list - scrollable area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
            <div className="space-y-2 py-2">
              {filteredFeatures.map((feature, index) => {
                const originalIndex = features.indexOf(feature);
                const isExpanded = expandedFeatures.has(originalIndex);

                return (
                  <div
                    key={originalIndex}
                    className={cn(
                      'border rounded-lg transition-colors',
                      feature.passes
                        ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30'
                        : 'border-border bg-muted/30'
                    )}
                  >
                    {/* Feature header */}
                    <button
                      onClick={() => toggleExpanded(originalIndex)}
                      className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      {/* Status icon */}
                      <div className="mt-0.5">
                        {feature.passes ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      {/* Feature info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            #{originalIndex + 1}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              feature.category === 'functional'
                                ? 'border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400'
                                : 'border-purple-300 text-purple-700 dark:border-purple-800 dark:text-purple-400'
                            )}
                          >
                            {feature.category}
                          </Badge>
                        </div>
                        <p
                          className={cn(
                            'text-sm mt-1',
                            feature.passes && 'text-muted-foreground line-through'
                          )}
                        >
                          {feature.description}
                        </p>
                        {feature.steps.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {feature.steps.length} verification step{feature.steps.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>

                      {/* Expand icon */}
                      {feature.steps.length > 0 && (
                        <div className="mt-0.5">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </button>

                    {/* Expanded steps */}
                    {isExpanded && feature.steps.length > 0 && (
                      <div className="px-3 pb-3 pt-0 ml-7 border-t border-border/50 mt-1">
                        <p className="text-xs font-medium text-muted-foreground mb-2 pt-2">
                          Verification Steps:
                        </p>
                        <ol className="space-y-1.5">
                          {feature.steps.map((step, stepIndex) => (
                            <li
                              key={stepIndex}
                              className={cn(
                                'text-xs flex gap-2',
                                feature.passes 
                                  ? 'text-muted-foreground/60 line-through' 
                                  : 'text-muted-foreground'
                              )}
                            >
                              <span className="text-muted-foreground/60 shrink-0">
                                {stepIndex + 1}.
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredFeatures.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No features match the current filter.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Compact feature list preview for sidebar
 * Shows a "live stack" view with current/next feature at top
 * - Current feature being worked on appears at top (unchecked, highlighted)
 * - Recently completed features appear below (checked, faded)
 * - New features pop in at top as the build progresses
 */
export function FeatureListPreview({
  features,
  maxItems = 5,
  className,
  isComplete = false,
}: {
  features: FeatureListItem[];
  maxItems?: number;
  className?: string;
  isComplete?: boolean; // Whether the build is complete (no more active building)
}) {
  // Memoize the display features calculation to ensure stable references
  const displayFeatures = useMemo(() => {
    // Find the index of the first incomplete feature (current work item)
    const currentIndex = features.findIndex(f => !f.passes);
    
    // Build a window of features to display:
    // - Current feature at top (if any, and only if build is not complete)
    // - Then recently completed features below
    const result: Array<{ feature: FeatureListItem; originalIndex: number; isCurrent: boolean }> = [];
    
    // When build is complete, don't mark any feature as "current" (no Building... animation)
    const hasActiveBuild = !isComplete && currentIndex >= 0;
    
    if (hasActiveBuild) {
      // Add current feature first (build is still running)
      result.push({
        feature: features[currentIndex],
        originalIndex: currentIndex,
        isCurrent: true,
      });
      
      // Add recently completed features (those just before current)
      // Show them in reverse order (most recently completed first)
      for (let i = currentIndex - 1; i >= 0 && result.length < maxItems; i--) {
        result.push({
          feature: features[i],
          originalIndex: i,
          isCurrent: false,
        });
      }
    } else if (currentIndex >= 0) {
      // Build is complete but some features didn't pass - show incomplete features first
      // but without "Building..." indicator
      result.push({
        feature: features[currentIndex],
        originalIndex: currentIndex,
        isCurrent: false, // Not building anymore
      });
      
      // Add recently completed features
      for (let i = currentIndex - 1; i >= 0 && result.length < maxItems; i--) {
        result.push({
          feature: features[i],
          originalIndex: i,
          isCurrent: false,
        });
      }
    } else {
      // All features complete - show the last N completed features
      for (let i = features.length - 1; i >= 0 && result.length < maxItems; i--) {
        result.push({
          feature: features[i],
          originalIndex: i,
          isCurrent: false,
        });
      }
    }
    
    return result;
  }, [features, maxItems, isComplete]);

  return (
    <div className={cn('space-y-2', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        {displayFeatures.map(({ feature, originalIndex, isCurrent }, displayIndex) => (
          <motion.div
            key={`feature-${originalIndex}`}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ 
              duration: 0.3,
              delay: displayIndex * 0.05,
              layout: { duration: 0.2 }
            }}
            className={cn(
              'flex items-start gap-2 text-sm',
              isCurrent && 'bg-primary/5 -mx-2 px-2 py-1.5 rounded-md border border-primary/20'
            )}
          >
            {feature.passes ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
              </motion.div>
            ) : isCurrent ? (
              // Animated indicator for current feature
              <div className="relative flex h-3.5 w-3.5 items-center justify-center mt-0.5 shrink-0">
                <div className="absolute h-3.5 w-3.5 rounded-full bg-primary/30 animate-ping" />
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  'truncate block',
                  feature.passes && 'text-muted-foreground line-through',
                  isCurrent && 'font-medium text-foreground'
                )}
              >
                {feature.description}
              </span>
              {isCurrent && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-primary animate-pulse"
                >
                  Building...
                </motion.span>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              #{originalIndex + 1}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {displayFeatures.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-2">
          Waiting for feature list...
        </div>
      )}
    </div>
  );
}
