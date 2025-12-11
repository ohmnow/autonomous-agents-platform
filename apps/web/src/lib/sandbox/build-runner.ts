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

// Configuration
const USE_REAL_SANDBOX = process.env.E2B_API_KEY && process.env.E2B_API_KEY !== 'your_e2b_api_key_here';
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

// Buffer for batching log writes to database
const logWriteBuffer = new Map<string, LogEntry[]>();
const eventWriteBuffer = new Map<string, AgentEvent[]>();
const LOG_FLUSH_INTERVAL = 500; // Flush logs every 500ms
const LOG_FLUSH_SIZE = 10; // Or when buffer reaches 10 logs

// Subscriber type that can receive logs or events
interface BuildUpdate {
  type: 'log' | 'event';
  data: LogEntry | AgentEvent;
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
        data: event as Record<string, unknown>,
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
  targetFeatureCount: number = 80
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
      await runRealBuild(buildId, appSpec, harnessId, targetFeatureCount, addLog, emitEvent);
    } else {
      // Fallback to simulation if no API key
      const reason = !USE_REAL_SANDBOX 
        ? 'E2B API key not configured or invalid' 
        : `sandboxProvider=${sandboxProvider} (expected e2b)`;
      addLog('warn', `Running in SIMULATION mode - ${reason}`);
      addLog('warn', 'Simulation mode does not create real sandboxes or artifacts');
      await simulateBuildProcess(buildId, appSpec, targetFeatureCount, addLog);
    }

    buildSucceeded = true;
    addLog('info', 'Build completed successfully!');
  } catch (error) {
    addLog(
      'error',
      `Build failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    // Don't throw yet - we want to try saving artifacts first
  }

  // Save artifacts before destroying sandbox
  const sandbox = activeSandboxes.get(buildId);
  const storageAvailable = isArtifactStorageAvailable();
  
  addLog('info', `Artifact save check: sandbox=${sandbox ? 'yes' : 'no'}, storage=${storageAvailable ? 'yes' : 'no'}`);
  
  if (sandbox && storageAvailable) {
    try {
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
  try {
    await completeBuild(
      buildId,
      buildSucceeded ? 'COMPLETED' : 'FAILED',
      artifactKey ? { artifactKey } : undefined
    );
  } catch (e) {
    console.error('Failed to update build status:', e);
  }

  if (!buildSucceeded) {
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
  emitEvent: (event: { id: string; type: string; timestamp: string; [key: string]: unknown }) => void
): Promise<void> {
  addLog('info', 'Creating E2B sandbox...');

  // Create sandbox
  const sandbox = await e2bProvider.create({
    template: 'base',
    timeout: 3600, // 1 hour
    env: {
      ANTHROPIC_API_KEY: ANTHROPIC_API_KEY || '',
    },
  });

  activeSandboxes.set(buildId, sandbox);
  addLog('info', `Sandbox created: ${sandbox.id}`);

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
    });
  } catch (error) {
    addLog('error', `Agent execution error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
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
    await delay(step.delay);
    addLog(step.level, step.message);
  }

  // Simulate implementing each feature with progress updates
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    await delay(1000);
    addLog('info', `Feature ${i + 1}/${features.length}: ${feature} - Starting...`);
    
    await delay(500);
    addLog('tool', `text_editor: Creating components for ${feature.toLowerCase().replace(/\s+/g, '-')}`);
    
    await delay(1500);
    addLog('tool', 'bash: npm run test -- --passWithNoTests');
    
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
  callback: (update: { type: 'log' | 'event'; data: unknown }) => void
): () => void {
  // Initialize subscriber set if needed
  if (!buildSubscribers.has(buildId)) {
    buildSubscribers.set(buildId, new Set());
  }

  // Track which IDs we've sent to avoid duplicates
  const sentIds = new Set<string>();

  // Wrapped callback that deduplicates
  const wrappedCallback = (update: BuildUpdate) => {
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
    const dbLogs = await getDbBuildLogs(buildId, { limit: 1000 });
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
    const dbEvents = await getDbBuildEvents({ buildId, limit: 1000 });
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
 */
export async function stopBuild(buildId: string): Promise<boolean> {
  const sandbox = activeSandboxes.get(buildId);
  if (sandbox) {
    try {
      await sandbox.destroy();
      activeSandboxes.delete(buildId);
      
      const log: LogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        level: 'info',
        message: 'Build stopped by user',
        timestamp: new Date().toISOString(),
      };
      const logs = activeBuildLogs.get(buildId) || [];
      logs.push(log);
      activeBuildLogs.set(buildId, logs);
      
      const subscribers = buildSubscribers.get(buildId);
      if (subscribers) {
        subscribers.forEach((callback) => callback({ type: 'log', data: log }));
      }
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Helper delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
