/**
 * Build Runner
 *
 * This module handles starting and managing autonomous agent builds in sandboxes.
 * It coordinates between the sandbox provider and the agent core.
 */

import { E2BProvider } from '@repo/sandbox-providers';
import type { Sandbox } from '@repo/sandbox-providers';
import { 
  updateBuild, 
  completeBuild, 
  createBuildLogs, 
  getBuildLogs as getDbBuildLogs,
  createBuildEventsBatch,
  getBuildEvents as getDbBuildEvents,
} from '@repo/database';
import { runSandboxAgent } from './sandbox-agent';
import {
  saveBuildArtifacts,
  isArtifactStorageAvailable,
  getArtifactStorageInfo,
} from './artifact-storage';
import type { AgentEvent } from '@repo/agent-core';
import type { BuildStatus } from '@prisma/client';

// Configuration
const USE_REAL_SANDBOX = process.env.E2B_API_KEY && process.env.E2B_API_KEY !== 'your_e2b_api_key_here';

// Anthropic authentication - OAuth token preferred, API key as fallback
// Supports both ANTHROPIC_AUTH_TOKEN and CLAUDE_CODE_OAUTH_TOKEN for flexibility
const ANTHROPIC_AUTH_TOKEN = process.env.ANTHROPIC_AUTH_TOKEN || process.env.CLAUDE_CODE_OAUTH_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Log entry type
interface LogEntry {
  id: string;
  level: string;
  message: string;
  timestamp: string;
}

// In-memory store for active builds (for real-time streaming)
const activeBuildLogs = new Map<string, LogEntry[]>();
const activeBuildEvents = new Map<string, AgentEvent[]>();
// Track cancellation requests so stopBuild can be reflected in final build status
const cancelledBuilds = new Set<string>();
// Track pause requests
const pausedBuilds = new Set<string>();
// Store checkpoint data for paused builds
interface CheckpointInfo {
  checkpointData: {
    completedFeatures: string[];
    currentPhase: string;
    currentFeatureIndex: number;
    totalFeatures: number;
  };
  conversationHistory: unknown[] | null;
}
const buildCheckpoints = new Map<string, CheckpointInfo>();

// Buffer for batching log writes to database
const logWriteBuffer = new Map<string, LogEntry[]>();
const eventWriteBuffer = new Map<string, AgentEvent[]>();
const LOG_FLUSH_INTERVAL = 500; // Flush logs every 500ms
const LOG_FLUSH_SIZE = 10; // Or when buffer reaches 10 logs

// Subscriber type that can receive logs, events, or completion signals
interface BuildUpdate {
  type: 'log' | 'event' | 'complete';
  data: LogEntry | AgentEvent | { status: string; timestamp: string };
}

const buildSubscribers = new Map<string, Set<(update: BuildUpdate) => void>>();
const activeSandboxes = new Map<string, Sandbox>();

// E2B Provider instance
const e2bProvider = new E2BProvider();

/**
 * Flush buffered logs to database
 */
async function flushLogBuffer(buildId: string): Promise<void> {
  const buffer = logWriteBuffer.get(buildId);
  if (!buffer || buffer.length === 0) return;

  // Clear buffer first to avoid duplicate writes
  const logsToWrite = [...buffer];
  logWriteBuffer.set(buildId, []);

  try {
    await createBuildLogs(
      logsToWrite.map((log) => ({
        buildId,
        level: log.level,
        message: log.message,
        metadata: { originalId: log.id, timestamp: log.timestamp },
      }))
    );
  } catch (error) {
    console.error('Failed to persist logs to database:', error);
    // Put logs back in buffer to retry later
    const currentBuffer = logWriteBuffer.get(buildId) || [];
    logWriteBuffer.set(buildId, [...logsToWrite, ...currentBuffer]);
  }
}

/**
 * Flush buffered events to database
 */
async function flushEventBuffer(buildId: string): Promise<void> {
  const buffer = eventWriteBuffer.get(buildId);
  if (!buffer || buffer.length === 0) return;

  // Clear buffer first to avoid duplicate writes
  const eventsToWrite = [...buffer];
  eventWriteBuffer.set(buildId, []);

  try {
    await createBuildEventsBatch(
      eventsToWrite.map((event) => ({
        buildId,
        type: event.type,
        data: event as unknown as Record<string, unknown>,
      }))
    );
  } catch (error) {
    console.error('Failed to persist events to database:', error);
    // Put events back in buffer to retry later
    const currentBuffer = eventWriteBuffer.get(buildId) || [];
    eventWriteBuffer.set(buildId, [...eventsToWrite, ...currentBuffer]);
  }
}

/**
 * Start periodic log and event flushing for a build
 */
function startLogFlusher(buildId: string): () => void {
  const intervalId = setInterval(() => {
    flushLogBuffer(buildId);
    flushEventBuffer(buildId);
  }, LOG_FLUSH_INTERVAL);

  return () => {
    clearInterval(intervalId);
    // Final flush when build ends
    flushLogBuffer(buildId);
    flushEventBuffer(buildId);
  };
}

/**
 * Start a build in a sandbox
 * This is called asynchronously after a build is created
 */
