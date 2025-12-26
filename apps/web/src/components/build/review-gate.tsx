'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Check,
  Edit3,
  RefreshCw,
  Loader2,
  FileText,
  Code,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { FileViewer } from './file-viewer';
import { cn } from '@/lib/utils';

type GateType = 'design' | 'features';

interface ReviewGateProps {
  buildId: string;
  gateType: GateType;
  status: 'AWAITING_DESIGN_REVIEW' | 'AWAITING_FEATURE_REVIEW';
  onApprove: (gate: GateType, editedContent?: string) => Promise<void>;
  onRegenerate?: () => Promise<void>;
  className?: string;
}

export function ReviewGate({
  buildId,
  gateType,
  status,
  onApprove,
  onRegenerate,
  className,
}: ReviewGateProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filePath = gateType === 'design' 
    ? '/home/user/DESIGN.md' 
    : '/home/user/feature_list.json';
  
  const fileName = gateType === 'design' ? 'DESIGN.md' : 'feature_list.json';
  
  const gateInfo = {
    design: {
      title: 'Review Design Document',
      description: 'Review the generated DESIGN.md before continuing to feature list generation.',
      icon: FileText,
      nextStep: 'Generate feature list',
    },
    features: {
      title: 'Review Feature List',
      description: 'Review the feature list before starting the build. Make any edits needed.',
      icon: Code,
      nextStep: 'Start building',
    },
  };
  
  const info = gateInfo[gateType];
  const Icon = info.icon;

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);
    
    try {
      await onApprove(gateType, editedContent || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setIsApproving(false);
    }
  };

  const handleSave = useCallback(async (content: string) => {
    // Store the edited content locally
    setEditedContent(content);
    
    // Also save to sandbox
    try {
      const response = await fetch(`/api/builds/${buildId}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save file');
      }
    } catch (err) {
      console.error('Failed to save to sandbox:', err);
      throw err;
    }
  }, [buildId, filePath]);

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    
    setIsRegenerating(true);
    setError(null);
    
    try {
      await onRegenerate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Card className={cn('overflow-hidden border-amber-500/50', className)}>
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
            <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {info.title}
              <Badge variant="outline" className="text-amber-600 border-amber-400">
                Approval Required
              </Badge>
            </CardTitle>
            <CardDescription>{info.description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {/* File Viewer */}
        <FileViewer
          buildId={buildId}
          filePath={filePath}
          fileName={fileName}
          editable={true}
          onSave={handleSave}
          maxHeight="400px"
          autoRefresh={false}
        />

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isApproving || isRegenerating}
                className="gap-2"
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Regenerate
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleApprove}
            disabled={isApproving || isRegenerating}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Approve & {info.nextStep}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact review gate status badge for build monitor header
 */
interface ReviewGateBadgeProps {
  status: 'AWAITING_DESIGN_REVIEW' | 'AWAITING_FEATURE_REVIEW' | string;
}

export function ReviewGateBadge({ status }: ReviewGateBadgeProps) {
  if (status !== 'AWAITING_DESIGN_REVIEW' && status !== 'AWAITING_FEATURE_REVIEW') {
    return null;
  }

  const isDesign = status === 'AWAITING_DESIGN_REVIEW';
  
  return (
    <Badge 
      variant="outline" 
      className="gap-1.5 border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      {isDesign ? 'Design Review' : 'Feature Review'}
    </Badge>
  );
}

