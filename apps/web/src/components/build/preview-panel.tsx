'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  Play,
  Square,
  Copy,
  Check,
  Loader2,
  Clock,
  RefreshCw,
  Globe,
  AlertCircle,
} from 'lucide-react';

interface PreviewSession {
  buildId: string;
  sandboxId: string;
  outputUrl: string;
  port: number;
  framework: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'expired';
  expiresAt: string;
  startedAt: string;
}

interface PreviewPanelProps {
  buildId: string;
  buildStatus: string;
  artifactKey?: string | null;
  sandboxId?: string | null;
  outputUrl?: string | null;
}

export function PreviewPanel({
  buildId,
  buildStatus,
  artifactKey,
  sandboxId,
  outputUrl: initialOutputUrl,
}: PreviewPanelProps) {
  const [preview, setPreview] = useState<PreviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Check if preview is available/supported
  const isCompleted = buildStatus === 'COMPLETED';
  const hasArtifacts = !!artifactKey;
  const hasSandbox = !!sandboxId;
  const canPreview = isCompleted && (hasArtifacts || hasSandbox);

  // Fetch current preview status
  const fetchPreviewStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/builds/${buildId}/preview`);
      if (response.ok) {
        const data = await response.json();
        setPreview(data.preview || null);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch preview status:', err);
    }
  }, [buildId]);

  // Initial fetch
  useEffect(() => {
    if (isCompleted) {
      fetchPreviewStatus();
    }
  }, [isCompleted, fetchPreviewStatus]);

  // Update time remaining countdown
  useEffect(() => {
    if (!preview?.expiresAt) {
      setTimeRemaining(null);
      return;
    }

    const updateRemaining = () => {
      const expiresAt = new Date(preview.expiresAt);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining('Expired');
        setPreview(null);
        return;
      }

      const minutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${remainingMinutes}m remaining`);
      } else {
        setTimeRemaining(`${remainingMinutes}m remaining`);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [preview?.expiresAt]);

  // Start preview
  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/builds/${buildId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttlMinutes: 60 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to start preview');
      }

      setPreview(data.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop preview
  const handleStop = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/builds/${buildId}/preview`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to stop preview');
      }

      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Extend preview TTL
  const handleExtend = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/builds/${buildId}/preview`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalMinutes: 60 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extend preview');
      }

      setPreview(data.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    const url = preview?.outputUrl || initialOutputUrl;
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  // Open preview in new tab
  const handleOpenPreview = () => {
    const url = preview?.outputUrl || initialOutputUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Determine current state
  const isRunning = preview?.status === 'running';
  const isStarting = preview?.status === 'starting' || isLoading;
  const previewUrl = preview?.outputUrl || initialOutputUrl;

  // Show nothing if build not completed
  if (!isCompleted) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Live Preview
          {isRunning && (
            <Badge variant="success" className="ml-auto gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Running
            </Badge>
          )}
          {isStarting && (
            <Badge variant="info" className="ml-auto gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              {preview?.status === 'starting' ? 'Starting...' : 'Loading...'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 p-2 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isRunning && previewUrl && (
          <>
            {/* Preview URL */}
            <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
              <code className="flex-1 text-sm truncate text-muted-foreground">
                {previewUrl}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleCopyUrl}
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Time remaining */}
            {timeRemaining && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{timeRemaining}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleOpenPreview}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Preview
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleExtend}
                disabled={isLoading}
                title="Extend by 1 hour"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={handleStop}
                disabled={isLoading}
                title="Stop preview"
              >
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {!isRunning && !isStarting && (
          <>
            <div className="text-sm text-muted-foreground">
              {canPreview ? (
                hasSandbox ? (
                  'Start a live preview to interact with your built application.'
                ) : hasArtifacts ? (
                  'Start a preview from saved artifacts. A new sandbox will be created.'
                ) : (
                  'No artifacts available for preview.'
                )
              ) : (
                'Preview not available for this build.'
              )}
            </div>

            {canPreview && (
              <Button
                className="w-full"
                onClick={handleStart}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {hasSandbox ? 'Start Preview' : 'Start Preview (from artifacts)'}
              </Button>
            )}
          </>
        )}

        {isStarting && !isRunning && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">
              Starting preview server...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