export async function startBuildInBackground(
  buildId: string,
  appSpec: string,
  sandboxProvider: string,
  harnessId: string,
  targetFeatureCount: number = 80,
  reviewGatesEnabled: boolean = false
): Promise<void> {
  // Initialize log and event storage for this build
  activeBuildLogs.set(buildId, []);
  activeBuildEvents.set(buildId, []);
  logWriteBuffer.set(buildId, []);
  eventWriteBuffer.set(buildId, []);

  // Start periodic log flushing to database
  const stopFlusher = startLogFlusher(buildId);

  const addLog = (level: string, message: string) => {
    const log: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    // Store in memory for real-time streaming
    const logs = activeBuildLogs.get(buildId) || [];
    logs.push(log);
    activeBuildLogs.set(buildId, logs);

    // Add to buffer for database persistence
    const buffer = logWriteBuffer.get(buildId) || [];
    buffer.push(log);
    logWriteBuffer.set(buildId, buffer);

    // Flush immediately if buffer is full
    if (buffer.length >= LOG_FLUSH_SIZE) {
      flushLogBuffer(buildId);
    }

    // Notify subscribers with log update
    const subscribers = buildSubscribers.get(buildId);
    if (subscribers) {
      subscribers.forEach((callback) => callback({ type: 'log', data: log }));
    }
  };
  
  // Accept partial events with flexible type field (from sandbox-agent's PartialAgentEvent)
  const emitEvent = (event: { id: string; type: string; timestamp: string; [key: string]: unknown }) => {
    const fullEvent = { ...event, buildId } as AgentEvent;
    
    // Store in memory for real-time streaming
    const events = activeBuildEvents.get(buildId) || [];
    events.push(fullEvent);
    activeBuildEvents.set(buildId, events);
    
    // Add to buffer for database persistence
    const buffer = eventWriteBuffer.get(buildId) || [];
    buffer.push(fullEvent);
    eventWriteBuffer.set(buildId, buffer);
    
    // Notify subscribers with event update
    const subscribers = buildSubscribers.get(buildId);
    if (subscribers) {
      subscribers.forEach((callback) => callback({ type: 'event', data: fullEvent }));
    }
  };

  let artifactKey: string | undefined;
  let buildSucceeded = false;

  try {
    addLog('info', `Starting build with ${sandboxProvider} provider...`);
    addLog('info', `Using ${harnessId} harness`);

    // Check storage availability
    if (isArtifactStorageAvailable()) {
      const storageInfo = getArtifactStorageInfo();
      addLog('info', `Artifact storage: ${storageInfo.provider} (${storageInfo.bucket})`);
    } else {
      addLog('warn', 'Artifact storage not configured - artifacts will not be saved');
    }

    if (USE_REAL_SANDBOX && sandboxProvider === 'e2b') {
      // Real sandbox execution
      addLog('info', 'Using REAL E2B sandbox for build execution');
      if (reviewGatesEnabled) {
        addLog('info', '🔒 Review gates enabled - will pause for design and feature review');
      }
      await runRealBuild(buildId, appSpec, harnessId, targetFeatureCount, addLog, emitEvent, reviewGatesEnabled);
    } else {
      // Fallback to simulation if no API key
      const reason = !USE_REAL_SANDBOX 
        ? 'E2B API key not configured or invalid' 
        : `sandboxProvider=${sandboxProvider} (expected e2b)`;
      addLog('warn', `Running in SIMULATION mode - ${reason}`);
      addLog('warn', 'Simulation mode does not create real sandboxes or artifacts');
      await simulateBuildProcess(buildId, appSpec, targetFeatureCount, addLog);
    }

    // If a cancellation was requested during execution, treat as cancelled
    if (!cancelledBuilds.has(buildId)) {
      buildSucceeded = true;
      addLog('info', 'Build completed successfully!');
    } else {
      addLog('info', 'Build cancelled by user');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if this is a review gate pause (not an actual error)
    if (errorMessage.startsWith('REVIEW_GATE_')) {
      const gate = errorMessage.replace('REVIEW_GATE_', '').toLowerCase();
      addLog('info', `⏸️ Build paused for ${gate} review - awaiting approval`);
      // Don't continue to artifact saving or status update - the build is paused
      stopFlusher();
      return;
    }
    
    if (cancelledBuilds.has(buildId)) {
      addLog('info', 'Build cancelled by user');
    } else {
      addLog(
        'error',
        `Build failed: ${errorMessage}`
      );
    }
    // Don't throw yet - we want to try saving artifacts first
  }

  // Save artifacts before destroying sandbox
  const sandbox = activeSandboxes.get(buildId);
  const storageAvailable = isArtifactStorageAvailable();
  
  addLog('info', `Artifact save check: sandbox=${sandbox ? 'yes' : 'no'}, storage=${storageAvailable ? 'yes' : 'no'}`);
  
  if (sandbox && storageAvailable) {
    try {
      // List files in workspace before saving to diagnose empty artifact issues
      const lsResult = await sandbox.exec('ls -la /home/user');
      addLog('info', `Files in workspace before artifact save:\n${lsResult.stdout || '(empty)'}`);
      
      addLog('info', 'Saving build artifacts...');
      artifactKey = await saveBuildArtifacts(buildId, sandbox);
      addLog('info', `Artifacts saved: ${artifactKey}`);
    } catch (e) {
      addLog('error', `Failed to save artifacts: ${e instanceof Error ? e.message : String(e)}`);
    }
  } else if (!sandbox) {
    addLog('warn', 'No active sandbox found - cannot save artifacts. This may indicate the build ran in simulation mode or the sandbox was already destroyed.');
  } else if (!storageAvailable) {
    addLog('warn', 'Artifact storage not available - configure S3_* environment variables to enable artifact storage.');
  }

  // Clean up sandbox
  if (sandbox) {
    try {
      await sandbox.destroy();
      activeSandboxes.delete(buildId);
      addLog('info', 'Sandbox destroyed');
    } catch (e) {
      addLog('error', `Failed to destroy sandbox: ${e}`);
    }
  }

  // Stop log flushing and do final flush
  stopFlusher();

  // Update build status with artifact info
  let finalStatus: 'COMPLETED' | 'FAILED' | 'CANCELLED' = 'FAILED';
  try {
    const wasCancelled = cancelledBuilds.has(buildId);
    finalStatus = wasCancelled
      ? 'CANCELLED'
      : buildSucceeded
        ? 'COMPLETED'
        : 'FAILED';
    await completeBuild(
      buildId,
      finalStatus,
      artifactKey ? { artifactKey } : undefined
    );
    
    // Notify all subscribers that the build is complete
    const subscribers = buildSubscribers.get(buildId);
    if (subscribers) {
      const completeEvent = {
        type: 'complete' as const,
        data: { status: finalStatus, timestamp: new Date().toISOString() },
      };
      subscribers.forEach((callback) => callback(completeEvent));
    }
    
    // Clean up subscriber set after notifying
    buildSubscribers.delete(buildId);
    activeBuildLogs.delete(buildId);
    activeBuildEvents.delete(buildId);
  } catch (e) {
    console.error('Failed to update build status:', e);
  }

  const wasCancelled = cancelledBuilds.has(buildId);
  // Clean cancellation marker
  cancelledBuilds.delete(buildId);

  if (!buildSucceeded && !wasCancelled) {
    throw new Error('Build failed');
  }
}

/**
 * Run a real build in E2B sandbox using the sandbox agent.
 * The agent runs on the server and executes tools in the E2B sandbox.
 */
async function runRealBuild(
  buildId: string,
  appSpec: string,
  _harnessId: string,
  targetFeatureCount: number,
  addLog: (level: string, message: string) => void,
  emitEvent: (event: { id: string; type: string; timestamp: string; [key: string]: unknown }) => void,
  reviewGatesEnabled: boolean = false
): Promise<void> {
  addLog('info', 'Creating E2B sandbox...');

  // Create sandbox with authentication credentials
  const sandbox = await e2bProvider.create({
    template: 'base',
    timeout: 3600, // 1 hour
    env: {
      // Pass OAuth token (preferred) or API key to sandbox
      ...(ANTHROPIC_AUTH_TOKEN && { ANTHROPIC_AUTH_TOKEN }),
      ...(ANTHROPIC_AUTH_TOKEN && { CLAUDE_CODE_OAUTH_TOKEN: ANTHROPIC_AUTH_TOKEN }),
      ...(ANTHROPIC_API_KEY && { ANTHROPIC_API_KEY }),
    },
  });

  activeSandboxes.set(buildId, sandbox);
  addLog('info', `Sandbox created: ${sandbox.id}`);

  // Ensure Node.js 22 for compatibility with modern frameworks like Vite 6.x
  addLog('info', 'Upgrading Node.js to v22 for modern framework compatibility...');
  const { ensureNodeVersion } = await import('./sandbox-utils');
  const nodeUpgraded = await ensureNodeVersion(sandbox, '22');
  if (nodeUpgraded) {
    addLog('info', 'Node.js v22 is now available');
  } else {
    addLog('warn', 'Node.js upgrade may have failed, continuing anyway...');
  }

  // Extend sandbox timeout periodically to prevent timeout during long builds
  // E2B hobby tier has 1 hour max, so we extend every 50 minutes
  const TIMEOUT_EXTENSION_INTERVAL_MS = 50 * 60 * 1000; // 50 minutes
  const TIMEOUT_EXTENSION_MS = 60 * 60 * 1000; // Extend by 1 hour each time
  const timeoutExtensionInterval = setInterval(async () => {
    try {
      await sandbox.setTimeout(TIMEOUT_EXTENSION_MS);
      addLog('info', `Sandbox timeout extended by ${TIMEOUT_EXTENSION_MS / 60000} minutes`);
    } catch (e) {
      addLog('warn', `Failed to extend sandbox timeout: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, TIMEOUT_EXTENSION_INTERVAL_MS);

  try {
    // Run the sandbox agent - this executes Claude on the server
    // and redirects tool calls to the E2B sandbox
    // The agent runs autonomously until all features are complete
    // See: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
    await runSandboxAgent({
      buildId,
      sandbox,
      appSpec,
      targetFeatureCount,
      onLog: (level, message) => {
        addLog(level, message);
      },
      onProgress: async (completed, total, currentFeature) => {
        addLog('info', `Progress: ${completed}/${total} features${currentFeature ? ` - Working on: ${currentFeature}` : ''}`);
        
        // Update build progress in database
        try {
          await updateBuild(buildId, {
            progress: {
              completed,
              total,
            },
          });
        } catch (e) {
          console.error('Failed to update build progress:', e);
        }
      },
      onEvent: (event) => {
        emitEvent(event);
      },
      shouldStop: () => cancelledBuilds.has(buildId),
      reviewGatesEnabled,
      onReviewGate: reviewGatesEnabled ? async (gate) => {
        // Update build status to awaiting review
        const status = gate === 'design' ? 'AWAITING_DESIGN_REVIEW' : 'AWAITING_FEATURE_REVIEW';
        addLog('info', `⏸️ Pausing build for ${gate} review`);
        
        // Save artifacts before pausing
        if (isArtifactStorageAvailable()) {
          try {
            const artifactKey = await saveBuildArtifacts(buildId, sandbox);
            addLog('info', `Artifacts saved for review: ${artifactKey}`);
            await updateBuild(buildId, { 
              status: status as BuildStatus,
              artifactKey,
            });
          } catch (e) {
            addLog('warn', `Could not save artifacts: ${e instanceof Error ? e.message : 'Unknown error'}`);
            await updateBuild(buildId, { status: status as BuildStatus });
          }
        } else {
          await updateBuild(buildId, { status: status as BuildStatus });
        }
        
        // Notify subscribers that build is awaiting review
        const subscribers = buildSubscribers.get(buildId);
        if (subscribers) {
          const reviewEvent = {
            type: 'event' as const,
            data: {
              id: `review_${Date.now()}`,
              type: 'review_gate',
              timestamp: new Date().toISOString(),
              gate,
              status: 'awaiting_review',
              buildId,
            },
          };
          subscribers.forEach((callback) => callback(reviewEvent));
        }
        
        // Throw an error to stop the agent execution
        // The build will be resumed when the user approves
        throw new Error(`REVIEW_GATE_${gate.toUpperCase()}`);
      } : undefined,
    });
  } catch (error) {
    addLog('error', `Agent execution error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    // Always clear the timeout extension interval
    clearInterval(timeoutExtensionInterval);
  }
}

/**
 * Simulate a build process for demo purposes (fallback when no E2B key)
 */
async function simulateBuildProcess(
  buildId: string,
  appSpec: string,
  targetFeatureCount: number,
  addLog: (level: string, message: string) => void
): Promise<void> {
  const steps = [
    { delay: 500, level: 'info', message: 'Initializing sandbox environment...' },
    { delay: 1000, level: 'tool', message: 'bash: mkdir -p src/app src/components src/lib' },
    { delay: 500, level: 'info', message: 'Writing app specification...' },
    { delay: 1000, level: 'tool', message: 'text_editor: Created app_spec.txt' },
    { delay: 500, level: 'info', message: 'Installing dependencies...' },
    { delay: 2000, level: 'tool', message: 'bash: npm install next react react-dom typescript' },
    { delay: 500, level: 'info', message: 'Analyzing requirements...' },
    { delay: 1000, level: 'info', message: 'Starting feature implementation...' },
  ];

  // Extract features from app_spec
  const featureMatches = appSpec.match(/###\s+Feature\s+\d+[:\s]+([^\n]+)/g) || [];
  const features = featureMatches.map((f) => f.replace(/###\s+Feature\s+\d+[:\s]+/, '').trim());

  if (features.length === 0) {
    // Try alternative patterns
    const altMatches = appSpec.match(/####\s+Feature\s+\d+[:\s]+([^\n]+)/g) || [];
    features.push(...altMatches.map((f) => f.replace(/####\s+Feature\s+\d+[:\s]+/, '').trim()));
  }

  if (features.length === 0) {
    // Default features if none extracted
    features.push(
      'Project setup and configuration',
      'Core application structure',
      'Main page component',
      'Basic styling'
    );
  }

  // Run initial steps
  for (const step of steps) {
    if (cancelledBuilds.has(buildId)) {
      addLog('info', 'Build stopped by user');
      return;
    }
    await delay(step.delay);
    addLog(step.level, step.message);
  }

  // Simulate implementing each feature with progress updates
  for (let i = 0; i < features.length; i++) {
    if (cancelledBuilds.has(buildId)) {
      addLog('info', 'Build stopped by user');
      return;
    }
    const feature = features[i];
    await delay(1000);
    addLog('info', `Feature ${i + 1}/${features.length}: ${feature} - Starting...`);
    
    if (cancelledBuilds.has(buildId)) {
      addLog('info', 'Build stopped by user');
      return;
    }
    await delay(500);
    addLog('tool', `text_editor: Creating components for ${feature.toLowerCase().replace(/\s+/g, '-')}`);
    
    if (cancelledBuilds.has(buildId)) {
      addLog('info', 'Build stopped by user');
      return;
    }
    await delay(1500);
    addLog('tool', 'bash: npm run test -- --passWithNoTests');
    
    if (cancelledBuilds.has(buildId)) {
      addLog('info', 'Build stopped by user');
      return;
    }
    await delay(500);
    addLog('info', `Feature ${i + 1}/${features.length}: ${feature} - Passed ✓`);
    
    // Update progress in database
    try {
      await updateBuild(buildId, {
        progress: {
          completed: i + 1,
          total: features.length,
          features: features.slice(0, i + 1).map((f, idx) => ({
            id: `feature-${idx + 1}`,
            description: f,
            status: 'passed' as const,
          })),
        },
      });
    } catch (e) {
      console.error('Failed to update build progress:', e);
    }
  }

  // Final steps
  if (cancelledBuilds.has(buildId)) {
    addLog('info', 'Build stopped by user');
    return;
  }
  await delay(1000);
  addLog('tool', 'bash: npm run build');
  await delay(2000);
  addLog('info', 'Build artifacts generated successfully');
}

/**
 * Subscribe to build updates (logs and events)
 * Sends historical logs from database first, then real-time updates
 * 
 * IMPORTANT: We subscribe BEFORE sending existing data to avoid race condition
 * where updates added between reading existing and subscribing would be lost.
 */
export function subscribeToBuildUpdates(
  buildId: string,
  callback: (update: { type: 'log' | 'event' | 'complete'; data: unknown }) => void
): () => void {
  // Initialize subscriber set if needed
  if (!buildSubscribers.has(buildId)) {
    buildSubscribers.set(buildId, new Set());
  }

  // Track which IDs we've sent to avoid duplicates
  const sentIds = new Set<string>();

  // Wrapped callback that deduplicates
  const wrappedCallback = (update: BuildUpdate) => {
    // For 'complete' events, skip deduplication (they don't have IDs)
    if (update.type === 'complete') {
      callback({ type: update.type, data: update.data });
      return;
    }
    
    const id = (update.data as LogEntry | AgentEvent).id;
    if (sentIds.has(id)) return;
    sentIds.add(id);
    callback({ type: update.type, data: update.data });
  };

  // Subscribe FIRST (before reading existing data)
  // This ensures no updates are lost between reading and subscribing
  buildSubscribers.get(buildId)!.add(wrappedCallback);

  // Then send existing in-memory logs (if build is active)
  const existingLogs = activeBuildLogs.get(buildId) || [];
  existingLogs.forEach((log) => wrappedCallback({ type: 'log', data: log }));
  
  // Then send existing in-memory events
  const existingEvents = activeBuildEvents.get(buildId) || [];
  existingEvents.forEach((event) => wrappedCallback({ type: 'event', data: event }));

  // Return unsubscribe function
  return () => {
    buildSubscribers.get(buildId)?.delete(wrappedCallback);
  };
}

/**
 * Subscribe to build logs (legacy - for backwards compatibility)
 * @deprecated Use subscribeToBuildUpdates instead
 */
export function subscribeToBuildLogs(
  buildId: string,
  callback: (log: unknown) => void
): () => void {
  return subscribeToBuildUpdates(buildId, (update) => {
    // Only forward logs for backwards compatibility
    if (update.type === 'log') {
      callback(update.data);
    }
  });
}

/**
 * Load historical logs from database for a build
 * Used when reconnecting to a build that started before this server instance
 */
export async function loadHistoricalLogs(buildId: string): Promise<LogEntry[]> {
  try {
    // Load all logs - no limit, since we need the latest progress info
    const dbLogs = await getDbBuildLogs(buildId, { limit: 10000 });
    return dbLogs.map((log) => {
      const metadata = log.metadata as { originalId?: string; timestamp?: string } | null;
      return {
        id: metadata?.originalId || log.id,
        level: log.level,
        message: log.message,
        timestamp: metadata?.timestamp || log.createdAt.toISOString(),
      };
    });
  } catch (error) {
    console.error('Failed to load historical logs:', error);
    return [];
  }
}

/**
 * Load historical events from database for a build
 * Used when viewing a completed build's structured events
 */
export async function loadHistoricalEvents(buildId: string): Promise<AgentEvent[]> {
  try {
    // Load all events - no limit, for complete activity history
    const dbEvents = await getDbBuildEvents({ buildId, limit: 10000 });
    return dbEvents.map((event) => {
      const data = event.data as Record<string, unknown>;
      return {
        id: data.id as string || event.id,
        type: event.type,
        timestamp: data.timestamp as string || event.createdAt.toISOString(),
        buildId: event.buildId,
        ...data,
      } as AgentEvent;
    });
  } catch (error) {
    console.error('Failed to load historical events:', error);
    return [];
  }
}

/**
 * Get current build logs (in-memory only)
 */
export function getBuildLogs(buildId: string): LogEntry[] {
  return activeBuildLogs.get(buildId) || [];
}

/**
 * Get current build events (in-memory only)
 */
export function getBuildEvents(buildId: string): AgentEvent[] {
  return activeBuildEvents.get(buildId) || [];
}

/**
 * Check if a build is currently active in this server instance
 */
export function isBuildActive(buildId: string): boolean {
  return activeBuildLogs.has(buildId);
}

/**
 * Stop a running build
 * IMPORTANT: This now saves artifacts BEFORE destroying the sandbox
 * so the build can be resumed later.
 */
export async function stopBuild(buildId: string): Promise<{ success: boolean; artifactKey?: string }> {
  // Signal cancellation first
  cancelledBuilds.add(buildId);
  
  const sandbox = activeSandboxes.get(buildId);
  let artifactKey: string | undefined;
  
  const addLogMessage = (message: string) => {
    const log: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
    };
    const logs = activeBuildLogs.get(buildId) || [];
    logs.push(log);
    activeBuildLogs.set(buildId, logs);
    
    const subscribers = buildSubscribers.get(buildId);
    if (subscribers) {
      subscribers.forEach((callback) => callback({ type: 'log', data: log }));
    }
  };
  
  if (sandbox) {
    try {
      // SAVE ARTIFACTS FIRST before destroying sandbox
      addLogMessage('Stopping build - saving artifacts for resume...');
      
      if (isArtifactStorageAvailable()) {
        try {
          artifactKey = await saveBuildArtifacts(buildId, sandbox);
          addLogMessage(`Artifacts saved: ${artifactKey}`);
          console.log(`[stop] Saved artifacts before stop: ${artifactKey}`);
        } catch (e) {
          console.error(`[stop] Failed to save artifacts:`, e);
          addLogMessage(`Warning: Could not save artifacts: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      } else {
        addLogMessage('Warning: Artifact storage not available');
      }
      
      // Store checkpoint data if we have progress info
      const progress = await getProgress(buildId);
      if (progress && progress.total > 0) {
        buildCheckpoints.set(buildId, {
          checkpointData: {
            completedFeatures: progress.completedFeatures,
            currentPhase: progress.currentPhase,
            currentFeatureIndex: progress.completed,
            totalFeatures: progress.total,
          },
          conversationHistory: null,
        });
        addLogMessage(`Checkpoint saved: ${progress.completed}/${progress.total} features`);
      }
      
      // NOW destroy the sandbox
      addLogMessage('Build stopped by user');
      await sandbox.destroy();
      activeSandboxes.delete(buildId);
      
      return { success: true, artifactKey };
    } catch (error) {
      console.error(`[stop] Error stopping build:`, error);
      return { success: false };
    }
  }
  
  return { success: false };
}

/**
 * Helper delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Pause / Resume Functions
// ============================================================================

/**
 * Pause a running build execution
 * Signals the build to stop at the next checkpoint and save state
 */
export async function pauseBuildExecution(buildId: string): Promise<{
  success: boolean;
  error?: string;
  artifactKey?: string;
}> {
  console.log(`[pause] Attempting to pause build: ${buildId}`);
  
  // Check if build is active - but also check for sandbox
  const hasActiveLogs = activeBuildLogs.has(buildId);
  const hasSandbox = activeSandboxes.has(buildId);
  
  console.log(`[pause] Build state: hasActiveLogs=${hasActiveLogs}, hasSandbox=${hasSandbox}`);
  
  if (!hasActiveLogs && !hasSandbox) {
    return { success: false, error: 'Build is not currently active on this server' };
  }

  // Signal pause request
  pausedBuilds.add(buildId);
  console.log(`[pause] Pause signal sent, pausedBuilds now has: ${pausedBuilds.size} items`);

  // Immediately emit a "pause requested" log so UI shows feedback
  const pauseRequestedLog: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    level: 'info',
    message: '⏸️ Pause requested - waiting for current operation to complete...',
    timestamp: new Date().toISOString(),
  };
  const currentLogs = activeBuildLogs.get(buildId) || [];
  currentLogs.push(pauseRequestedLog);
  activeBuildLogs.set(buildId, currentLogs);
  
  // Notify subscribers immediately so UI updates
  const currentSubscribers = buildSubscribers.get(buildId);
  if (currentSubscribers) {
    currentSubscribers.forEach((callback) => callback({ type: 'log', data: pauseRequestedLog }));
  }

  // Wait for the build loop to notice the pause - longer timeout for hung builds
  // Check every 100ms for up to 3 seconds
  let waited = 0;
  const maxWait = 3000;
  while (waited < maxWait) {
    await delay(100);
    waited += 100;
    // If the sandbox is destroyed, the pause was processed
    if (!activeSandboxes.has(buildId)) {
      console.log(`[pause] Sandbox no longer active after ${waited}ms`);
      break;
    }
  }
  
  console.log(`[pause] Waited ${waited}ms for pause to be processed`);

  // Try to save artifacts - the sandbox might still be alive if the build is stuck
  const sandbox = activeSandboxes.get(buildId);
  let artifactKey: string | undefined;

  if (sandbox && isArtifactStorageAvailable()) {
    try {
      console.log(`[pause] Saving artifacts for paused build...`);
      artifactKey = await saveBuildArtifacts(buildId, sandbox);
      console.log(`[pause] Saved artifacts for paused build: ${artifactKey}`);
    } catch (e) {
      console.error(`[pause] Failed to save artifacts:`, e);
      // Even if artifact saving fails, we can still pause
    }
  } else {
    console.log(`[pause] Cannot save artifacts: sandbox=${!!sandbox}, storage=${isArtifactStorageAvailable()}`);
  }

  // Store checkpoint info
  const progress = await getProgress(buildId);
  buildCheckpoints.set(buildId, {
    checkpointData: {
      completedFeatures: progress?.completedFeatures || [],
      currentPhase: progress?.currentPhase || 'unknown',
      currentFeatureIndex: progress?.completed || 0,
      totalFeatures: progress?.total || 0,
    },
    conversationHistory: null, // TODO: Save agent conversation history when we add it
  });

  // Add log entry
  const log: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    level: 'info',
    message: 'Build paused by user - checkpoint saved',
    timestamp: new Date().toISOString(),
  };
  const logs = activeBuildLogs.get(buildId) || [];
  logs.push(log);
  activeBuildLogs.set(buildId, logs);

  const subscribers = buildSubscribers.get(buildId);
  if (subscribers) {
    subscribers.forEach((callback) => callback({ type: 'log', data: log }));
  }

  return { success: true, artifactKey };
}

/**
 * Get checkpoint data for a build
 */
export function getCheckpointData(buildId: string): CheckpointInfo | undefined {
  return buildCheckpoints.get(buildId);
}

/**
 * Get current progress from database or memory
 */
async function getProgress(buildId: string): Promise<{
  completed: number;
  total: number;
  completedFeatures: string[];
  currentPhase: string;
} | null> {
  try {
    const { getBuildById } = await import('@repo/database');
    const build = await getBuildById(buildId);
    if (!build || !build.progress) return null;
    
    const progress = build.progress as {
      completed?: number;
      total?: number;
      features?: Array<{ description?: string; status?: string }>;
    };
    
    return {
      completed: progress.completed || 0,
      total: progress.total || 0,
      completedFeatures: (progress.features || [])
        .filter((f) => f.status === 'passed')
        .map((f) => f.description || 'Unknown feature'),
      currentPhase: 'building',
    };
  } catch {
    return null;
  }
}

/**
 * Resume a build from a saved checkpoint
 */
export async function resumeBuildFromCheckpoint(
  buildId: string,
  appSpec: string,
  sandboxProvider: string,
  harnessId: string,
  targetFeatureCount: number,
  checkpoint: {
    checkpointData: Record<string, unknown> | null;
    conversationHistory: unknown[] | null;
    artifactKey: string | null;
  }
): Promise<void> {
  // Clear pause state
  pausedBuilds.delete(buildId);
  cancelledBuilds.delete(buildId);

  // Initialize log and event storage for this build
  activeBuildLogs.set(buildId, []);
  activeBuildEvents.set(buildId, []);
  logWriteBuffer.set(buildId, []);
  eventWriteBuffer.set(buildId, []);

  // Start periodic log flushing
  const stopFlusher = startLogFlusher(buildId);

  const addLog = (level: string, message: string) => {
    const log: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    const logs = activeBuildLogs.get(buildId) || [];
    logs.push(log);
    activeBuildLogs.set(buildId, logs);

    const buffer = logWriteBuffer.get(buildId) || [];
    buffer.push(log);
    logWriteBuffer.set(buildId, buffer);

    if (buffer.length >= LOG_FLUSH_SIZE) {
      flushLogBuffer(buildId);
    }

    const subscribers = buildSubscribers.get(buildId);
    if (subscribers) {
      subscribers.forEach((callback) => callback({ type: 'log', data: log }));
    }
  };

  const emitEvent = (event: { id: string; type: string; timestamp: string; [key: string]: unknown }) => {
    const fullEvent = { ...event, buildId } as AgentEvent;
    
    const events = activeBuildEvents.get(buildId) || [];
    events.push(fullEvent);
    activeBuildEvents.set(buildId, events);
    
    const buffer = eventWriteBuffer.get(buildId) || [];
    buffer.push(fullEvent);
    eventWriteBuffer.set(buildId, buffer);
    
    const subscribers = buildSubscribers.get(buildId);
    if (subscribers) {
      subscribers.forEach((callback) => callback({ type: 'event', data: fullEvent }));
    }
  };

  // Check if we have checkpoint data from the database
  const checkpointData = checkpoint.checkpointData as {
    currentFeatureIndex?: number;
    totalFeatures?: number;
    completedFeatures?: string[];
  } | null;

  const hasCheckpointData = checkpointData && (
    checkpointData.currentFeatureIndex !== undefined || 
    (checkpointData.completedFeatures && checkpointData.completedFeatures.length > 0)
  );

  addLog('info', `Resuming build...`);
  addLog('info', hasCheckpointData 
    ? 'Using checkpoint data from database' 
    : 'Will read progress from restored feature_list.json');

  let artifactKey: string | undefined;
  let buildSucceeded = false;

  try {
    if (USE_REAL_SANDBOX && sandboxProvider === 'e2b') {
      addLog('info', 'Creating new E2B sandbox for resumed build...');

      const sandbox = await e2bProvider.create({
        template: 'base',
        timeout: 3600,
        env: {
          // Pass OAuth token (preferred) or API key to sandbox
          ...(ANTHROPIC_AUTH_TOKEN && { ANTHROPIC_AUTH_TOKEN }),
          ...(ANTHROPIC_AUTH_TOKEN && { CLAUDE_CODE_OAUTH_TOKEN: ANTHROPIC_AUTH_TOKEN }),
          ...(ANTHROPIC_API_KEY && { ANTHROPIC_API_KEY }),
        },
      });

      activeSandboxes.set(buildId, sandbox);
      addLog('info', `Sandbox created: ${sandbox.id}`);

      // Ensure Node.js 22 for compatibility with modern frameworks like Vite 6.x
      addLog('info', 'Upgrading Node.js to v22 for modern framework compatibility...');
      const { ensureNodeVersion } = await import('./sandbox-utils');
      const nodeUpgraded = await ensureNodeVersion(sandbox, '22');
      if (nodeUpgraded) {
        addLog('info', 'Node.js v22 is now available');
      } else {
        addLog('warn', 'Node.js upgrade may have failed, continuing anyway...');
      }

      // Restore artifacts
      if (checkpoint.artifactKey) {
        addLog('info', 'Restoring previous work from artifacts...');
        try {
          const { restoreArtifactsToSandbox } = await import('./artifact-storage');
          await restoreArtifactsToSandbox(buildId, sandbox, '/home/user');
          addLog('info', 'Previous work restored successfully');
        } catch (e) {
          addLog('error', `Failed to restore artifacts: ${e instanceof Error ? e.message : String(e)}`);
          throw new Error('Cannot resume without artifacts');
        }
      }

      // Determine resume context - either from checkpoint or from feature_list.json
      let startingFeatureIndex = 0;
      let completedFeatures: string[] = [];

      if (hasCheckpointData) {
        // Use checkpoint data from database
        startingFeatureIndex = checkpointData!.currentFeatureIndex || 0;
        completedFeatures = checkpointData!.completedFeatures || [];
        addLog('info', `Checkpoint: ${startingFeatureIndex} features completed`);
      } else {
        // Read progress from feature_list.json in the sandbox
        addLog('info', 'Reading progress from feature_list.json...');
        try {
          const featureListContent = await sandbox.readFile('/home/user/feature_list.json');
          const featureList = JSON.parse(featureListContent);
          
          if (Array.isArray(featureList)) {
            // Count completed features
            completedFeatures = featureList
              .filter((f: { status?: string }) => f.status === 'completed' || f.status === 'passed')
              .map((f: { name?: string; description?: string }) => f.name || f.description || 'Unknown');
            startingFeatureIndex = completedFeatures.length;
            addLog('info', `Found ${startingFeatureIndex} completed features in feature_list.json`);
          } else if (featureList.features && Array.isArray(featureList.features)) {
            completedFeatures = featureList.features
              .filter((f: { status?: string }) => f.status === 'completed' || f.status === 'passed')
              .map((f: { name?: string; description?: string }) => f.name || f.description || 'Unknown');
            startingFeatureIndex = completedFeatures.length;
            addLog('info', `Found ${startingFeatureIndex} completed features in feature_list.json`);
          }
        } catch (e) {
          addLog('warn', `Could not read feature_list.json: ${e instanceof Error ? e.message : String(e)}`);
          addLog('info', 'Starting from beginning with existing files as context');
        }
      }

      if (completedFeatures.length > 0) {
        addLog('info', `Last completed: ${completedFeatures.slice(-3).join(', ')}${completedFeatures.length > 3 ? '...' : ''}`);
      }

      // Run the agent with resume context
      try {
        await runSandboxAgent({
          buildId,
          sandbox,
          appSpec,
          targetFeatureCount,
          onLog: (level, message) => addLog(level, message),
          onProgress: async (completed, total, currentFeature) => {
            addLog('info', `Progress: ${completed}/${total} features${currentFeature ? ` - Working on: ${currentFeature}` : ''}`);
            try {
              await updateBuild(buildId, {
                progress: { completed, total },
              });
            } catch (e) {
              console.error('Failed to update build progress:', e);
            }
          },
          onEvent: (event) => emitEvent(event),
          shouldStop: () => cancelledBuilds.has(buildId) || pausedBuilds.has(buildId),
          resumeContext: {
            startingFeatureIndex,
            completedFeatures,
          },
        });
      } catch (error) {
        addLog('error', `Agent execution error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    } else {
      // Simulation mode resume
      addLog('warn', 'Resume not fully supported in simulation mode');
      const startingFeature = checkpointData?.currentFeatureIndex || 0;
      await simulateBuildProcess(buildId, appSpec, targetFeatureCount - startingFeature, addLog);
    }

    if (!cancelledBuilds.has(buildId) && !pausedBuilds.has(buildId)) {
      buildSucceeded = true;
      addLog('info', 'Build completed successfully!');
    } else if (pausedBuilds.has(buildId)) {
      addLog('info', 'Build paused by user');
    } else {
      addLog('info', 'Build cancelled by user');
    }
  } catch (error) {
    addLog('error', `Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Save final artifacts
  const sandbox = activeSandboxes.get(buildId);
  if (sandbox && isArtifactStorageAvailable()) {
    try {
      addLog('info', 'Saving build artifacts...');
      artifactKey = await saveBuildArtifacts(buildId, sandbox);
      addLog('info', `Artifacts saved: ${artifactKey}`);
    } catch (e) {
      addLog('error', `Failed to save artifacts: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Clean up sandbox
  if (sandbox) {
    try {
      await sandbox.destroy();
      activeSandboxes.delete(buildId);
      addLog('info', 'Sandbox destroyed');
    } catch (e) {
      addLog('error', `Failed to destroy sandbox: ${e}`);
    }
  }

  stopFlusher();

  // Update final status
  const wasPaused = pausedBuilds.has(buildId);
  const wasCancelled = cancelledBuilds.has(buildId);
  
  // Don't complete build if paused - leave in PAUSED state
  if (!wasPaused) {
    const finalStatus = wasCancelled ? 'CANCELLED' : buildSucceeded ? 'COMPLETED' : 'FAILED';
    try {
      await completeBuild(buildId, finalStatus, artifactKey ? { artifactKey } : undefined);

      const subscribers = buildSubscribers.get(buildId);
      if (subscribers) {
        const completeEvent = {
          type: 'complete' as const,
          data: { status: finalStatus, timestamp: new Date().toISOString() },
        };
        subscribers.forEach((callback) => callback(completeEvent));
      }
    } catch (e) {
      console.error('Failed to update build status:', e);
    }
  }

  // Cleanup
  buildSubscribers.delete(buildId);
  activeBuildLogs.delete(buildId);
  activeBuildEvents.delete(buildId);
  pausedBuilds.delete(buildId);
  cancelledBuilds.delete(buildId);
  buildCheckpoints.delete(buildId);
}

/**
 * Check if a pause has been requested for a build
 */
export function isPauseRequested(buildId: string): boolean {
  return pausedBuilds.has(buildId);
}
