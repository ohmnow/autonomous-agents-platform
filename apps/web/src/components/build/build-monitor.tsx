'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEventStream } from '@/hooks/use-event-stream';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShimmerText,
  ActivityIndicator,
  FeatureProgress,
  FeatureProgressCompact,
  TimeEstimate,
  FeatureListModal,
  FeatureListPreview,
} from './activity';
import { ActivityFeed } from './activity-feed';
import { PreviewPanel } from './preview-panel';
import { ReviewGate, ReviewGateBadge } from './review-gate';
import {
  Square,
  Download,
  Clock,
  Rocket,
  CheckCircle,
  XCircle,
  Loader2,
  FileArchive,
  FileText,
  Terminal,
  Activity,
  FolderTree,
  Pause,
  Play,
  Copy,
  Check,
} from 'lucide-react';

interface BuildProgress {
  completed: number;
  total: number;
  features?: Array<{
    id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'passed' | 'failed';
  }>;
}

interface Build {
  id: string;
  name: string;
  status: string;
  appSpec: string;
  createdAt: Date;
  progress: BuildProgress;
  artifactKey?: string;
  sandboxId?: string;
  outputUrl?: string;
}

interface BuildMonitorProps {
  build: Build;
}

type ViewMode = 'activity' | 'logs' | 'files';

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-zinc-500', icon: Clock },
  INITIALIZING: { label: 'Initializing', color: 'bg-blue-500', icon: Loader2 },
  RUNNING: { label: 'Running', color: 'bg-blue-500', icon: Loader2 },
  PAUSED: { label: 'Paused', color: 'bg-amber-500', icon: Pause },
  AWAITING_DESIGN_REVIEW: { label: 'Design Review', color: 'bg-amber-500', icon: Clock },
  AWAITING_FEATURE_REVIEW: { label: 'Feature Review', color: 'bg-amber-500', icon: Clock },
  COMPLETED: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'bg-red-500', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-yellow-500', icon: Square },
};

