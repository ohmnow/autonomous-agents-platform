/**
 * Agent Core Types
 * =================
 *
 * Shared type definitions for the autonomous agents platform.
 */

// ============================================================================
// Sandbox Types
// ============================================================================

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface AgentOutput {
  type: 'text' | 'tool_use' | 'tool_result' | 'error';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Sandbox {
  id: string;
  status: 'creating' | 'running' | 'stopped' | 'error';

  /** Execute a command in the sandbox */
  exec(command: string): Promise<ExecResult>;

  /** Stream command output */
  execStream(command: string): AsyncIterable<string>;

  /** Write a file to the sandbox */
  writeFile(path: string, content: string): Promise<void>;

  /** Read a file from the sandbox */
  readFile(path: string): Promise<string>;

  /** Download directory as buffer */
  downloadDir(path: string): Promise<Buffer>;

  /** Stop and destroy the sandbox */
  destroy(): Promise<void>;

  /** Subscribe to agent output */
  onOutput(callback: (data: AgentOutput) => void): () => void;
}

export interface SandboxConfig {
  /** Provider-specific template/image */
  template?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Resource limits */
  resources?: {
    cpu?: number;
    memory?: string;
    disk?: string;
  };
  /** Timeout in seconds */
  timeout?: number;
}

// ============================================================================
// Progress Types
// ============================================================================

export type FeatureStatusValue = 'pending' | 'in_progress' | 'passed' | 'failed';

export interface FeatureStatus {
  id: string;
  category: 'functional' | 'style';
  description: string;
  steps: string[];
  status: FeatureStatusValue;
}

export interface ProgressState {
  total: number;
  completed: number;
  features: FeatureStatus[];
}

// ============================================================================
// Harness Types
// ============================================================================

export interface McpServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface AgentHarness {
  id: string;
  name: string;
  description: string;

  /** System prompt for the initializer agent */
  initializerPrompt: string;

  /** System prompt for continuation agents */
  continuationPrompt: string;

  /** Allowed bash commands (security) */
  allowedCommands: string[];

  /** MCP servers to enable */
  mcpServers?: McpServerConfig[];

  /** How to determine if the task is complete */
  completionCheck: (sandbox: Sandbox) => Promise<boolean>;

  /** How to track progress */
  progressTracker: (sandbox: Sandbox) => Promise<ProgressState>;
}

// ============================================================================
// Security Types
// ============================================================================

export interface SecurityHookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface SecurityHookResult {
  decision?: 'block';
  reason?: string;
}

export type SecurityHook = (
  input: SecurityHookInput,
  toolUseId?: string,
  context?: unknown
) => Promise<SecurityHookResult>;

// ============================================================================
// Agent Session Types
// ============================================================================

export type SessionStatus = 'continue' | 'complete' | 'error';

export interface SessionResult {
  status: SessionStatus;
  responseText: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
  isError?: boolean;
}

export interface AgentClientOptions {
  model: string;
  projectDir: string;
  allowedCommands: string[];
  mcpServers?: McpServerConfig[];
  maxTurns?: number;
}

// ============================================================================
// Build Types (for web app integration)
// ============================================================================

export type BuildStatus =
  | 'pending'
  | 'initializing'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface BuildLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'tool';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface Build {
  id: string;
  projectId?: string;
  userId: string;
  appSpec: string;
  harnessId: string;
  sandboxId?: string;
  sandboxProvider: string;
  status: BuildStatus;
  progress?: ProgressState;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  outputUrl?: string;
}
