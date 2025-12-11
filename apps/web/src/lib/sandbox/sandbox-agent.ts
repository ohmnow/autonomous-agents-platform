/**
 * Sandbox Agent
 * 
 * Runs the Claude Agent SDK on the server and redirects tool executions
 * to the E2B sandbox. This provides real-time progress streaming to the UI.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Sandbox } from '@repo/sandbox-providers';
import { updateBuild } from '@repo/database';
import type { BuildStatus } from '@prisma/client';
import type { 
  AgentEvent, 
  ToolStartEvent, 
  ToolEndEvent, 
  FileEvent, 
  CommandEvent, 
  ThinkingEvent, 
  ErrorEvent, 
  ActivityEvent,
  PhaseEvent,
  ProgressEvent,
  FeatureListEvent,
  EventFeatureListItem,
} from '@repo/agent-core';
import { generateEventId, inferLanguage, parseFeatureList } from '@repo/agent-core';

// Types for Claude messages
interface TextBlock {
  type: 'text';
  text: string;
}

interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type ContentBlock = TextBlock | ToolUseBlock;

interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

// Tool definitions for the agent
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'bash',
    description: 'Execute a bash command in the sandbox. Use this for running shell commands, installing packages, running scripts, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file in the sandbox. Creates the file if it does not exist, overwrites if it does.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'The file path to write to',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file in the sandbox.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'The file path to read',
        },
      },
      required: ['path'],
    },
  },
];

interface AgentLogCallback {
  (level: string, message: string, metadata?: Record<string, unknown>): void;
}

interface AgentProgressCallback {
  (completed: number, total: number, currentFeature?: string): void;
}

// Use a looser type for the event callback to allow all event variants
type PartialAgentEvent = {
  id: string;
  type: string;
  timestamp: string;
  [key: string]: unknown;
};

interface AgentEventCallback {
  (event: PartialAgentEvent): void;
}

export interface SandboxAgentConfig {
  buildId: string;
  sandbox: Sandbox;
  appSpec: string;
  targetFeatureCount?: number;  // Dynamic feature count based on complexity tier
  onLog: AgentLogCallback;
  onProgress: AgentProgressCallback;
  onEvent?: AgentEventCallback;
}

/**
 * Execute a tool in the sandbox and return the result.
 * Emits structured events for tool execution and file operations.
 */
