/**
 * Security Hooks for Autonomous Coding Agent
 * ==========================================
 *
 * Pre-tool-use hooks that validate bash commands for security.
 * Uses an allowlist approach - only explicitly permitted commands can run.
 *
 * Ported from Python implementation.
 */

import type { SecurityHook, SecurityHookInput, SecurityHookResult } from './types.js';

// ============================================================================
// Default Allowed Commands
// ============================================================================

/**
 * Default allowed commands for development tasks.
 * Minimal set needed for the autonomous coding demo.
 */
export const DEFAULT_ALLOWED_COMMANDS = new Set([
  // File inspection
  'ls',
  'cat',
  'head',
  'tail',
  'wc',
  'grep',
  // File operations (agent uses SDK tools for most file ops, but cp/mkdir needed occasionally)
  'cp',
  'mkdir',
  'chmod', // For making scripts executable; validated separately
  // Directory
  'pwd',
  // Node.js development
  'npm',
  'node',
  // Version control
  'git',
  // Process management
  'ps',
  'lsof',
  'sleep',
  'pkill', // For killing dev servers; validated separately
  // Script execution
  'init.sh', // Init scripts; validated separately
]);

/**
 * Commands that need additional validation even when in the allowlist.
 */
export const COMMANDS_NEEDING_EXTRA_VALIDATION = new Set(['pkill', 'chmod', 'init.sh']);

// ============================================================================
// Command Parsing
// ============================================================================

/**
 * Split a compound command into individual command segments.
 * Handles command chaining (&&, ||, ;) but not pipes (those are single commands).
 */
