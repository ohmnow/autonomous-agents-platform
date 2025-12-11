/**
 * Agent Session Logic
 * ===================
 *
 * Core agent interaction functions for running autonomous coding sessions.
 * Ported from Python implementation to use Claude Agent SDK for TypeScript.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import type {
  SessionResult,
  SessionStatus,
  ToolCall,
  ProgressState,
  AgentHarness,
  Sandbox,
} from './types.js';
import { createBashSecurityHook, DEFAULT_ALLOWED_COMMANDS } from './security.js';
import { formatProgressSummary, formatSessionHeader } from './progress.js';
import { getPromptForSession } from './prompts.js';

// ============================================================================
// Configuration
// ============================================================================

export const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
export const AUTO_CONTINUE_DELAY_MS = 3000;
export const DEFAULT_MAX_TURNS = 1000;

// ============================================================================
// Agent Session Types
// ============================================================================

export interface AgentSessionConfig {
  model?: string;
  allowedCommands?: Set<string>;
  mcpServers?: Record<string, McpServerConfig>;
  maxTurns?: number;
  workingDirectory: string;
  systemPrompt?: string;
}

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface RunAgentOptions {
  projectDir: string;
  model?: string;
  maxIterations?: number;
  harness?: AgentHarness;
  onProgress?: (state: ProgressState) => void;
  onLog?: (level: string, message: string, metadata?: Record<string, unknown>) => void;
}

// ============================================================================
// Message Type Helpers
// ============================================================================

interface AssistantMessage {
  type: 'assistant';
  content: string | Array<{ type: string; text?: string; name?: string; input?: unknown }>;
}

interface SystemMessage {
  type: 'system';
  subtype?: string;
  session_id?: string;
}

interface ResultMessage {
  type: 'result';
  tool_use_id?: string;
  tool_name?: string;
  output?: string;
  is_error?: boolean;
}

type AgentMessage = AssistantMessage | SystemMessage | ResultMessage | { type: string; [key: string]: unknown };

// ============================================================================
// Agent Session Functions
// ============================================================================

/**
 * Run a single agent session using Claude Agent SDK.
 *
 * @param config - Session configuration
 * @param message - The prompt to send
 * @returns Session result with status and response
 */
export async function runAgentSession(
  config: AgentSessionConfig,
  message: string
): Promise<SessionResult> {
  const {
    model = DEFAULT_MODEL,
    allowedCommands = DEFAULT_ALLOWED_COMMANDS,
    mcpServers = {},
    workingDirectory,
    systemPrompt = 'You are an expert full-stack developer building a production-quality web application.',
  } = config;

  const toolCalls: ToolCall[] = [];
  let responseText = '';

  // Create bash security hook with custom allowed commands
  const bashSecurityHook = createBashSecurityHook(allowedCommands);

  try {
    const response = query({
      prompt: message,
      options: {
        model,
        cwd: workingDirectory,
        systemPrompt,
        permissionMode: 'default',
        mcpServers: Object.fromEntries(
          Object.entries(mcpServers).map(([name, serverConfig]) => [
            name,
            {
              command: serverConfig.command,
              args: serverConfig.args,
              env: serverConfig.env,
            },
          ])
        ),
        // Apply security hook for bash commands
        canUseTool: async (toolName: string, input: Record<string, unknown>) => {
          // Only apply security to Bash tool
          if (toolName === 'Bash') {
            const result = await bashSecurityHook({
              tool_name: toolName,
              tool_input: input,
            });

            if (result.decision === 'block') {
              return {
                behavior: 'deny' as const,
                message: result.reason || 'Command blocked by security policy',
              } as const;
            }
          }

          // Return allow with the required updatedInput field
          return { 
            behavior: 'allow' as const,
            updatedInput: input,
          } as const;
        },
      },
    });

    // Process streaming response
    for await (const msg of response) {
      const message = msg as AgentMessage;
      
      if (message.type === 'assistant') {
        const assistantMsg = message as AssistantMessage;
        // Handle assistant message
        if (typeof assistantMsg.content === 'string') {
          responseText += assistantMsg.content;
          process.stdout.write(assistantMsg.content);
        } else if (Array.isArray(assistantMsg.content)) {
          for (const block of assistantMsg.content) {
            if (block.type === 'text' && block.text) {
              responseText += block.text;
              process.stdout.write(block.text);
            } else if (block.type === 'tool_use' && block.name) {
              console.log(`\n[Tool: ${block.name}]`);
              const inputStr = JSON.stringify(block.input);
              if (inputStr.length > 200) {
                console.log(`   Input: ${inputStr.slice(0, 200)}...`);
              } else {
                console.log(`   Input: ${inputStr}`);
              }
              
              // Track tool calls
              toolCalls.push({
                id: `tool-${toolCalls.length}`,
                name: block.name,
                input: block.input as Record<string, unknown>,
              });
            }
          }
        }
      } else if (message.type === 'result') {
        // Handle tool results
        const resultMsg = message as ResultMessage;
        const output = resultMsg.output || '';
        
        if (output.toLowerCase().includes('blocked')) {
          console.log(`   [BLOCKED] ${output}`);
        } else if (resultMsg.is_error) {
          const errorStr = String(output).slice(0, 500);
          console.log(`   [Error] ${errorStr}`);
        } else {
          console.log('   [Done]');
        }
        
        // Update the last tool call with result
        if (toolCalls.length > 0) {
          const lastCall = toolCalls[toolCalls.length - 1];
          lastCall.result = output;
          lastCall.isError = resultMsg.is_error;
        }
      } else if (message.type === 'system') {
        const sysMsg = message as SystemMessage;
        if (sysMsg.subtype === 'init' && sysMsg.session_id) {
          console.log(`Session started: ${sysMsg.session_id}`);
        }
      }
    }

    console.log('\n' + '-'.repeat(70) + '\n');

    return {
      status: 'continue',
      responseText,
      toolCalls,
    };
  } catch (error) {
    console.error(`Error during agent session: ${error}`);
    return {
      status: 'error',
      responseText: String(error),
      toolCalls,
    };
  }
}

