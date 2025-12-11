/**
 * Agent Core Package
 * ==================
 *
 * Core functionality for the autonomous agents platform.
 *
 * @packageDocumentation
 */

// Types
export type {
  // Sandbox types
  ExecResult,
  AgentOutput,
  Sandbox,
  SandboxConfig,
  // Progress types
  FeatureStatusValue,
  FeatureStatus,
  ProgressState,
  // Harness types
  McpServerConfig,
  AgentHarness,
  // Security types
  SecurityHookInput,
  SecurityHookResult,
  SecurityHook,
  // Session types
  SessionStatus,
  SessionResult,
  ToolCall,
  AgentClientOptions,
  // Build types
  BuildStatus,
  BuildLog,
  Build,
} from './types.js';

// Security
export {
  DEFAULT_ALLOWED_COMMANDS,
  COMMANDS_NEEDING_EXTRA_VALIDATION,
  splitCommandSegments,
  tokenizeCommand,
  extractCommands,
  validatePkillCommand,
  validateChmodCommand,
  validateInitScript,
  createBashSecurityHook,
  bashSecurityHook,
} from './security.js';

// Progress
export {
  type FeatureListItem,
  parseFeatureList,
  countPassingTests,
  countPassingTestsFromSandbox,
  featureListToProgressState,
  getProgressFromFeatureList,
  getProgressFromSandbox,
  formatSessionHeader,
  formatProgressSummary,
  formatProgressSummaryFromState,
  isComplete,
  isCompleteFromSandbox,
} from './progress.js';

// Prompts
export {
  INITIALIZER_PROMPT,
  CODING_PROMPT,
  DISCOVERY_SYSTEM_PROMPT,
  EXPANSION_SYSTEM_PROMPT,
  TIER_DETAILS,
  getInitializerPrompt,
  getLegacyInitializerPrompt,
  getCodingPrompt,
  getPromptForSession,
  createPromptProvider,
  type PromptOverrides,
  type ComplexityTier,
  type TierDetails,
} from './prompts.js';

// Agent
export {
  DEFAULT_MODEL,
  AUTO_CONTINUE_DELAY_MS,
  DEFAULT_MAX_TURNS,
  runAgentSession,
  runAutonomousAgent,
  runAgentInSandbox,
  type AgentSessionConfig,
  type RunAgentOptions,
  type SandboxAgentOptions,
} from './agent.js';

// Harnesses
export { codingHarness, CODING_ALLOWED_COMMANDS } from './harnesses/coding.js';
export {
  createCustomHarness,
  extendCodingHarness,
  type CustomHarnessOptions,
} from './harnesses/custom.js';

// Events
export type {
  BaseEvent,
  BuildPhase,
  FeatureStatus as EventFeatureStatus,
  PhaseEvent,
  FeatureStartEvent,
  FeatureProgressEvent,
  FeatureEndEvent,
  ThinkingEvent,
  ActivityType,
  ActivityEvent,
  ToolStartEvent,
  ToolEndEvent,
  FileEvent,
  CommandEvent,
  TestRunEvent,
  ErrorEvent,
  ProgressEvent,
  FeatureListItem as EventFeatureListItem,
  FeatureListEvent,
  AgentEvent,
  EventType,
  EventCategory,
} from './events.js';

export {
  generateEventId,
  createEvent,
  inferLanguage,
  formatDuration,
  getActivityLabel,
  getEventCategory,
} from './events.js';
