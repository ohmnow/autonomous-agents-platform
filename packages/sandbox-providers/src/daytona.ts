/**
 * Daytona Sandbox Provider
 * ========================
 *
 * Implementation of the sandbox provider interface for Daytona (https://www.daytona.io).
 * Daytona provides development environments with Git integration and persistence.
 *
 * Note: This is a stub implementation. Full implementation requires Daytona SDK.
 */

import type {
  Sandbox,
  SandboxConfig,
  AgentOutput,
  ExecResult,
  SandboxProvider,
} from './interface.js';

/**
 * Placeholder Daytona sandbox wrapper.
 * TODO: Implement using Daytona SDK when available.
 */
class DaytonaSandboxWrapper implements Sandbox {
  public status: 'creating' | 'running' | 'stopped' | 'error' = 'running';
  private outputListeners: Set<(data: AgentOutput) => void> = new Set();

  constructor(
    public readonly id: string,
    private config: SandboxConfig
  ) {}

  async exec(_command: string): Promise<ExecResult> {
    throw new Error('Daytona provider not yet implemented');
  }

  async *execStream(_command: string): AsyncIterable<string> {
    throw new Error('Daytona provider not yet implemented');
  }

  async writeFile(_path: string, _content: string): Promise<void> {
    throw new Error('Daytona provider not yet implemented');
  }

  async readFile(_path: string): Promise<string> {
    throw new Error('Daytona provider not yet implemented');
  }

  async downloadDir(_path: string): Promise<Buffer> {
    throw new Error('Daytona provider not yet implemented');
  }

  async destroy(): Promise<void> {
    this.status = 'stopped';
    this.outputListeners.clear();
  }

  onOutput(callback: (data: AgentOutput) => void): () => void {
    this.outputListeners.add(callback);
    return () => {
      this.outputListeners.delete(callback);
    };
  }

  getHost(_port: number): string {
    throw new Error('Daytona provider not yet implemented');
  }

  async isRunning(): Promise<boolean> {
    return this.status === 'running';
  }

  async setTimeout(_timeoutMs: number): Promise<void> {
    throw new Error('Daytona provider not yet implemented');
  }
}

/**
 * Daytona sandbox provider implementation.
 *
 * TODO: Full implementation requires:
 * 1. Daytona SDK/API client
 * 2. Workspace management
 * 3. Git integration
 * 4. SSH/exec capabilities
 */
export class DaytonaProvider implements SandboxProvider {
  name = 'daytona';

  private activeSandboxes: Map<string, DaytonaSandboxWrapper> = new Map();

  async create(config: SandboxConfig): Promise<Sandbox> {
    // Stub: Generate a fake ID
    const id = `daytona-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const sandbox = new DaytonaSandboxWrapper(id, config);
    this.activeSandboxes.set(id, sandbox);

    console.warn(
      'Daytona provider is not yet fully implemented. ' +
        'Please use E2B provider for production use.'
    );

    return sandbox;
  }

  async get(id: string): Promise<Sandbox | null> {
    return this.activeSandboxes.get(id) ?? null;
  }

  async list(): Promise<Sandbox[]> {
    return Array.from(this.activeSandboxes.values());
  }

  async destroy(id: string): Promise<void> {
    const sandbox = this.activeSandboxes.get(id);
    if (sandbox) {
      await sandbox.destroy();
      this.activeSandboxes.delete(id);
    }
  }
}

/**
 * Default Daytona provider instance.
 */
export const daytonaProvider = new DaytonaProvider();
