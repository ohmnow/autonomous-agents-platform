'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Sparkles,
  Eye,
  Play,
  Clock,
  Hash,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ComplexityAdjuster, getTierInfo, type ComplexityTier } from './complexity-adjuster';
import { cn } from '@/lib/utils';

interface SpecReviewPanelProps {
  appName: string;
  appDescription: string;
  appSpec: string | null;
  inferredComplexity: {
    tier: ComplexityTier;
    features: number;
    reasoning: string;
  };
  isExpanding: boolean;
  onAdjustComplexity: (tier: ComplexityTier, features: number) => void;
  onViewSpec: () => void;
  onStartBuild: (reviewGatesEnabled?: boolean) => void;
  onRegenerate?: () => void;
  isBuilding: boolean;
  reviewGatesEnabled?: boolean;
  onReviewGatesChange?: (enabled: boolean) => void;
}

export function SpecReviewPanel({
  appName,
  appDescription,
  appSpec,
  inferredComplexity,
  isExpanding,
  onAdjustComplexity,
  onViewSpec,
  onStartBuild,
  onRegenerate,
  isBuilding,
  reviewGatesEnabled = false,
  onReviewGatesChange,
}: SpecReviewPanelProps) {
  const [showComplexityAdjuster, setShowComplexityAdjuster] = useState(false);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [currentTier, setCurrentTier] = useState(inferredComplexity.tier);
  const [currentFeatures, setCurrentFeatures] = useState(inferredComplexity.features);
  const [localReviewGates, setLocalReviewGates] = useState(reviewGatesEnabled);

  const handleReviewGatesToggle = (checked: boolean) => {
    setLocalReviewGates(checked);
    onReviewGatesChange?.(checked);
  };

  const tierInfo = getTierInfo(currentTier);
  const isOverridden = currentTier !== inferredComplexity.tier;

  const handleComplexityChange = (tier: ComplexityTier, features: number) => {
    setCurrentTier(tier);
    setCurrentFeatures(features);
    onAdjustComplexity(tier, features);
  };

  // Calculate spec stats
  const specLineCount = appSpec?.split('\n').length ?? 0;
  const specSizeKB = appSpec ? Math.round(appSpec.length / 1024) : 0;
  const isXmlSpec = appSpec?.includes('<project_specification>') ?? false;

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">{appName}</CardTitle>
              <CardDescription>App Specification Generated</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {/* Complexity Summary */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Planned as</span>
              {isOverridden && (
                <Badge variant="outline" className="text-xs">
                  Adjusted
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className={cn('text-lg font-bold', tierInfo.color)}>
                {tierInfo.name}
              </span>
              <span className="text-muted-foreground">application</span>
            </div>
            
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Hash className="h-4 w-4" />
                ~{currentFeatures} features
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {tierInfo.buildTime}
              </span>
            </div>

            {!isOverridden && inferredComplexity.reasoning && (
              <p className="mt-2 text-xs text-muted-foreground">
                {inferredComplexity.reasoning}
              </p>
            )}
          </div>

          {/* Spec Status */}
          {isExpanding ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating full specification...
            </div>
          ) : appSpec ? (
            <div className="space-y-2">
              <div className="flex items-center gap-4 rounded-lg border p-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {isXmlSpec ? 'Full XML Specification' : 'App Description'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {specLineCount} lines • {specSizeKB} KB
                    {!isXmlSpec && ' • Markdown format'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSpecModal(true)}
                  className="gap-1"
                >
                  <Eye className="h-3 w-3" />
                  View
                </Button>
              </div>
              
              {/* Warning if not XML */}
              {!isXmlSpec && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span>Spec is in markdown format. Click Regenerate to generate XML specification.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Specification will be generated from your app description
            </div>
          )}

          <Separator />

          {/* Complexity Adjuster */}
          <ComplexityAdjuster
            currentTier={currentTier}
            inferredTier={inferredComplexity.tier}
            targetFeatures={currentFeatures}
            reasoning={inferredComplexity.reasoning}
            onSelect={handleComplexityChange}
            isExpanded={showComplexityAdjuster}
            onToggle={() => setShowComplexityAdjuster(!showComplexityAdjuster)}
          />

          {/* Review Gates Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="review-gates" className="text-sm font-medium cursor-pointer">
                Review checkpoints
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p>Pause the build after generating DESIGN.md and feature list to review and edit before continuing.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="review-gates"
              checked={localReviewGates}
              onCheckedChange={handleReviewGatesToggle}
            />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {/* Regenerate Button */}
            {onRegenerate && (
              <Button
                onClick={onRegenerate}
                disabled={isBuilding || isExpanding}
                variant="outline"
                className="w-full gap-2"
              >
                {isExpanding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate Specification
                  </>
                )}
              </Button>
            )}
            
            {/* Build Button */}
            <Button
              onClick={() => onStartBuild(localReviewGates)}
              disabled={isBuilding || isExpanding || !appSpec || !isXmlSpec}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isBuilding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting Build...
                </>
              ) : isExpanding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Spec...
                </>
              ) : !isXmlSpec ? (
                <>
                  <Play className="h-4 w-4" />
                  Regenerate to Build
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Build
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full Spec Modal */}
      <Dialog open={showSpecModal} onOpenChange={setShowSpecModal}>
        <DialogContent className="max-w-4xl" onClose={() => setShowSpecModal(false)}>
          <DialogHeader>
            <DialogTitle>
              {isXmlSpec ? 'Full App Specification' : 'App Description (Markdown)'}
            </DialogTitle>
            <DialogDescription>
              {isXmlSpec 
                ? 'This XML specification will be used to build your application.'
                : 'This is the app description. Click "Regenerate" to generate the full XML specification.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-xs">
              {appSpec}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