async function executeToolInSandbox(
  sandbox: Sandbox,
  toolName: string,
  toolInput: Record<string, unknown>,
  toolUseId: string,
  onLog: AgentLogCallback,
  onEvent?: AgentEventCallback
): Promise<{ output: string; isError: boolean }> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Emit tool start event
  onEvent?.({
    id: generateEventId(),
    type: 'tool_start',
    timestamp,
    toolName: toolName as 'bash' | 'write_file' | 'read_file' | 'str_replace_editor',
    toolUseId,
    input: toolInput,
    displayInput: JSON.stringify(toolInput).slice(0, 200),
  } as Omit<ToolStartEvent, 'buildId'>);

  try {
    switch (toolName) {
      case 'bash': {
        const command = toolInput.command as string;
        onLog('tool', `bash: ${command.slice(0, 200)}${command.length > 200 ? '...' : ''}`);
        
        const result = await sandbox.exec(command);
        const output = result.stdout + (result.stderr ? `\nSTDERR: ${result.stderr}` : '');
        const durationMs = Date.now() - startTime;
        const isError = result.exitCode !== 0;
        
        // Emit command event with details
        onEvent?.({
          id: generateEventId(),
          type: 'command',
          timestamp: new Date().toISOString(),
          command,
          exitCode: result.exitCode,
          stdout: result.stdout?.slice(0, 500),
          stderr: result.stderr?.slice(0, 500),
          durationMs,
        } as Omit<CommandEvent, 'buildId'>);
        
        // Emit tool end event
        onEvent?.({
          id: generateEventId(),
          type: 'tool_end',
          timestamp: new Date().toISOString(),
          toolUseId,
          success: !isError,
          output: output.slice(0, 500),
          displayOutput: output.length > 500 ? output.slice(0, 500) + '...' : output,
          durationMs,
          error: isError ? `Exit code: ${result.exitCode}` : undefined,
        } as Omit<ToolEndEvent, 'buildId'>);
        
        if (isError) {
          onLog('error', `Command exited with code ${result.exitCode}`);
          return { output: output || `Exit code: ${result.exitCode}`, isError: true };
        }
        
        onLog('info', `[Done] ${output.slice(0, 100)}${output.length > 100 ? '...' : ''}`);
        return { output, isError: false };
      }

      case 'write_file': {
        const path = toolInput.path as string;
        const content = toolInput.content as string;
        const durationMs = Date.now() - startTime;
        onLog('tool', `write_file: ${path} (${content.length} bytes)`);
        
        // Check if file exists first to determine if created or modified
        let isNewFile = true;
        try {
          await sandbox.readFile(path);
          isNewFile = false;
        } catch {
          isNewFile = true;
        }
        
        await sandbox.writeFile(path, content);
        
        // Emit file event
        onEvent?.({
          id: generateEventId(),
          type: isNewFile ? 'file_created' : 'file_modified',
          timestamp: new Date().toISOString(),
          path,
          size: content.length,
          language: inferLanguage(path),
          linesAdded: content.split('\n').length,
        } as Omit<FileEvent, 'buildId'>);
        
        // If this is feature_list.json, emit a feature_list event with parsed content
        if (path.endsWith('feature_list.json')) {
          try {
            const features = parseFeatureList(content) as EventFeatureListItem[];
            if (features.length > 0) {
              const completed = features.filter(f => f.passes).length;
              onEvent?.({
                id: generateEventId(),
                type: 'feature_list',
                timestamp: new Date().toISOString(),
                features,
                total: features.length,
                completed,
              } as Omit<FeatureListEvent, 'buildId'>);
              onLog('info', `Feature list created: ${features.length} features (${completed} passing)`);
            }
          } catch (parseError) {
            // Silently ignore parse errors - the file might be partial
            console.error('Failed to parse feature_list.json:', parseError);
          }
        }
        
        // Emit tool end event
        onEvent?.({
          id: generateEventId(),
          type: 'tool_end',
          timestamp: new Date().toISOString(),
          toolUseId,
          success: true,
          output: `Successfully wrote to ${path}`,
          displayOutput: `Wrote ${path} (${content.length} bytes, ${content.split('\n').length} lines)`,
          durationMs,
        } as Omit<ToolEndEvent, 'buildId'>);
        
        onLog('info', `[Done] Wrote ${path}`);
        return { output: `Successfully wrote to ${path}`, isError: false };
      }

      case 'read_file': {
        const path = toolInput.path as string;
        const durationMs = Date.now() - startTime;
        onLog('tool', `read_file: ${path}`);
        
        const content = await sandbox.readFile(path);
        
        // Emit tool end event
        onEvent?.({
          id: generateEventId(),
          type: 'tool_end',
          timestamp: new Date().toISOString(),
          toolUseId,
          success: true,
          output: content.slice(0, 500),
          displayOutput: `Read ${path} (${content.length} bytes)`,
          durationMs,
        } as Omit<ToolEndEvent, 'buildId'>);
        
        onLog('info', `[Done] Read ${path} (${content.length} bytes)`);
        return { output: content, isError: false };
      }

      default: {
        const durationMs = Date.now() - startTime;
        
        // Emit tool end event for unknown tool
        onEvent?.({
          id: generateEventId(),
          type: 'tool_end',
          timestamp: new Date().toISOString(),
          toolUseId,
          success: false,
          error: `Unknown tool: ${toolName}`,
          durationMs,
        } as Omit<ToolEndEvent, 'buildId'>);
        
        return { output: `Unknown tool: ${toolName}`, isError: true };
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const durationMs = Date.now() - startTime;
    
    // Emit error event
    onEvent?.({
      id: generateEventId(),
      type: 'error',
      timestamp: new Date().toISOString(),
      severity: 'error',
      message: `Tool error: ${errorMsg}`,
      details: `Tool: ${toolName}`,
      recoverable: true,
    } as Omit<ErrorEvent, 'buildId'>);
    
    // Emit tool end event
    onEvent?.({
      id: generateEventId(),
      type: 'tool_end',
      timestamp: new Date().toISOString(),
      toolUseId,
      success: false,
      error: errorMsg,
      durationMs,
    } as Omit<ToolEndEvent, 'buildId'>);
    
    onLog('error', `Tool error: ${errorMsg}`);
    return { output: errorMsg, isError: true };
  }
}

/**
 * Parse feature_list.json and return progress.
 */
async function getProgress(sandbox: Sandbox): Promise<{ completed: number; total: number; features: Array<{ description: string; passes: boolean }> }> {
  try {
    const content = await sandbox.readFile('/home/user/feature_list.json');
    const features = JSON.parse(content) as Array<{ description: string; passes: boolean }>;
    const completed = features.filter(f => f.passes).length;
    return { completed, total: features.length, features };
  } catch {
    return { completed: 0, total: 0, features: [] };
  }
}

/**
 * Run the autonomous agent with sandbox tool execution.
 * This is the main entry point for real builds.
 */
export async function runSandboxAgent(config: SandboxAgentConfig): Promise<void> {
  const {
    buildId,
    sandbox,
    appSpec,
    targetFeatureCount = 80,
    onLog,
    onProgress,
    onEvent,
  } = config;

  // Emit phase event - initializing
  onEvent?.({
    id: generateEventId(),
    type: 'phase',
    timestamp: new Date().toISOString(),
    phase: 'initializing',
    message: 'Setting up sandbox environment',
  });

  const anthropic = new Anthropic();

  // Write app_spec.txt to sandbox
  onLog('info', 'Writing app specification to sandbox...');
  await sandbox.writeFile('/home/user/app_spec.txt', appSpec);
  onLog('tool', 'write_file: /home/user/app_spec.txt');

  // Calculate the minimum number of complex tests (15% of total)
  const minComplexTests = Math.floor(targetFeatureCount * 0.15);

  // System prompt for the agent with dynamic feature count
  const systemPrompt = `You are an expert full-stack developer building a production-quality application.

Your working directory is /home/user. You have access to:
- bash: Execute shell commands
- write_file: Create/update files
- read_file: Read file contents

FIRST: Read app_spec.txt to understand what you're building.
THEN: Create feature_list.json with approximately ${targetFeatureCount} test cases covering all features.
FINALLY: Implement each feature one by one, marking them as passing in feature_list.json.

## Feature List Requirements:
- Target approximately ${targetFeatureCount} features (±10% is acceptable)
- Both "functional" and "style" categories
- Mix of narrow tests (2-5 steps) and comprehensive tests (10+ steps)
- At least ${minComplexTests} tests MUST have 10+ steps each
- Order features by priority: fundamental features first

Work methodically through each feature. After implementing a feature:
1. Verify it works (check file exists, validate content, run tests if applicable)
2. Update feature_list.json to mark "passes": true
3. Move to the next feature

## Testing Approach:
- For static HTML/CSS/JS: Verify files exist and have correct content. No dev server needed.
- For Node.js apps: Use npm scripts (npm run build, npm run test) to verify.
- Avoid background processes (&) - they don't work reliably in this environment.
- Keep verification simple and direct.

The feature_list.json format:
[
  { "category": "functional", "description": "Feature description", "steps": ["Step 1", "Step 2"], "passes": false },
  ...
]`;

  // Check if this is a continuation
  let isFirstRun = true;
  try {
    await sandbox.readFile('/home/user/feature_list.json');
    isFirstRun = false;
    onLog('info', 'Found existing feature_list.json - continuing...');
    
    const progress = await getProgress(sandbox);
    onProgress(progress.completed, progress.total);
  } catch {
    onLog('info', 'Starting fresh project...');
  }

  // Determine initial prompt
  const initialPrompt = isFirstRun
    ? `Read app_spec.txt and create a comprehensive feature_list.json with all the features that need to be implemented. Then begin implementing the first feature.`
    : `Check the current progress in feature_list.json and continue implementing the next feature that has "passes": false.`;

  // Conversation history
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: initialPrompt },
  ];

  // Emit phase event - implementing
  onEvent?.({
    id: generateEventId(),
    type: 'phase',
    timestamp: new Date().toISOString(),
    phase: 'implementing',
    message: 'Starting feature implementation',
  });

  // Main agent loop - runs until all features complete or agent signals done
  // No artificial iteration limit - the agent works autonomously until the task is finished
  // See: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
  let iteration = 0;
  
  while (true) {
    iteration++;
    onLog('info', `--- Iteration ${iteration} ---`);
    
    // Emit activity event
    onEvent?.({
      id: generateEventId(),
      type: 'activity',
      timestamp: new Date().toISOString(),
      activity: 'planning',
      description: `Iteration ${iteration}`,
    } as Omit<ActivityEvent, 'buildId'>);

    try {
      // Call Claude
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      });

      // Process the response
      const assistantContent: ContentBlock[] = [];
      const toolResults: ToolResultBlock[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          onLog('info', block.text.slice(0, 500) + (block.text.length > 500 ? '...' : ''));
          assistantContent.push({ type: 'text', text: block.text });
          
          // Emit thinking event for agent's text output
          onEvent?.({
            id: generateEventId(),
            type: 'thinking',
            timestamp: new Date().toISOString(),
            content: block.text.slice(0, 1000),
            phase: 'planning',
          } as Omit<ThinkingEvent, 'buildId'>);
        } else if (block.type === 'tool_use') {
          assistantContent.push({
            type: 'tool_use',
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });

          // Execute the tool with event emission
          const result = await executeToolInSandbox(
            sandbox,
            block.name,
            block.input as Record<string, unknown>,
            block.id,
            onLog,
            onEvent
          );

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result.output.slice(0, 10000), // Limit output size
            is_error: result.isError,
          });
        }
      }

      // Add assistant message to history
      messages.push({
        role: 'assistant',
        content: assistantContent as Anthropic.ContentBlockParam[],
      });

      // If there were tool uses, add results and continue
      if (toolResults.length > 0) {
        messages.push({
          role: 'user',
          content: toolResults as Anthropic.ToolResultBlockParam[],
        });

        // Check progress after tool execution
        const progress = await getProgress(sandbox);
        onProgress(progress.completed, progress.total);
        
        // Emit progress event
        onEvent?.({
          id: generateEventId(),
          type: 'progress',
          timestamp: new Date().toISOString(),
          completed: progress.completed,
          total: progress.total,
          percentComplete: progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0,
        });

        // Update database
        try {
          await updateBuild(buildId, {
            progress: {
              completed: progress.completed,
              total: progress.total,
            },
          });
        } catch (e) {
          console.error('Failed to update build progress:', e);
        }

        // Check if all features are done
        if (progress.total > 0 && progress.completed === progress.total) {
          onLog('info', '🎉 All features complete!');
          
          // Emit completion phase event
          onEvent?.({
            id: generateEventId(),
            type: 'phase',
            timestamp: new Date().toISOString(),
            phase: 'completed',
            message: 'All features implemented successfully',
          });
          break;
        }
      }

      // Check stop reason
      if (response.stop_reason === 'end_turn' && toolResults.length === 0) {
        onLog('info', 'Agent finished turn without tool use');
        
        // Prompt to continue
        messages.push({
          role: 'user',
          content: 'Continue implementing the remaining features. Check feature_list.json for what needs to be done.',
        });
      }

    } catch (error) {
      onLog('error', `Agent error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Final progress check
  const finalProgress = await getProgress(sandbox);
  onProgress(finalProgress.completed, finalProgress.total);
  
  onLog('info', `Build complete: ${finalProgress.completed}/${finalProgress.total} features passing`);
}