export function BuildMonitor({ build }: BuildMonitorProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(build.status);
  const [viewMode, setViewMode] = useState<ViewMode>('activity');
  const [isStopping, setIsStopping] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isPausePending, setIsPausePending] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [artifactInfo, setArtifactInfo] = useState<{
    size: number;
    lastModified: string;
  } | null>(null);
  const [logsCopied, setLogsCopied] = useState(false);
  // Track artifact and sandbox info that may update after completion
  const [currentArtifactKey, setCurrentArtifactKey] = useState(build.artifactKey);
  const [currentSandboxId, setCurrentSandboxId] = useState(build.sandboxId);
  const [currentOutputUrl, setCurrentOutputUrl] = useState(build.outputUrl);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Use the new event stream hook with initial progress from database
  const {
    events,
    structuredEvents,
    currentActivity,
    currentActivityDetail,
    features,
    currentFeatureId,
    featureList,
    progress,
    elapsedMs,
    estimatedRemainingMs,
    averageFeatureDurationMs,
    filesCreated,
    connectionState,
    isConnected,
    isLive,
    isComplete,
    buildStatus: sseStatus,
    errors,
  } = useEventStream({ 
    buildId: build.id,
    initialProgress: build.progress,
    initialStatus: build.status,
  });
  
  // Update status when SSE reports a review gate state
  useEffect(() => {
    if (sseStatus && (sseStatus === 'AWAITING_DESIGN_REVIEW' || sseStatus === 'AWAITING_FEATURE_REVIEW')) {
      setCurrentStatus(sseStatus);
    }
  }, [sseStatus]);

  // With newest-first ordering, no auto-scroll needed - new logs appear at top
  // Keep the ref for potential future use
  useEffect(() => {
    // No-op - newest logs are at top now
  }, [events, viewMode]);

  // Update status from events
  useEffect(() => {
    const lastEvent = events[events.length - 1];
    if (lastEvent) {
      const message = (lastEvent.message as string) || '';
      if (message.includes('Build completed successfully')) {
        setCurrentStatus('COMPLETED');
      } else if (message.includes('Build failed')) {
        setCurrentStatus('FAILED');
      } else if (message.includes('Build stopped by user')) {
        setCurrentStatus('CANCELLED');
      }
      
      // Check for review gate events (emitted when build pauses for approval)
      if (lastEvent.type === 'review_gate') {
        const gate = lastEvent.gate as string;
        if (gate === 'design') {
          setCurrentStatus('AWAITING_DESIGN_REVIEW');
        } else if (gate === 'features') {
          setCurrentStatus('AWAITING_FEATURE_REVIEW');
        }
      }
    }
  }, [events]);

  // When SSE signals completion, update status and refetch build data
  useEffect(() => {
    if (isComplete && currentStatus === 'RUNNING') {
      // Update status immediately
      setCurrentStatus('COMPLETED');
      
      // Refetch build data to get artifact key, sandbox ID, etc.
      fetch(`/api/builds/${build.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.build) {
            if (data.build.artifactKey) {
              setCurrentArtifactKey(data.build.artifactKey);
            }
            if (data.build.sandboxId) {
              setCurrentSandboxId(data.build.sandboxId);
            }
            if (data.build.outputUrl) {
              setCurrentOutputUrl(data.build.outputUrl);
            }
            if (data.build.status) {
              setCurrentStatus(data.build.status);
            }
          }
        })
        .catch(console.error);
    }
  }, [isComplete, currentStatus, build.id]);

  // Fetch artifact info when build is completed and we have an artifact key
  useEffect(() => {
    if (currentStatus === 'COMPLETED' && currentArtifactKey) {
      fetch(`/api/builds/${build.id}/download?info=true`)
        .then((res) => res.json())
        .then((data) => {
          if (data.size) {
            setArtifactInfo({
              size: data.size,
              lastModified: data.lastModified,
            });
          }
        })
        .catch(console.error);
    }
  }, [currentStatus, build.id, currentArtifactKey]);

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await fetch(`/api/builds/${build.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      setCurrentStatus('CANCELLED');
    } catch (error) {
      console.error('Failed to stop build:', error);
    } finally {
      setIsStopping(false);
    }
  };

  const handleRestart = async () => {
    const shouldProceed = confirm(
      isRunning
        ? 'This will stop the current build and start a new run. Continue?'
        : 'Start a new run for this build?'
    );
    if (!shouldProceed) return;

    setIsRestarting(true);
    try {
      const res = await fetch(`/api/builds/${build.id}/restart`, { method: 'POST' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to restart build');
      }
      const data = await res.json();
      const newBuildId = data?.build?.id as string | undefined;
      if (!newBuildId) throw new Error('Restart failed: missing new build id');
      router.push(`/builds/${newBuildId}`);
    } catch (e) {
      console.error(e);
      alert('Failed to restart build. Check server logs for details.');
    } finally {
      setIsRestarting(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      window.location.href = `/api/builds/${build.id}/download`;
    } finally {
      setTimeout(() => setIsDownloading(false), 2000);
    }
  };

  const handleCopyLogs = async () => {
    const logEvents = events.filter((e) => e.type === 'log' || e.message);
    const formattedLogs = logEvents.map((event) => {
      const timestamp = new Date(event.timestamp as string).toLocaleTimeString();
      const level = ((event.level as string) || 'info').toUpperCase();
      const message = (event.message as string) || '';
      return `[${timestamp}] [${level}] ${message}`;
    }).join('\n');
    
    try {
      await navigator.clipboard.writeText(formattedLogs || 'No logs available');
      setLogsCopied(true);
      setTimeout(() => setLogsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy logs:', error);
    }
  };

  const handlePause = async () => {
    setIsPausing(true);
    setIsPausePending(true);
    try {
      const res = await fetch(`/api/builds/${build.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to pause build');
      }
      setCurrentStatus('PAUSED');
      setIsPausePending(false);
    } catch (error) {
      console.error('Failed to pause build:', error);
      setIsPausePending(false);
    } finally {
      setIsPausing(false);
    }
  };

  const handleResume = async () => {
    setIsResuming(true);
    try {
      const res = await fetch(`/api/builds/${build.id}/resume`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || 'Failed to resume build');
      }
      setCurrentStatus('RUNNING');
    } catch (error) {
      console.error('Failed to resume build:', error);
    } finally {
      setIsResuming(false);
    }
  };

  const handleApprove = async (gate: 'design' | 'features', editedContent?: string) => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/builds/${build.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gate, editedContent }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve');
      }
      setCurrentStatus('RUNNING');
    } catch (error) {
      console.error('Failed to approve:', error);
      throw error;
    } finally {
      setIsApproving(false);
    }
  };

  const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.PENDING;
  const isAwaitingReview = currentStatus === 'AWAITING_DESIGN_REVIEW' || currentStatus === 'AWAITING_FEATURE_REVIEW';
  const StatusIcon = statusInfo.icon;
  const isRunning = ['RUNNING', 'INITIALIZING'].includes(currentStatus);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Convert features to the expected format
  const displayFeatures = features.map((f) => ({
    id: f.id,
    title: f.title,
    status: f.status,
    testsPassed: f.testsPassed,
    testsFailed: f.testsFailed,
  }));

  // Detect the current planning sub-phase for more accurate UI feedback
  const planningPhase = useMemo((): 'none' | 'researching' | 'designing' | 'generating' => {
    if (progress.total > 0) return 'none'; // Already have features, planning is done
    
    // Check recent events/activity for phase signals (most recent first)
    const recentEvents = events.slice(-30);
    
    // Check from newest to oldest to find the current phase
    for (let i = recentEvents.length - 1; i >= 0; i--) {
      const message = (recentEvents[i].message as string || '').toLowerCase();
      
      // Feature list generation (happens after design)
      if (message.includes('feature_list.json') || 
          message.includes('feature list created') ||
          message.includes('creating test cases') ||
          (message.includes('generating') && message.includes('feature'))) {
        return 'generating';
      }
      
      // Design system creation (happens after research)
      if (message.includes('design.md') || 
          message.includes('creating design') ||
          message.includes('design system') ||
          message.includes('design decisions')) {
        return 'designing';
      }
      
      // Design research (happens first for UI projects)
      if (message.includes('researching') || 
          message.includes('design patterns') ||
          message.includes('framer template') ||
          message.includes('finding inspiration') ||
          message.includes('reference designs')) {
        return 'researching';
      }
    }
    
    // Check current activity as fallback
    const activity = currentActivity?.toLowerCase() || '';
    if (activity.includes('feature list')) return 'generating';
    if (activity.includes('design')) return activity.includes('research') ? 'researching' : 'designing';
    
    // Default: assume generating if in planning phase with no specific signals
    return 'generating';
  }, [events, progress.total, currentActivity]);
  
  // Legacy compatibility: isGeneratingFeatureList is true when in any planning phase
  const isGeneratingFeatureList = planningPhase !== 'none';
  
  // Get phase-specific message for UI
  const planningPhaseMessage = useMemo(() => {
    switch (planningPhase) {
      case 'researching':
        return { main: 'Researching design...', detail: 'Finding inspiration from top sites' };
      case 'designing':
        return { main: 'Creating design system...', detail: 'Building DESIGN.md with tokens & theme' };
      case 'generating':
        return { main: 'Generating feature list...', detail: 'This may take a few minutes' };
      default:
        return { main: 'Analyzing...', detail: undefined };
    }
  }, [planningPhase]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{build.name}</h1>
          <p className="text-sm text-muted-foreground">
            Build ID: {build.id}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Status Badge with Shimmer when running */}
          <Badge className={`${statusInfo.color} text-white gap-1.5`}>
            <StatusIcon className={`h-3 w-3 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? (
              <ShimmerText>{statusInfo.label}</ShimmerText>
            ) : (
              statusInfo.label
            )}
          </Badge>
          <ReviewGateBadge status={currentStatus} />
          
          {isRunning && (
            <>
              <Button
                variant={isPausePending ? "secondary" : "outline"}
                size="sm"
                onClick={handlePause}
                disabled={isPausing || isPausePending}
                title={isPausePending 
                  ? "Waiting for current operation to complete before pausing..." 
                  : "Pause the build and save checkpoint for later resumption"
                }
                className={isPausePending ? "animate-pulse" : ""}
              >
                {isPausing || isPausePending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="mr-2 h-4 w-4" />
                )}
                {isPausePending ? "Pausing..." : "Pause"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStop}
                disabled={isStopping || isPausePending}
              >
                {isStopping ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Square className="mr-2 h-4 w-4" />
                )}
                Stop
              </Button>
            </>
          )}
          {(currentStatus === 'PAUSED' || currentStatus === 'FAILED' || (currentStatus === 'CANCELLED' && currentArtifactKey)) && (
            <Button
              variant="default"
              size="sm"
              onClick={handleResume}
              disabled={isResuming}
              title="Resume build from last checkpoint"
            >
              {isResuming ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Resume
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRestart}
            disabled={isRestarting}
            title="Start a fresh build from the beginning"
          >
            {isRestarting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            Restart
          </Button>
          {currentStatus === 'COMPLETED' && currentArtifactKey && (
            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Activity Status (when running) */}
      {isRunning && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <ActivityIndicator
                activity={currentActivity}
                detail={currentActivityDetail}
                isActive={isLive}
              />
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {progress.total > 0 
                    ? `${progress.completed} / ${progress.total} features`
                    : planningPhaseMessage.main}
                </div>
                {progress.total > 0 && estimatedRemainingMs && estimatedRemainingMs > 0 && (
                  <div className="text-xs text-muted-foreground">
                    ~{Math.ceil(estimatedRemainingMs / 60000)} min remaining
                  </div>
                )}
                {progress.total === 0 && planningPhaseMessage.detail && (
                  <div className="text-xs text-muted-foreground">
                    {planningPhaseMessage.detail}
                  </div>
                )}
              </div>
            </div>
            {progress.total > 0 ? (
              <Progress 
                value={progress.percentComplete} 
                className="mt-3 h-2" 
              />
            ) : (
              /* Indeterminate progress bar during planning */
              <div className="mt-3 h-2 w-full rounded-full bg-primary/20 overflow-hidden">
                <div className="h-full w-1/3 bg-primary rounded-full animate-pulse-slide" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pause Pending Banner */}
      {isPausePending && isRunning && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              <div>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Pause requested
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  — Waiting for current operation to complete...
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Gate (when awaiting approval) */}
      {isAwaitingReview && (
        <ReviewGate
          buildId={build.id}
          gateType={currentStatus === 'AWAITING_DESIGN_REVIEW' ? 'design' : 'features'}
          status={currentStatus as 'AWAITING_DESIGN_REVIEW' | 'AWAITING_FEATURE_REVIEW'}
          onApprove={handleApprove}
        />
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Build Activity</CardTitle>
              <div className="flex items-center gap-2">
                {/* View mode tabs */}
                <div className="flex rounded-lg bg-muted p-1">
                  <button
                    onClick={() => setViewMode('activity')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded transition-colors ${
                      viewMode === 'activity' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    Activity
                  </button>
                  <button
                    onClick={() => setViewMode('logs')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded transition-colors ${
                      viewMode === 'logs' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    Logs
                  </button>
                  <button
                    onClick={() => setViewMode('files')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded transition-colors ${
                      viewMode === 'files' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FolderTree className="h-3.5 w-3.5" />
                    Files ({structuredEvents.files.length > 0 ? structuredEvents.files.length : filesCreated.length})
                  </button>
                </div>
                
                {/* Connection status badge based on connectionState */}
                {connectionState === 'live' && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                    <span className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </Badge>
                )}
                {connectionState === 'connecting' && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Connecting
                  </Badge>
                )}
                {connectionState === 'historical' && (
                  <Badge variant="outline" className="bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    Historical
                  </Badge>
                )}
                {connectionState === 'reconnecting' && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Reconnecting
                  </Badge>
                )}
                {connectionState === 'error' && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                    <XCircle className="mr-1 h-3 w-3" />
                    Disconnected
                  </Badge>
                )}
                {connectionState === 'complete' && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Complete
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'activity' && (
                <ActivityFeed
                  events={events}
                  isLive={isLive}
                  maxHeight="500px"
                  showEmpty={true}
                  emptyMessage={
                    connectionState === 'connecting' ? 'Connecting to build stream...' :
                    connectionState === 'live' ? 'Waiting for activity...' :
                    connectionState === 'historical' ? 'No activity recorded for this build.' :
                    connectionState === 'reconnecting' ? 'Reconnecting...' :
                    connectionState === 'error' ? 'Unable to connect to build stream.' :
                    'Build finished. No logs available.'
                  }
                />
              )}
              
              {viewMode === 'logs' && (
                <div className="relative">
                  <button
                    onClick={handleCopyLogs}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                    title="Copy all logs"
                  >
                    {logsCopied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <ScrollArea className="h-[500px] rounded-md border bg-zinc-950 p-4">
                    <div className="space-y-1 font-mono text-sm">
                      {events.length === 0 ? (
                        <div className="flex items-center gap-2 text-zinc-500">
                          {(connectionState === 'connecting' || connectionState === 'live') && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          <span>
                            {connectionState === 'connecting' && 'Connecting...'}
                            {connectionState === 'live' && 'Waiting for logs...'}
                            {connectionState === 'historical' && 'No logs recorded.'}
                            {connectionState === 'reconnecting' && 'Reconnecting...'}
                            {connectionState === 'error' && 'Connection lost.'}
                            {connectionState === 'complete' && 'No logs available.'}
                          </span>
                        </div>
                      ) : (
                        // Reverse to show newest logs first
                        [...events.filter((e) => e.type === 'log' || e.message)].reverse().map((event) => (
                          <RawLogLine key={event.id} event={event} />
                        ))
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              {viewMode === 'files' && (
                <FilesView 
                  structuredFiles={structuredEvents.files}
                  logFiles={filesCreated}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Features Card - always show for consistent UX */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Features</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {progress.completed} / {progress.total || '?'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Show progress bar when we have total */}
              {progress.total > 0 && (
                <Progress 
                  value={progress.percentComplete} 
                  className="h-2 mb-4" 
                />
              )}
              
              {/* Show feature list preview if we have the full feature list */}
              {featureList && featureList.length > 0 ? (
                <div className="space-y-3">
                  {/* Key forces re-render when progress changes */}
                  <FeatureListPreview 
                    key={`features-${progress.completed}-${progress.total}`}
                    features={featureList}
                    maxItems={5}
                    isComplete={isComplete || currentStatus === 'COMPLETED' || currentStatus === 'FAILED' || currentStatus === 'CANCELLED'}
                  />
                  <FeatureListModal
                    features={featureList}
                    completed={progress.completed}
                    total={progress.total}
                    className="w-full justify-center"
                  />
                </div>
              ) : displayFeatures.length > 0 ? (
                /* Show extracted features from logs */
                <FeatureProgress
                  features={displayFeatures}
                  currentFeatureId={currentFeatureId}
                />
              ) : (
                /* Otherwise show compact view with current activity */
                <FeatureProgressCompact
                  completed={progress.completed}
                  total={progress.total}
                  currentFeature={currentActivityDetail}
                  isGeneratingFeatureList={isGeneratingFeatureList}
                  planningPhase={planningPhase}
                />
              )}
            </CardContent>
          </Card>

          {/* Time Estimate (when running) */}
          {isRunning && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Time</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeEstimate
                  elapsedMs={elapsedMs}
                  estimatedRemainingMs={estimatedRemainingMs}
                  averageFeatureDurationMs={averageFeatureDurationMs}
                />
              </CardContent>
            </Card>
          )}

          {/* Files Created */}
          {filesCreated.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Files ({filesCreated.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-1 text-sm">
                    {filesCreated.map((file, i) => (
                      <div key={i} className="text-muted-foreground truncate">
                        {file}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Live Preview Panel */}
          {currentStatus === 'COMPLETED' && (
            <PreviewPanel
              buildId={build.id}
              buildStatus={currentStatus}
              artifactKey={currentArtifactKey}
              sandboxId={currentSandboxId}
              outputUrl={currentOutputUrl}
            />
          )}

          {/* Artifacts Card */}
          {currentStatus === 'COMPLETED' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileArchive className="h-5 w-5" />
                  Artifacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentArtifactKey ? (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Build artifacts are ready for download.
                    </div>
                    {artifactInfo && (
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Size:</span>
                          <span>{formatFileSize(artifactInfo.size)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Format:</span>
                          <span>ZIP</span>
                        </div>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download Artifacts
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No artifacts available for this build.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Errors (if any) */}
          {errors.length > 0 && (
            <Card className="border-red-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-red-500">
                  Errors ({errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {errors.slice(-5).map((error, i) => (
                    <div key={i} className="text-red-400">
                      {error.message}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Build Info Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Build Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{build.createdAt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span>{statusInfo.label}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Activity Log Line Component
// =============================================================================

function ActivityLogLine({ 
  event, 
  isLatest 
}: { 
  event: Record<string, unknown>; 
  isLatest: boolean;
}) {
  const level = (event.level as string) || 'info';
  const message = (event.message as string) || '';
  const timestamp = new Date(event.timestamp as string).toLocaleTimeString();
  
  // Determine icon and color based on message content
  let icon = null;
  let textClass = 'text-zinc-300';
  
  if (level === 'error') {
    icon = <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />;
    textClass = 'text-red-400';
  } else if (message.includes('Passed') || message.includes('successfully')) {
    icon = <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />;
    textClass = 'text-green-400';
  } else if (message.includes('Failed')) {
    icon = <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />;
    textClass = 'text-red-400';
  } else if (level === 'tool') {
    textClass = 'text-cyan-400';
  }

  return (
    <div className={`flex items-start gap-2 py-1 ${isLatest ? 'bg-primary/10 -mx-2 px-2 rounded' : ''}`}>
      {icon}
      <div className="flex-1 min-w-0">
        {isLatest ? (
          <ShimmerText className={`text-sm ${textClass}`}>
            {message}
          </ShimmerText>
        ) : (
          <span className={`text-sm ${textClass}`}>{message}</span>
        )}
      </div>
      <span className="text-xs text-zinc-600 flex-shrink-0">{timestamp}</span>
    </div>
  );
}

// =============================================================================
// Raw Log Line Component
// =============================================================================

function RawLogLine({ event }: { event: Record<string, unknown> }) {
  const levelColors: Record<string, string> = {
    info: 'text-zinc-300',
    error: 'text-red-400',
    warn: 'text-yellow-400',
    tool: 'text-cyan-400',
    debug: 'text-zinc-500',
  };

  const level = (event.level as string) || 'info';
  const message = (event.message as string) || '';
  const color = levelColors[level] || 'text-zinc-300';
  const timestamp = new Date(event.timestamp as string).toLocaleTimeString();

  return (
    <div className={`${color} leading-relaxed`}>
      <span className="text-zinc-500">[{timestamp}]</span>{' '}
      <span className="text-zinc-500 uppercase">[{level}]</span>{' '}
      {message}
    </div>
  );
}

// =============================================================================
// Files View Component
// =============================================================================

/**
 * Infer programming language from file extension
 */
function inferLanguage(path: string): string | undefined {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TypeScript',
    js: 'JavaScript',
    jsx: 'JavaScript',
    py: 'Python',
    css: 'CSS',
    scss: 'SCSS',
    html: 'HTML',
    json: 'JSON',
    md: 'Markdown',
    sh: 'Shell',
    txt: 'Text',
  };
  return ext ? languageMap[ext] : undefined;
}

interface FilesViewProps {
  structuredFiles: Array<Record<string, unknown>>;
  logFiles: string[];
}

function FilesView({ structuredFiles, logFiles }: FilesViewProps) {
  // Combine structured file events with log-parsed files
  const allFiles = useMemo(() => {
    // Start with structured events if we have them
    if (structuredFiles.length > 0) {
      return structuredFiles.map((event) => ({
        id: event.id as string,
        path: (event.path as string) || 'unknown',
        type: event.type as 'file_created' | 'file_modified' | 'file_deleted',
        language: event.language as string | undefined,
        linesAdded: event.linesAdded as number | undefined,
      }));
    }
    
    // Fall back to log-parsed files
    return logFiles.map((path, idx) => ({
      id: `log-file-${idx}`,
      path,
      type: 'file_created' as const,
      language: inferLanguage(path),
      linesAdded: undefined,
    }));
  }, [structuredFiles, logFiles]);

  if (allFiles.length === 0) {
    return (
      <ScrollArea className="h-[500px] rounded-md border p-4">
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <FileText className="h-4 w-4 mr-2" />
          <span>No files created yet</span>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[500px] rounded-md border p-4">
      <div className="space-y-2">
        {allFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
          >
            {file.type === 'file_created' && (
              <span className="text-green-500 text-xs font-medium">+</span>
            )}
            {file.type === 'file_modified' && (
              <span className="text-blue-500 text-xs font-medium">~</span>
            )}
            {file.type === 'file_deleted' && (
              <span className="text-red-500 text-xs font-medium">-</span>
            )}
            <span className="font-mono text-sm flex-1 truncate">
              {file.path}
            </span>
            {file.language && (
              <span className="text-xs text-muted-foreground">
                {file.language}
              </span>
            )}
            {file.linesAdded && (
              <span className="text-xs text-green-500">
                +{file.linesAdded}
              </span>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
