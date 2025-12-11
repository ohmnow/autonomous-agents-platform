'use client';

import { FEATURE_TEMPLATES, PROJECT_TYPES } from '@/lib/wizard/config';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Zap } from 'lucide-react';

interface StepFeaturesProps {
  projectType: string;
  selectedFeatures: string[];
  onToggleFeature: (featureId: string) => void;
  onSuggestFeatures: () => void;
}

function getComplexityColor(complexity: string) {
  switch (complexity) {
    case 'simple':
      return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
    case 'complex':
      return 'bg-red-500/10 text-red-600 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function StepFeatures({
  projectType,
  selectedFeatures,
  onToggleFeature,
  onSuggestFeatures,
}: StepFeaturesProps) {
  const project = PROJECT_TYPES.find((t) => t.id === projectType);

  // Group features by category
  const featuresByCategory = FEATURE_TEMPLATES.reduce(
    (acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    },
    {} as Record<string, typeof FEATURE_TEMPLATES>
  );

  return (
    <div className="space-y-6">
      {/* Header with suggestions */}
      <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Select the features you want in your app.{' '}
            <strong className="text-foreground">
              {selectedFeatures.length} selected
            </strong>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSuggestFeatures}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Suggest for {project?.name || 'Project'}
        </Button>
      </div>

      {/* Feature Categories */}
      <div className="space-y-8">
        {Object.entries(featuresByCategory).map(([category, features]) => (
          <div key={category}>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              {category}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const isSelected = selectedFeatures.includes(feature.id);
                const isRecommended = project?.suggestedFeatures.includes(feature.id);

                return (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => onToggleFeature(feature.id)}
                    className={cn(
                      'group relative flex flex-col items-start rounded-lg border p-3 text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'hover:border-primary/50 hover:bg-accent',
                      isRecommended && !isSelected && 'border-primary/30'
                    )}
                  >
                    {/* Selection indicator */}
                    <div
                      className={cn(
                        'absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>

                    {/* Content */}
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{feature.name}</h4>
                      {isRecommended && !isSelected && (
                        <Zap className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 pr-6">
                      {feature.description}
                    </p>

                    {/* Complexity badge */}
                    <Badge
                      variant="outline"
                      className={cn(
                        'mt-2 text-[10px]',
                        getComplexityColor(feature.complexity)
                      )}
                    >
                      {feature.complexity}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
