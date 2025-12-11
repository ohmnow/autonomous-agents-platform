'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Zap,
  Gauge,
  Rocket,
  Clock,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ComplexityTier = 'simple' | 'standard' | 'production';

interface TierInfo {
  id: ComplexityTier;
  name: string;
  icon: React.ReactNode;
  featureRange: string;
  buildTime: string;
  description: string;
  defaultFeatures: number;
  color: string;
}

const TIERS: TierInfo[] = [
  {
    id: 'simple',
    name: 'Simple',
    icon: <Zap className="h-4 w-4" />,
    featureRange: '20-40',
    buildTime: '1-4 hours',
    description: 'Landing pages, prototypes, demos, single-feature apps',
    defaultFeatures: 30,
    color: 'text-green-500',
  },
  {
    id: 'standard',
    name: 'Standard',
    icon: <Gauge className="h-4 w-4" />,
    featureRange: '60-120',
    buildTime: '4-12 hours',
    description: 'Dashboards, blogs, small SaaS, CRUD apps',
    defaultFeatures: 80,
    color: 'text-blue-500',
  },
  {
    id: 'production',
    name: 'Production',
    icon: <Rocket className="h-4 w-4" />,
    featureRange: '150-250+',
    buildTime: '12-48+ hours',
    description: 'Full SaaS, complex apps, Claude.ai clones',
    defaultFeatures: 200,
    color: 'text-purple-500',
  },
];

interface ComplexityAdjusterProps {
  currentTier: ComplexityTier;
  inferredTier: ComplexityTier;
  targetFeatures: number;
  reasoning?: string;
  onSelect: (tier: ComplexityTier, features: number) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function ComplexityAdjuster({
  currentTier,
  inferredTier,
  targetFeatures,
  reasoning,
  onSelect,
  isExpanded = false,
  onToggle,
}: ComplexityAdjusterProps) {
  const [localTier, setLocalTier] = useState(currentTier);
  
  const selectedTier = TIERS.find(t => t.id === localTier);
  const isOverridden = localTier !== inferredTier;

  const handleSelect = (tier: ComplexityTier) => {
    setLocalTier(tier);
    const tierInfo = TIERS.find(t => t.id === tier);
    onSelect(tier, tierInfo?.defaultFeatures ?? 80);
  };

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronDown className="h-3 w-3" />
        Adjust complexity
      </Button>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">Complexity Tier</h4>
            {isOverridden && (
              <Badge variant="outline" className="text-xs">
                Overridden
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>

        {reasoning && (
          <p className="mb-3 text-xs text-muted-foreground">
            <strong>Why {inferredTier}?</strong> {reasoning}
          </p>
        )}

        <div className="space-y-2">
          {TIERS.map((tier) => (
            <button
              key={tier.id}
              onClick={() => handleSelect(tier.id)}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                localTier === tier.id
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent hover:bg-muted/50'
              )}
            >
              <div className={cn('mt-0.5', tier.color)}>
                {tier.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{tier.name}</span>
                  {tier.id === inferredTier && (
                    <Badge variant="secondary" className="text-[10px]">
                      Inferred
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {tier.description}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {tier.featureRange} features
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{tier.buildTime}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {isOverridden && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelect(inferredTier)}
            className="mt-3 w-full text-xs"
          >
            Reset to inferred ({inferredTier})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function getTierInfo(tier: ComplexityTier): TierInfo {
  return TIERS.find(t => t.id === tier) ?? TIERS[1];
}
