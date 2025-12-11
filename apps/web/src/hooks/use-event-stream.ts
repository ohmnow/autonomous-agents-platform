'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// =============================================================================
// Event Types (simplified local types to avoid import issues)
// =============================================================================

export type BuildPhase =
  | 'initializing'
  | 'analyzing'
  | 'planning'
  | 'implementing'
  | 'testing'
  | 'finalizing'
  | 'completed'
  | 'failed';

export type FeatureStatus = 'pending' | 'in_progress' | 'testing' | 'passed' | 'failed';

export type ActivityType =
  | 'thinking'
  | 'planning'
  | 'writing_code'
  | 'running_command'
  | 'running_tests'
  | 'reading_file'
  | 'analyzing_output'
  | 'fixing_error'
  | 'idle';

export interface AgentEvent {
  id: string;
  type: string;
  timestamp: string;
  buildId: string;
  [key: string]: unknown;
}

export interface Feature {
  id: string;
  title: string;
  status: FeatureStatus;
  startedAt?: string;
  completedAt?: string;
  testsPassed?: number;
  testsFailed?: number;
  durationMs?: number;
}

// Full feature list item from feature_list.json
export interface FeatureListItem {
  category: 'functional' | 'style';
  description: string;
  steps: string[];
  passes: boolean;
}

// =============================================================================
// Hook Options & Return Types
// =============================================================================

export interface InitialProgress {
  completed: number;
  total: number;
}

export interface UseEventStreamOptions {
  buildId: string;
  enabled?: boolean;
  /** Initial progress from database - used as fallback until logs provide data */
  initialProgress?: InitialProgress;
  /** Initial build status from database */
  initialStatus?: string;
}

/** Connection state for better UI feedback */
export type ConnectionState = 
  | 'connecting'    // Initial connection attempt
  | 'connected'     // Connected and receiving data
  | 'live'          // Connected to active build with real-time logs
  | 'historical'    // Connected but viewing historical data only
  | 'reconnecting'  // Lost connection, attempting to reconnect
  | 'error'         // Connection failed
  | 'complete';     // Build finished, no more updates

export interface UseEventStreamReturn {
  // Raw events
  events: AgentEvent[];
  
  // Structured events by category (for activity feed)
  structuredEvents: {
    files: AgentEvent[];
    tools: AgentEvent[];
    phases: AgentEvent[];
    thinking: AgentEvent[];
    errors: AgentEvent[];
    commands: AgentEvent[];
    progress: AgentEvent[];
  };
  
  // Derived state
  currentPhase: BuildPhase;
  currentActivity: string;
  currentActivityDetail?: string;
  features: Feature[];
  currentFeatureId?: string;
  
  // Full feature list from feature_list.json (when available)
  featureList: FeatureListItem[] | null;
  
  // Progress
  progress: {
    completed: number;
    total: number;
    percentComplete: number;
  };
  
  // Time estimates
  elapsedMs: number;
  estimatedRemainingMs?: number;
  averageFeatureDurationMs?: number;
  
  // File tracking
  filesCreated: string[];
  
  // Connection state (detailed)
  connectionState: ConnectionState;
  
  // Legacy connection state (for backwards compatibility)
  isConnected: boolean;
  isLive: boolean;
  isComplete: boolean;
  
  // Errors
  errors: Array<{ message: string; timestamp: string }>;
}

// =============================================================================
// Activity Detection
// =============================================================================

// Structured event types that the agent emits
const STRUCTURED_EVENT_TYPES = new Set([
  'phase',
  'feature_start',
  'feature_progress',
  'feature_end',
  'feature_list',
  'thinking',
  'activity',
  'tool_start',
  'tool_end',
  'file_created',
  'file_modified',
  'file_deleted',
  'command',
  'test_run',
  'error',
  'progress',
]);

function isStructuredEventType(type: string): boolean {
  return STRUCTURED_EVENT_TYPES.has(type);
}

