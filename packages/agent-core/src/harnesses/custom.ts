/**
 * Custom Harness Builder
 * ======================
 *
 * Factory for creating custom agent harnesses with specific configurations.
 */

import type { AgentHarness, McpServerConfig, ProgressState, Sandbox } from '../types.js';
import { codingHarness, CODING_ALLOWED_COMMANDS } from './coding.js';

/**
 * Options for creating a custom harness.
 */
export interface CustomHarnessOptions {
  id: string;
  name: string;
  description: string;

  /** System prompt for the initializer agent */
  initializerPrompt: string;

  /** System prompt for continuation agents */
  continuationPrompt: string;

  /** Allowed bash commands (defaults to coding harness commands) */
  allowedCommands?: string[];

  /** MCP servers to enable */
  mcpServers?: McpServerConfig[];

  /**
   * Custom completion check function.
   * Returns true when the task is complete.
   */
  completionCheck?: (sandbox: Sandbox) => Promise<boolean>;

  /**
   * Custom progress tracker function.
   * Returns the current progress state.
   */
  progressTracker?: (sandbox: Sandbox) => Promise<ProgressState>;
}

/**
 * Default completion check - looks for a completion marker file.
 */
async function defaultCompletionCheck(sandbox: Sandbox): Promise<boolean> {
  try {
    const content = await sandbox.readFile('.task_complete');
    return content.trim().toLowerCase() === 'true';
  } catch {
    return false;
  }
}

/**
 * Default progress tracker - returns a simple state.
 */
async function defaultProgressTracker(_sandbox: Sandbox): Promise<ProgressState> {
  return {
    total: 0,
    completed: 0,
    features: [],
  };
}

/**
 * Create a custom agent harness.
 *
 * @param options - Harness configuration options
 * @returns A configured AgentHarness
 *
 * @example
 * ```typescript
 * const researchHarness = createCustomHarness({
 *   id: 'research',
 *   name: 'Deep Research',
 *   description: 'Conduct multi-hour research on a topic',
 *   initializerPrompt: 'You are a research agent...',
 *   continuationPrompt: 'Continue your research...',
 *   allowedCommands: ['curl', 'wget', 'cat', 'grep'],
 *   mcpServers: [
 *     { name: 'web-search', command: 'npx', args: ['web-search-mcp'] }
 *   ],
 * });
 * ```
 */
export function createCustomHarness(options: CustomHarnessOptions): AgentHarness {
  const {
    id,
    name,
    description,
    initializerPrompt,
    continuationPrompt,
    allowedCommands = CODING_ALLOWED_COMMANDS,
    mcpServers = [],
    completionCheck = defaultCompletionCheck,
    progressTracker = defaultProgressTracker,
  } = options;

  return {
    id,
    name,
    description,
    initializerPrompt,
    continuationPrompt,
    allowedCommands,
    mcpServers,
    completionCheck,
    progressTracker,
  };
}

/**
 * Extend the default coding harness with custom modifications.
 *
 * @param overrides - Partial harness options to override defaults
 * @returns A new harness based on the coding harness
 *
 * @example
 * ```typescript
 * const pythonHarness = extendCodingHarness({
 *   id: 'python-coding',
 *   name: 'Python Development',
 *   allowedCommands: [...CODING_ALLOWED_COMMANDS, 'python', 'pip', 'pytest'],
 * });
 * ```
 */
export function extendCodingHarness(
  overrides: Partial<CustomHarnessOptions>
): AgentHarness {
  return {
    ...codingHarness,
    ...overrides,
    allowedCommands: overrides.allowedCommands ?? codingHarness.allowedCommands,
    mcpServers: overrides.mcpServers ?? codingHarness.mcpServers,
    completionCheck: overrides.completionCheck ?? codingHarness.completionCheck,
    progressTracker: overrides.progressTracker ?? codingHarness.progressTracker,
  };
}