export function splitCommandSegments(commandString: string): string[] {
  // Split on && and || while preserving the ability to handle each segment
  const segments = commandString.split(/\s*(?:&&|\|\|)\s*/);

  // Further split on semicolons
  const result: string[] = [];
  for (const segment of segments) {
    const subSegments = segment.split(/(?<!["'])\s*;\s*(?!["'])/);
    for (const sub of subSegments) {
      const trimmed = sub.trim();
      if (trimmed) {
        result.push(trimmed);
      }
    }
  }

  return result;
}

/**
 * Simple shell-like tokenization.
 * Handles quoted strings and basic escaping.
 */
export function tokenizeCommand(command: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && !inSingleQuote) {
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (char === ' ' && !inSingleQuote && !inDoubleQuote) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  // Return empty array if quotes are unclosed (fail-safe)
  if (inSingleQuote || inDoubleQuote) {
    return [];
  }

  return tokens;
}

/**
 * Extract command names from a shell command string.
 * Handles pipes, command chaining (&&, ||, ;), and subshells.
 * Returns the base command names (without paths).
 */
export function extractCommands(commandString: string): string[] {
  const commands: string[] = [];

  // Split on semicolons that aren't inside quotes (simple heuristic)
  const segments = commandString.split(/(?<!["'])\s*;\s*(?!["'])/);

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    const tokens = tokenizeCommand(trimmed);
    if (tokens.length === 0) {
      // Malformed command - return empty to trigger block (fail-safe)
      return [];
    }

    // Track when we expect a command vs arguments
    let expectCommand = true;

    for (const token of tokens) {
      // Shell operators indicate a new command follows
      if (['|', '||', '&&', '&'].includes(token)) {
        expectCommand = true;
        continue;
      }

      // Skip shell keywords that precede commands
      const shellKeywords = [
        'if',
        'then',
        'else',
        'elif',
        'fi',
        'for',
        'while',
        'until',
        'do',
        'done',
        'case',
        'esac',
        'in',
        '!',
        '{',
        '}',
      ];
      if (shellKeywords.includes(token)) {
        continue;
      }

      // Skip flags/options
      if (token.startsWith('-')) {
        continue;
      }

      // Skip variable assignments (VAR=value)
      if (token.includes('=') && !token.startsWith('=')) {
        continue;
      }

      if (expectCommand) {
        // Extract the base command name (handle paths like /usr/bin/python)
        const basename = token.split('/').pop() || token;
        commands.push(basename);
        expectCommand = false;
      }
    }
  }

  return commands;
}

// ============================================================================
// Validators for Specific Commands
// ============================================================================

/** Allowed process names for pkill */
const ALLOWED_PKILL_PROCESSES = new Set(['node', 'npm', 'npx', 'vite', 'next']);

/**
 * Validate pkill commands - only allow killing dev-related processes.
 */
export function validatePkillCommand(commandString: string): { allowed: boolean; reason: string } {
  const tokens = tokenizeCommand(commandString);

  if (tokens.length === 0) {
    return { allowed: false, reason: 'Could not parse pkill command' };
  }

  // Separate flags from arguments
  const args = tokens.slice(1).filter((token) => !token.startsWith('-'));

  if (args.length === 0) {
    return { allowed: false, reason: 'pkill requires a process name' };
  }

  // The target is typically the last non-flag argument
  let target = args[args.length - 1];

  // For -f flag (full command line match), extract the first word as process name
  // e.g., "pkill -f 'node server.js'" -> target is "node server.js", process is "node"
  if (target.includes(' ')) {
    target = target.split(' ')[0];
  }

  if (ALLOWED_PKILL_PROCESSES.has(target)) {
    return { allowed: true, reason: '' };
  }

  return {
    allowed: false,
    reason: `pkill only allowed for dev processes: ${[...ALLOWED_PKILL_PROCESSES].join(', ')}`,
  };
}

/**
 * Validate chmod commands - only allow making files executable with +x.
 */
export function validateChmodCommand(commandString: string): { allowed: boolean; reason: string } {
  const tokens = tokenizeCommand(commandString);

  if (tokens.length === 0 || tokens[0] !== 'chmod') {
    return { allowed: false, reason: 'Not a chmod command' };
  }

  // Look for the mode argument
  let mode: string | null = null;
  const files: string[] = [];

  for (const token of tokens.slice(1)) {
    if (token.startsWith('-')) {
      // Skip flags like -R (we don't allow recursive chmod anyway)
      return { allowed: false, reason: 'chmod flags are not allowed' };
    } else if (mode === null) {
      mode = token;
    } else {
      files.push(token);
    }
  }

  if (mode === null) {
    return { allowed: false, reason: 'chmod requires a mode' };
  }

  if (files.length === 0) {
    return { allowed: false, reason: 'chmod requires at least one file' };
  }

  // Only allow +x variants (making files executable)
  // This matches: +x, u+x, g+x, o+x, a+x, ug+x, etc.
  if (!/^[ugoa]*\+x$/.test(mode)) {
    return { allowed: false, reason: `chmod only allowed with +x mode, got: ${mode}` };
  }

  return { allowed: true, reason: '' };
}

/**
 * Validate init.sh script execution - only allow ./init.sh.
 */
export function validateInitScript(commandString: string): { allowed: boolean; reason: string } {
  const tokens = tokenizeCommand(commandString);

  if (tokens.length === 0) {
    return { allowed: false, reason: 'Empty command' };
  }

  // The command should be exactly ./init.sh (possibly with arguments)
  const script = tokens[0];

  // Allow ./init.sh or paths ending in /init.sh
  if (script === './init.sh' || script.endsWith('/init.sh')) {
    return { allowed: true, reason: '' };
  }

  return { allowed: false, reason: `Only ./init.sh is allowed, got: ${script}` };
}

// ============================================================================
// Main Security Hook
// ============================================================================

/**
 * Find the specific command segment that contains the given command.
 */
function getCommandForValidation(cmd: string, segments: string[]): string {
  for (const segment of segments) {
    const segmentCommands = extractCommands(segment);
    if (segmentCommands.includes(cmd)) {
      return segment;
    }
  }
  return '';
}

/**
 * Create a bash security hook with a custom allowlist.
 *
 * @param allowedCommands - Set of allowed command names (defaults to DEFAULT_ALLOWED_COMMANDS)
 * @returns Security hook function
 */
export function createBashSecurityHook(
  allowedCommands: Set<string> = DEFAULT_ALLOWED_COMMANDS
): SecurityHook {
  return async (
    inputData: SecurityHookInput,
    _toolUseId?: string,
    _context?: unknown
  ): Promise<SecurityHookResult> => {
    if (inputData.tool_name !== 'Bash') {
      return {};
    }

    const toolInput = inputData.tool_input as { command?: string };
    const command = toolInput.command || '';

    if (!command) {
      return {};
    }

    // Extract all commands from the command string
    const commands = extractCommands(command);

    if (commands.length === 0) {
      // Could not parse - fail safe by blocking
      return {
        decision: 'block',
        reason: `Could not parse command for security validation: ${command}`,
      };
    }

    // Split into segments for per-command validation
    const segments = splitCommandSegments(command);

    // Check each command against the allowlist
    for (const cmd of commands) {
      if (!allowedCommands.has(cmd)) {
        return {
          decision: 'block',
          reason: `Command '${cmd}' is not in the allowed commands list`,
        };
      }

      // Additional validation for sensitive commands
      if (COMMANDS_NEEDING_EXTRA_VALIDATION.has(cmd)) {
        // Find the specific segment containing this command
        let cmdSegment = getCommandForValidation(cmd, segments);
        if (!cmdSegment) {
          cmdSegment = command; // Fallback to full command
        }

        if (cmd === 'pkill') {
          const { allowed, reason } = validatePkillCommand(cmdSegment);
          if (!allowed) {
            return { decision: 'block', reason };
          }
        } else if (cmd === 'chmod') {
          const { allowed, reason } = validateChmodCommand(cmdSegment);
          if (!allowed) {
            return { decision: 'block', reason };
          }
        } else if (cmd === 'init.sh') {
          const { allowed, reason } = validateInitScript(cmdSegment);
          if (!allowed) {
            return { decision: 'block', reason };
          }
        }
      }
    }

    return {};
  };
}

/**
 * Default bash security hook using the default allowed commands.
 */
export const bashSecurityHook = createBashSecurityHook();