const activityPatterns: Array<{ pattern: RegExp; activity: string; detail?: (match: RegExpMatchArray) => string }> = [
  // Feature list generation phases
  { pattern: /Creating.*feature.?list/i, activity: 'Generating feature list...', detail: () => 'This may take a few minutes' },
  { pattern: /write_file:.*feature_list\.json/i, activity: 'Generating feature list...', detail: () => 'Creating test cases' },
  { pattern: /\[TOOL\] write_file:.*feature_list/i, activity: 'Generating feature list...', detail: () => 'Creating test cases' },
  { pattern: /feature_list\.json/i, activity: 'Feature list ready', detail: () => 'Starting implementation' },
  
  // Planning and analysis
  { pattern: /Planning next steps/i, activity: 'Planning next steps...' },
  { pattern: /Planning next feature/i, activity: 'Planning next feature...' },
  { pattern: /Analyzing requirements/i, activity: 'Analyzing requirements...' },
  { pattern: /read.*app_spec/i, activity: 'Reading app specification...' },
  { pattern: /\[TOOL\] read_file:.*app_spec/i, activity: 'Reading app specification...' },
  
  // Feature implementation
  { pattern: /Starting feature implementation/i, activity: 'Starting implementation...' },
  { pattern: /Feature (\d+)\/(\d+): (.+) - Starting/i, activity: 'Building feature...', detail: (m) => m[3] },
  { pattern: /Feature (\d+)\/(\d+): (.+) - (Passed|Failed)/i, activity: 'Feature complete', detail: (m) => `${m[3]} - ${m[4]}` },
  { pattern: /Creating components for (.+)/i, activity: 'Writing code...', detail: (m) => m[1] },
  
  // File operations
  { pattern: /text_editor: Created (.+)/i, activity: 'Created file', detail: (m) => m[1] },
  { pattern: /text_editor: Modified (.+)/i, activity: 'Modified file', detail: (m) => m[1] },
  { pattern: /\[TOOL\] write_file: (.+)/i, activity: 'Writing file', detail: (m) => m[1].split('/').pop() },
  
  // Commands
  { pattern: /bash: (.+)/i, activity: 'Running command...', detail: (m) => m[1].slice(0, 50) },
  { pattern: /npm run test/i, activity: 'Running tests...' },
  { pattern: /npm run build/i, activity: 'Building project...' },
  { pattern: /npm install/i, activity: 'Installing dependencies...' },
  
  // Sandbox and completion
  { pattern: /Initializing sandbox/i, activity: 'Initializing sandbox...' },
  { pattern: /Creating E2B sandbox/i, activity: 'Creating sandbox environment...' },
  { pattern: /Sandbox created/i, activity: 'Sandbox ready' },
  { pattern: /Saving build artifacts/i, activity: 'Saving artifacts...' },
  { pattern: /Build completed successfully/i, activity: 'Build complete!' },
  { pattern: /Build failed/i, activity: 'Build failed' },
];

