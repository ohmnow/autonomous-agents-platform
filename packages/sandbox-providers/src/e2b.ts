/**
 * E2B Sandbox Provider
 * ====================
 *
 * Implementation of the sandbox provider interface for E2B (https://e2b.dev).
 * E2B provides fast, secure cloud sandboxes for code execution.
 */

import { Sandbox as E2BSandboxSDK } from '@e2b/code-interpreter';
import type {
  Sandbox,
  SandboxConfig,
  AgentOutput,
  ExecResult,
  SandboxProvider,
} from './interface.js';

/**
 * Wrapper class for E2B sandbox that implements our Sandbox interface.
 */
class E2BSandboxWrapper implements Sandbox {
  private outputListeners: Set<(data: AgentOutput) => void> = new Set();
  public status: 'creating' | 'running' | 'stopped' | 'error' = 'running';

  constructor(private sandbox: E2BSandboxSDK) {}

  get id(): string {
    return this.sandbox.sandboxId;
  }

  /**
   * Execute a command in the sandbox.
   */
  async exec(command: string): Promise<ExecResult> {
    try {
      const result = await this.sandbox.commands.run(command);
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      };
    } catch (error) {
      return {
        stdout: '',
        stderr: String(error),
        exitCode: 1,
      };
    }
  }

  /**
   * Execute a command and stream the output.
   */
  async *execStream(command: string): AsyncIterable<string> {
    try {
      const process = await this.sandbox.commands.run(command, {
        onStdout: (output) => {
          this.emitOutput({
            type: 'text',
            content: output,
            timestamp: new Date(),
          });
        },
        onStderr: (output) => {
          this.emitOutput({
            type: 'text',
            content: output,
            timestamp: new Date(),
            metadata: { stream: 'stderr' },
          });
        },
      });

      // Yield the combined output
      if (process.stdout) {
        yield process.stdout;
      }
      if (process.stderr) {
        yield process.stderr;
      }
    } catch (error) {
      yield `Error: ${String(error)}`;
    }
  }

  /**
   * Write a file to the sandbox.
   */
  async writeFile(path: string, content: string): Promise<void> {
    await this.sandbox.files.write(path, content);
  }

  /**
   * Read a file from the sandbox.
   */
  async readFile(path: string): Promise<string> {
    const content = await this.sandbox.files.read(path);
    // E2B returns ArrayBuffer for binary files, string for text
    if (typeof content === 'string') {
      return content;
    }
    return new TextDecoder().decode(content as ArrayBuffer);
  }

  /**
   * Download a directory as a buffer.
   * Excludes node_modules and other large directories to keep archive size manageable.
   */
  async downloadDir(path: string): Promise<Buffer> {
    // E2B doesn't have a built-in downloadDir, so we create a tar archive
    // Exclude node_modules and other large/irrelevant directories to keep size manageable
    const tarCommand = `tar -cf /tmp/download.tar -C "${path}" --exclude='node_modules' --exclude='.git' --exclude='.next' --exclude='dist' --exclude='build' --exclude='.cache' --exclude='coverage' .`;
    const result = await this.exec(tarCommand);
    
    if (result.exitCode !== 0) {
      throw new Error(`Failed to create tar archive: ${result.stderr}`);
    }

    // Use format: 'bytes' for binary file reading to avoid encoding issues
    // This returns Uint8Array which we convert to Buffer
    const content = await this.sandbox.files.read('/tmp/download.tar', { format: 'bytes' }) as Uint8Array;
    
    return Buffer.from(content);
  }

  /**
   * Stop and destroy the sandbox.
   */
  async destroy(): Promise<void> {
    this.status = 'stopped';
    await this.sandbox.kill();
    this.outputListeners.clear();
  }

  /**
   * Subscribe to agent output.
   */
  onOutput(callback: (data: AgentOutput) => void): () => void {
    this.outputListeners.add(callback);
    return () => {
      this.outputListeners.delete(callback);
    };
  }

  /**
   * Emit output to all listeners.
   */
  private emitOutput(data: AgentOutput): void {
    for (const listener of this.outputListeners) {
      listener(data);
    }
  }
}

/**
 * E2B sandbox provider implementation.
 */
export class E2BProvider implements SandboxProvider {
  name = 'e2b';

  // Track active sandboxes (E2B doesn't have a list API)
  private activeSandboxes: Map<string, E2BSandboxWrapper> = new Map();

  /**
   * Create a new E2B sandbox.
   */
  async create(config: SandboxConfig): Promise<Sandbox> {
    // E2B SDK API: create(template: string, opts?: SandboxOpts)
    const template = config.template ?? 'base';
    const sandbox = await E2BSandboxSDK.create(template, {
      envs: config.env,
      timeoutMs: config.timeout ? config.timeout * 1000 : 300_000,
    });

    const wrapper = new E2BSandboxWrapper(sandbox);
    this.activeSandboxes.set(wrapper.id, wrapper);

    return wrapper;
  }

  /**
   * Get an existing sandbox by ID.
   */
  async get(id: string): Promise<Sandbox | null> {
    // Check local cache first
    const cached = this.activeSandboxes.get(id);
    if (cached) {
      return cached;
    }

    // Try to reconnect to existing sandbox
    try {
      const sandbox = await E2BSandboxSDK.connect(id);
      const wrapper = new E2BSandboxWrapper(sandbox);
      this.activeSandboxes.set(id, wrapper);
      return wrapper;
    } catch {
      return null;
    }
  }

  /**
   * List all active sandboxes.
   * Note: E2B doesn't have a list API, so we only return locally tracked sandboxes.
   */
  async list(): Promise<Sandbox[]> {
    return Array.from(this.activeSandboxes.values());
  }

  /**
   * Destroy a sandbox by ID.
   */
  async destroy(id: string): Promise<void> {
    const sandbox = this.activeSandboxes.get(id);
    if (sandbox) {
      await sandbox.destroy();
      this.activeSandboxes.delete(id);
    }
  }
}

/**
 * Default E2B provider instance.
 */
export const e2bProvider = new E2BProvider();
