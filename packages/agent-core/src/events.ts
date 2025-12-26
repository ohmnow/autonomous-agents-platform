/**
 * Structured Event Types for Build Activity
 *
 * These events provide granular visibility into what the autonomous agent
 * is doing during a build.
 */

// =============================================================================
// Base Event Type
// =============================================================================

export interface BaseEvent {
  id: string;
  type: string;
  timestamp: string;
  buildId: string;
}

// =============================================================================
// Phase Events - High-level build phases
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

export interface PhaseEvent extends BaseEvent {
  type: 'phase';
  phase: BuildPhase;
  message?: string;
}

// =============================================================================
// Feature Events - Feature-level progress
// =============================================================================

export type FeatureStatus = 'pending' | 'in_progress' | 'testing' | 'passed' | 'failed';

export interface FeatureStartEvent extends BaseEvent {
  type: 'feature_start';
  featureId: string;
  featureIndex: number;
  totalFeatures: number;
  title: string;
  description?: string;
}

export interface FeatureProgressEvent extends BaseEvent {
  type: 'feature_progress';
  featureId: string;
  step: string; // e.g., "Creating components", "Writing tests", "Running tests"
  stepIndex?: number;
  totalSteps?: number;
}

export interface FeatureEndEvent extends BaseEvent {
  type: 'feature_end';
  featureId: string;
  status: 'passed' | 'failed';
  testsPassed?: number;
  testsFailed?: number;
  summary?: string;
  durationMs: number;
}

// =============================================================================
// Thinking Events - Agent thoughts/planning
// =============================================================================

export interface ThinkingEvent extends BaseEvent {
  type: 'thinking';
  content: string;
  phase: 'planning' | 'analyzing' | 'deciding';
}

// =============================================================================
// Activity Events - What the agent is currently doing
// =============================================================================

export type ActivityType =
  | 'thinking'
  | 'planning'
  | 'implementing'
  | 'writing_code'
  | 'running_command'
  | 'running_tests'
  | 'reading_file'
  | 'analyzing_output'
  | 'fixing_error'
  | 'idle';

export interface ActivityEvent extends BaseEvent {
  type: 'activity';
  activity: ActivityType;
  description: string; // Human-readable description, e.g., "Planning next feature"
  detail?: string; // Optional extra detail
}

// =============================================================================
// Command Events - Bash command execution with details
// =============================================================================

export interface CommandEvent extends BaseEvent {
  type: 'command';
  command: string;
  exitCode: number;
  stdout?: string;
  stderr?: string;
  durationMs: number;
}

// =============================================================================
// Tool Events - Tool execution tracking
// =============================================================================

export interface ToolStartEvent extends BaseEvent {
  type: 'tool_start';
  toolName: 'bash' | 'write_file' | 'read_file' | 'str_replace_editor';
  toolUseId: string;
  input: Record<string, unknown>;
  displayInput?: string; // Truncated/formatted for display
}

export interface ToolEndEvent extends BaseEvent {
  type: 'tool_end';
  toolUseId: string;
  success: boolean;
  output?: string;
  displayOutput?: string; // Truncated/formatted for display
  durationMs: number;
  error?: string;
}

// =============================================================================
// File Events - File system changes
// =============================================================================

export interface FileEvent extends BaseEvent {
  type: 'file_created' | 'file_modified' | 'file_deleted';
  path: string;
  language?: string; // Inferred from extension
  size?: number;
  linesAdded?: number;
  linesRemoved?: number;
}

// =============================================================================
// Test Events - Test execution results
// =============================================================================

export interface TestRunEvent extends BaseEvent {
  type: 'test_run';
  command: string;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  durationMs: number;
  output?: string;
}

// =============================================================================
// Error Events - Errors and recovery
// =============================================================================

export interface ErrorEvent extends BaseEvent {
  type: 'error';
  severity: 'warning' | 'error' | 'fatal';
  message: string;
  details?: string;
  recoverable: boolean;
  recovering?: boolean; // True if agent is attempting to fix
}

// =============================================================================
// Progress Events - Overall build progress
// =============================================================================

export interface ProgressEvent extends BaseEvent {
  type: 'progress';
  completed: number;
  total: number;
  percentComplete: number;
  currentFeature?: string;
  estimatedRemainingMs?: number; // Estimated time remaining
  averageFeatureDurationMs?: number; // Average time per feature so far
}

// =============================================================================
// Feature List Events - Full feature list from feature_list.json
// =============================================================================

export interface FeatureListItem {
  category: 'functional' | 'style';
  description: string;
  steps: string[];
  passes: boolean;
  /** If true, must complete before non-blocking features can run in parallel */
  blocking?: boolean;
  /** Feature descriptions this feature depends on (for dependency ordering) */
  dependsOn?: string[];
}

export interface FeatureListEvent extends BaseEvent {
  type: 'feature_list';
  features: FeatureListItem[];
  total: number;
  completed: number;
}

// =============================================================================
// Union Type & Utilities
// =============================================================================

export type AgentEvent =
  | PhaseEvent
  | FeatureStartEvent
  | FeatureProgressEvent
  | FeatureEndEvent
  | ThinkingEvent
  | ActivityEvent
  | ToolStartEvent
  | ToolEndEvent
  | FileEvent
  | CommandEvent
  | TestRunEvent
  | ErrorEvent
  | ProgressEvent
  | FeatureListEvent;

export type EventType = AgentEvent['type'];

/**
 * Event categories for UI filtering
 */
export type EventCategory =
  | 'thought'    // ThinkingEvent
  | 'tool'       // ToolStartEvent, ToolEndEvent
  | 'file'       // FileEvent
  | 'feature'    // FeatureStartEvent, FeatureProgressEvent, FeatureEndEvent
  | 'progress'   // ProgressEvent
  | 'phase'      // PhaseEvent
  | 'command'    // CommandEvent
  | 'test'       // TestRunEvent
  | 'activity'   // ActivityEvent
  | 'error';     // ErrorEvent

/**
 * Get the category for an event type
 */
export function getEventCategory(event: AgentEvent): EventCategory {
  switch (event.type) {
    case 'thinking':
      return 'thought';
    case 'tool_start':
    case 'tool_end':
      return 'tool';
    case 'file_created':
    case 'file_modified':
    case 'file_deleted':
      return 'file';
    case 'feature_start':
    case 'feature_progress':
    case 'feature_end':
    case 'feature_list':
      return 'feature';
    case 'progress':
      return 'progress';
    case 'phase':
      return 'phase';
    case 'command':
      return 'command';
    case 'test_run':
      return 'test';
    case 'activity':
      return 'activity';
    case 'error':
      return 'error';
    default:
      return 'activity';
  }
}

/**
 * Generate a unique event ID
 */
export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a new event with common fields populated
 */
export function createEvent<T extends AgentEvent>(
  buildId: string,
  event: Omit<T, 'id' | 'timestamp' | 'buildId'>
): T {
  return {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    buildId,
    ...event,
  } as T;
}

/**
 * Infer programming language from file extension
 */
export function inferLanguage(path: string): string | undefined {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
  };
  return ext ? languageMap[ext] : undefined;
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Get a human-readable description for an activity
 */
export function getActivityLabel(activity: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    thinking: 'Thinking...',
    planning: 'Planning next steps...',
    implementing: 'Implementing feature...',
    writing_code: 'Writing code...',
    running_command: 'Running command...',
    running_tests: 'Running tests...',
    reading_file: 'Reading file...',
    analyzing_output: 'Analyzing output...',
    fixing_error: 'Fixing error...',
    idle: 'Idle',
  };
  return labels[activity];
}