/**
 * Run the autonomous agent loop.
 *
 * @param options - Agent run options
 */
export async function runAutonomousAgent(options: RunAgentOptions): Promise<void> {
  const {
    projectDir,
    model = DEFAULT_MODEL,
    maxIterations,
    harness,
    onProgress,
    onLog,
  } = options;

  const log = (level: string, message: string, metadata?: Record<string, unknown>) => {
    onLog?.(level, message, metadata);
    console.log(`[${level.toUpperCase()}] ${message}`);
  };

  console.log('\n' + '='.repeat(70));
  console.log('  AUTONOMOUS CODING AGENT');
  console.log('='.repeat(70));
  console.log(`\nProject directory: ${projectDir}`);
  console.log(`Model: ${model}`);
  if (maxIterations) {
    console.log(`Max iterations: ${maxIterations}`);
  } else {
    console.log('Max iterations: Unlimited (will run until completion)');
  }
  console.log();

  // Determine if this is a first run by checking for feature_list.json
  // For sandbox-based execution, we check via the sandbox
  let isFirstRun = true; // Will be determined by harness or file check

  // Main loop
  let iteration = 0;

  while (true) {
    iteration++;

    // Check max iterations
    if (maxIterations && iteration > maxIterations) {
      log('info', `Reached max iterations (${maxIterations})`);
      log('info', 'To continue, run again without --max-iterations');
      break;
    }

    // Print session header
    console.log(formatSessionHeader(iteration, isFirstRun));

    // Get the appropriate prompt
    const prompt = harness
      ? isFirstRun
        ? harness.initializerPrompt
        : harness.continuationPrompt
      : getPromptForSession(isFirstRun);

    // Configure session
    const sessionConfig: AgentSessionConfig = {
      model,
      workingDirectory: projectDir,
      allowedCommands: harness
        ? new Set(harness.allowedCommands)
        : DEFAULT_ALLOWED_COMMANDS,
      mcpServers: harness?.mcpServers
        ? Object.fromEntries(
            harness.mcpServers.map((server) => [
              server.name,
              {
                command: server.command,
                args: server.args,
                env: server.env,
              },
            ])
          )
        : {
            puppeteer: {
              command: 'npx',
              args: ['puppeteer-mcp-server', '--headless'],
            },
          },
    };

    // Run the session
    const result = await runAgentSession(sessionConfig, prompt);

    // Only use initializer once
    if (isFirstRun) {
      isFirstRun = false;
    }

    // Handle status
    if (result.status === 'continue') {
      log('info', `Agent will auto-continue in ${AUTO_CONTINUE_DELAY_MS / 1000}s...`);
      // Note: In sandbox mode, progress would be tracked via onProgress callback
      await sleep(AUTO_CONTINUE_DELAY_MS);
    } else if (result.status === 'error') {
      log('error', 'Session encountered an error');
      log('info', 'Will retry with a fresh session...');
      await sleep(AUTO_CONTINUE_DELAY_MS);
    } else if (result.status === 'complete') {
      log('info', 'Task completed successfully!');
      break;
    }

    // Small delay between sessions
    if (!maxIterations || iteration < maxIterations) {
      log('info', 'Preparing next session...');
      await sleep(1000);
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('  SESSION COMPLETE');
  console.log('='.repeat(70));
  console.log(`\nProject directory: ${projectDir}`);
  console.log('\nDone!');
}

// ============================================================================
// Utility Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Sandbox-Based Agent Execution
// ============================================================================

export interface SandboxAgentOptions {
  sandbox: Sandbox;
  appSpec: string;
  harness: AgentHarness;
  model?: string;
  maxIterations?: number;
  onProgress?: (state: ProgressState) => void;
  onLog?: (level: string, message: string, metadata?: Record<string, unknown>) => void;
}

/**
 * Run the autonomous agent in a sandbox environment.
 * This is the primary entry point for web-based execution.
 *
 * @param options - Sandbox agent options
 */
export async function runAgentInSandbox(options: SandboxAgentOptions): Promise<void> {
  const {
    sandbox,
    appSpec,
    harness,
    model = DEFAULT_MODEL,
    maxIterations,
    onProgress,
    onLog,
  } = options;

  const log = (level: string, message: string, metadata?: Record<string, unknown>) => {
    onLog?.(level, message, metadata);
  };

  log('info', 'Starting agent in sandbox', { sandboxId: sandbox.id });

  // Write app_spec.txt to sandbox
  await sandbox.writeFile('/workspace/app_spec.txt', appSpec);
  log('info', 'Wrote app_spec.txt to sandbox');

  // Check if feature_list.json exists (continuation vs fresh start)
  let isFirstRun = true;
  try {
    await sandbox.readFile('/workspace/feature_list.json');
    isFirstRun = false;
    log('info', 'Found existing feature_list.json - continuing existing project');
  } catch {
    log('info', 'No feature_list.json - starting fresh project');
  }

  // Main loop
  let iteration = 0;

  while (true) {
    iteration++;

    // Check max iterations
    if (maxIterations && iteration > maxIterations) {
      log('info', `Reached max iterations (${maxIterations})`);
      break;
    }

    // Get prompt
    const prompt = isFirstRun ? harness.initializerPrompt : harness.continuationPrompt;

    log('info', `Starting iteration ${iteration}`, {
      isFirstRun,
      iteration,
    });

    // Execute agent command in sandbox
    // Note: In a real implementation, this would run the Claude agent SDK
    // inside the sandbox environment using the sandbox.exec method
    const agentCommand = `ANTHROPIC_API_KEY="${process.env.ANTHROPIC_API_KEY}" npx @anthropic-ai/claude-agent-sdk query "${prompt.replace(/"/g, '\\"')}"`;

    try {
      // Stream the agent output
      for await (const output of sandbox.execStream(agentCommand)) {
        log('info', output);
      }
    } catch (error) {
      log('error', `Agent execution failed: ${error}`);
      await sleep(AUTO_CONTINUE_DELAY_MS);
      continue;
    }

    // Only use initializer once
    if (isFirstRun) {
      isFirstRun = false;
    }

    // Track progress
    const progress = await harness.progressTracker(sandbox);
    onProgress?.(progress);

    log('info', `Progress: ${progress.completed}/${progress.total} features passing`);

    // Check completion
    if (await harness.completionCheck(sandbox)) {
      log('info', 'All features passing - task complete!');
      break;
    }

    // Auto-continue
    log('info', `Auto-continuing in ${AUTO_CONTINUE_DELAY_MS / 1000}s...`);
    await sleep(AUTO_CONTINUE_DELAY_MS);
  }

  log('info', 'Agent execution complete', { iterations: iteration });
}