function detectActivity(message: string): { activity: string; detail?: string } | null {
  for (const { pattern, activity, detail } of activityPatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        activity,
        detail: detail ? detail(match) : undefined,
      };
    }
  }
  return null;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useEventStream({
  buildId,
  enabled = true,
  initialProgress,
  initialStatus,
}: UseEventStreamOptions): UseEventStreamReturn {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  
  // Initialize connection state based on build status
  // If build is already complete, start in 'historical' state
  const isAlreadyComplete = initialStatus && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(initialStatus);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    isAlreadyComplete ? 'historical' : 'connecting'
  );
  const [serverIsLive, setServerIsLive] = useState(false);
  
  // Track start time for elapsed calculation
  const startTimeRef = useRef<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  
  // Track reconnection attempts and whether we've ever connected
  const reconnectAttemptsRef = useRef(0);
  const hasEverConnectedRef = useRef(false);
  const maxReconnectAttempts = 5;

  // Parse logs/events from SSE stream
  const handleMessage = useCallback((data: Record<string, unknown>) => {
    // Handle different message types
    if (data.type === 'connected') {
      reconnectAttemptsRef.current = 0; // Reset on successful connection
      hasEverConnectedRef.current = true; // Mark that we've successfully connected
      const isLive = data.isLive as boolean ?? false;
      setServerIsLive(isLive);
      setConnectionState(isLive ? 'live' : 'historical');
      
      // Use server-provided startedAt time for accurate elapsed calculation
      // This ensures elapsed time is correct even if client connects mid-build
      if (data.startedAt) {
        const serverStartTime = new Date(data.startedAt as string).getTime();
        startTimeRef.current = serverStartTime;
        // Immediately calculate elapsed from actual start time
        setElapsedMs(Date.now() - serverStartTime);
      } else if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
    } else if (data.type === 'complete') {
      setConnectionState('complete');
      setServerIsLive(false);
    } else if (data.type === 'heartbeat') {
      // Heartbeat received, connection is healthy
      reconnectAttemptsRef.current = 0;
    } else if (data.type === 'log') {
      // Plain text log message
      const event: AgentEvent = {
        id: (data.id as string) || `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'log',
        timestamp: (data.timestamp as string) || new Date().toISOString(),
        buildId,
        ...data,
      };
      
      setEvents((prev) => {
        if (prev.some((e) => e.id === event.id)) return prev;
        return [...prev, event];
      });
    } else if (isStructuredEventType(data.type as string)) {
      // Structured agent event (tool_start, file_created, phase, etc.)
      const event: AgentEvent = {
        id: (data.id as string) || `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: data.type as string,
        timestamp: (data.timestamp as string) || new Date().toISOString(),
        buildId,
        ...data,
      };
      
      setEvents((prev) => {
        if (prev.some((e) => e.id === event.id)) return prev;
        return [...prev, event];
      });
    }
  }, [buildId]);

  // Track connection state in a ref for use inside effect callbacks
  // This avoids putting connectionState in the dependency array
  const connectionStateRef = useRef(connectionState);
  connectionStateRef.current = connectionState;

  // SSE connection
  useEffect(() => {
    if (!enabled || !buildId) return;

    // Check if build is already complete based on initial status
    const isAlreadyComplete = initialStatus && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(initialStatus);

    const eventSource = new EventSource(`/api/builds/${buildId}/stream`);
    
    eventSource.onopen = () => {
      // Connection opened - state will be set by 'connected' event
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.addEventListener('connected', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        handleMessage({ type: 'connected', ...data });
      } catch {
        // Fallback: assume connected but not live
        setConnectionState('historical');
      }
    });

    eventSource.addEventListener('complete', () => {
      setConnectionState('complete');
      setServerIsLive(false);
      eventSource.close();
    });

    eventSource.onerror = () => {
      // Don't immediately show error - EventSource auto-reconnects
      reconnectAttemptsRef.current++;
      
      // Use ref to check current state without causing re-render loop
      if (connectionStateRef.current === 'complete' || isAlreadyComplete) {
        // Build is done, close connection
        eventSource.close();
        return;
      }
      
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        setConnectionState('error');
        eventSource.close();
      } else {
        // Only show "reconnecting" if we've successfully connected before
        // Otherwise, we're still in the initial "connecting" phase
        if (hasEverConnectedRef.current) {
          setConnectionState('reconnecting');
        }
        // If we've never connected, stay in 'connecting' state
        // (don't change state - let the UI show "Connecting...")
      }
    };

    return () => {
      eventSource.close();
    };
  }, [buildId, enabled, handleMessage, initialStatus]);

  // Update elapsed time
  // Track elapsed time when:
  // 1. Build is live (streaming real-time updates), OR
  // 2. Build is RUNNING (even if viewing historical - it's still running in background)
  // Stop tracking when build is complete or connection has error
  const buildIsStillRunning = initialStatus === 'RUNNING' && connectionState !== 'complete';
  
  useEffect(() => {
    if (connectionState === 'complete' || connectionState === 'error') return;
    
    // Continue tracking if live OR if build is still running (even in historical mode)
    if (!serverIsLive && connectionState !== 'live' && !buildIsStillRunning) return;
    
    const interval = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [serverIsLive, connectionState, buildIsStillRunning]);

  // ==========================================================================
  // Derived State
  // ==========================================================================

  // Categorize structured events for micro-interactions
  const structuredEvents = useMemo(() => {
    const fileEvents = events.filter((e) =>
      ['file_created', 'file_modified', 'file_deleted'].includes(e.type)
    );
    const toolEvents = events.filter((e) =>
      ['tool_start', 'tool_end'].includes(e.type)
    );
    const phaseEvents = events.filter((e) => e.type === 'phase');
    const thinkingEvents = events.filter((e) => e.type === 'thinking');
    const errorEvents = events.filter((e) => e.type === 'error');
    const commandEvents = events.filter((e) => e.type === 'command');
    const progressEvents = events.filter((e) => e.type === 'progress');

    return {
      files: fileEvents,
      tools: toolEvents,
      phases: phaseEvents,
      thinking: thinkingEvents,
      errors: errorEvents,
      commands: commandEvents,
      progress: progressEvents,
    };
  }, [events]);

  // Extract features from events/logs
  const { features, completionTimes } = useMemo(() => {
    const featureMap = new Map<string, Feature>();
    const times: number[] = [];
    
    for (const event of events) {
      const message = (event.message as string) || '';
      
      // Feature start pattern
      const startMatch = message.match(/Feature (\d+)\/(\d+): (.+) - Starting/i);
      if (startMatch) {
        const id = `feature-${startMatch[1]}`;
        featureMap.set(id, {
          id,
          title: startMatch[3],
          status: 'in_progress',
          startedAt: event.timestamp,
        });
      }
      
      // Feature end pattern
      const endMatch = message.match(/Feature (\d+)\/(\d+): (.+) - (Passed|Failed)/i);
      if (endMatch) {
        const id = `feature-${endMatch[1]}`;
        const existing = featureMap.get(id);
        const status = endMatch[4].toLowerCase() as 'passed' | 'failed';
        
        // Calculate duration if we have start time
        let durationMs: number | undefined;
        if (existing?.startedAt) {
          durationMs = new Date(event.timestamp).getTime() - new Date(existing.startedAt).getTime();
          times.push(durationMs);
        }
        
        featureMap.set(id, {
          ...existing,
          id,
          title: endMatch[3],
          status,
          completedAt: event.timestamp,
          durationMs,
        });
      }
    }
    
    return { features: Array.from(featureMap.values()), completionTimes: times };
  }, [events]);

  // Current feature
  const currentFeatureId = useMemo(() => {
    const inProgress = features.find((f) => f.status === 'in_progress');
    return inProgress?.id;
  }, [features]);

  // Progress calculation
  const progress = useMemo(() => {
    // Try to get from progress logs first (most accurate)
    const progressLog = events.findLast((e) => 
      ((e.message as string) || '').startsWith('Progress:')
    );
    
    if (progressLog) {
      const match = ((progressLog.message as string) || '').match(/Progress: (\d+)\/(\d+)/);
      if (match) {
        const completed = parseInt(match[1]);
        const total = parseInt(match[2]);
        return {
          completed,
          total,
          percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      }
    }
    
    // Try to get from feature extraction
    const completedFromFeatures = features.filter((f) => f.status === 'passed' || f.status === 'failed').length;
    if (features.length > 0) {
      return {
        completed: completedFromFeatures,
        total: features.length,
        percentComplete: features.length > 0 ? Math.round((completedFromFeatures / features.length) * 100) : 0,
      };
    }
    
    // Fall back to initial progress from database (if provided)
    if (initialProgress && initialProgress.total > 0) {
      return {
        completed: initialProgress.completed,
        total: initialProgress.total,
        percentComplete: Math.round((initialProgress.completed / initialProgress.total) * 100),
      };
    }
    
    // Last resort: unknown progress
    return {
      completed: 0,
      total: 0,
      percentComplete: 0,
    };
  }, [events, features, initialProgress]);

  // Current activity from latest logs
  const { currentActivity, currentActivityDetail } = useMemo(() => {
    // Look at recent logs for activity
    const recentLogs = events.slice(-10);
    
    for (let i = recentLogs.length - 1; i >= 0; i--) {
      const message = (recentLogs[i].message as string) || '';
      const detected = detectActivity(message);
      if (detected) {
        return {
          currentActivity: detected.activity,
          currentActivityDetail: detected.detail,
        };
      }
    }
    
    // No activity detected from logs - use connection state for messaging
    switch (connectionState) {
      case 'connecting':
        return { currentActivity: 'Connecting...', currentActivityDetail: undefined };
      case 'reconnecting':
        return { currentActivity: 'Reconnecting...', currentActivityDetail: undefined };
      case 'error':
        return { currentActivity: 'Connection lost', currentActivityDetail: undefined };
      case 'complete':
        return { currentActivity: 'Build finished', currentActivityDetail: undefined };
      case 'live':
        // Live but no logs yet - build is starting
        return { currentActivity: 'Starting build...', currentActivityDetail: undefined };
      case 'historical':
        return { currentActivity: 'Viewing history', currentActivityDetail: undefined };
      default:
        return { currentActivity: 'Waiting...', currentActivityDetail: undefined };
    }
  }, [events, connectionState]);

  // Current phase
  const currentPhase = useMemo((): BuildPhase => {
    const messages = events.map((e) => ((e.message as string) || '').toLowerCase());
    
    if (messages.some((m) => m.includes('build completed successfully'))) return 'completed';
    if (messages.some((m) => m.includes('build failed'))) return 'failed';
    if (messages.some((m) => m.includes('saving build artifacts'))) return 'finalizing';
    if (messages.some((m) => m.includes('npm run test') || m.includes('running tests'))) return 'testing';
    if (messages.some((m) => m.includes('feature') && m.includes('starting'))) return 'implementing';
    if (messages.some((m) => m.includes('analyzing') || m.includes('planning'))) return 'planning';
    if (messages.some((m) => m.includes('initializing') || m.includes('sandbox'))) return 'initializing';
    
    return 'initializing';
  }, [events]);

  // Time estimation (uses completionTimes from features extraction)
  const { estimatedRemainingMs, averageFeatureDurationMs } = useMemo(() => {
    // If we don't know the total, can't estimate
    if (progress.total === 0) {
      return {
        estimatedRemainingMs: undefined,
        averageFeatureDurationMs: undefined,
      };
    }
    
    const remaining = progress.total - progress.completed;
    
    if (completionTimes.length === 0) {
      // No data yet - only estimate if we have a reasonable total
      if (remaining > 0 && progress.total > 0) {
        // Rough estimate: 2 minutes per feature
        return {
          estimatedRemainingMs: remaining * 2 * 60 * 1000,
          averageFeatureDurationMs: undefined,
        };
      }
      return {
        estimatedRemainingMs: undefined,
        averageFeatureDurationMs: undefined,
      };
    }
    
    const average = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    
    return {
      estimatedRemainingMs: remaining * average,
      averageFeatureDurationMs: average,
    };
  }, [progress, completionTimes]);

  // Files created
  const filesCreated = useMemo(() => {
    const files: string[] = [];
    
    for (const event of events) {
      const message = (event.message as string) || '';
      const match = message.match(/text_editor: Created (.+)/i);
      if (match) {
        files.push(match[1]);
      }
    }
    
    return files;
  }, [events]);

  // Errors
  const errors = useMemo(() => {
    return events
      .filter((e) => (e.level as string) === 'error')
      .map((e) => ({
        message: (e.message as string) || 'Unknown error',
        timestamp: e.timestamp,
      }));
  }, [events]);

  // Extract full feature list from feature_list events (most recent one)
  const featureList = useMemo((): FeatureListItem[] | null => {
    // Find the most recent feature_list event
    const featureListEvents = events.filter((e) => e.type === 'feature_list');
    if (featureListEvents.length === 0) return null;
    
    const latestEvent = featureListEvents[featureListEvents.length - 1];
    const features = latestEvent.features as FeatureListItem[] | undefined;
    
    return features && Array.isArray(features) ? features : null;
  }, [events]);

  // Derived legacy state for backwards compatibility
  const isConnected = connectionState !== 'connecting' && connectionState !== 'error';
  const isLive = connectionState === 'live';
  const isComplete = connectionState === 'complete';

  return {
    events,
    structuredEvents,
    currentPhase,
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
    errors,
  };
}
