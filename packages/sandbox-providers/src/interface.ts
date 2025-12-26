/**
 * Sandbox Provider Interface
 * ==========================
 *
 * Common interface for cloud sandbox providers.
 * Supports E2B, Daytona, Cloudflare, and other sandbox environments.
 */

// ============================================================================
// Sandbox Types (local definitions to avoid circular dependencies)
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

  /**
   * Get the public host/URL for a port exposed in the sandbox.
   * Use this to access web servers running inside the sandbox.
   * 
   * @param port - The port number to get the host for
   * @returns The public host address (e.g., "abc123-3000.e2b.dev")
   */
  getHost(port: number): string;

  /**
   * Check if the sandbox is still running/alive.
   * 
   * @returns True if sandbox is running, false otherwise
   */
  isRunning(): Promise<boolean>;

  /**
   * Extend the sandbox timeout.
   * 
   * @param timeoutMs - New timeout in milliseconds from now
   */
  setTimeout(timeoutMs: number): Promise<void>;
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
// Provider Interface
// ============================================================================

/**
 * Sandbox provider interface.
 * Implement this interface to add support for new sandbox providers.
 */
export interface SandboxProvider {
  /** Provider name identifier */
  name: string;

  /**
   * Create a new sandbox instance.
   *
   * @param config - Sandbox configuration
   * @returns The created sandbox
   */
  create(config: SandboxConfig): Promise<Sandbox>;

  /**
   * Get an existing sandbox by ID.
   *
   * @param id - Sandbox ID
   * @returns The sandbox if found, null otherwise
   */
  get(id: string): Promise<Sandbox | null>;

  /**
   * List all active sandboxes.
   * Note: Not all providers support this operation.
   *
   * @returns Array of active sandboxes
   */
  list(): Promise<Sandbox[]>;

  /**
   * Destroy a sandbox by ID.
   *
   * @param id - Sandbox ID
   */
  destroy(id: string): Promise<void>;
}

/**
 * Provider registry type.
 */
export type ProviderRegistry = Record<string, SandboxProvider>;

/**
 * Default provider registry.
 */
const providers: ProviderRegistry = {};

/**
 * Register a sandbox provider.
 *
 * @param provider - The provider to register
 */
export function registerProvider(provider: SandboxProvider): void {
  providers[provider.name] = provider;
}

/**
 * Get a registered provider by name.
 *
 * @param name - Provider name
 * @returns The provider if found
 * @throws Error if provider is not registered
 */
export function getProvider(name: string): SandboxProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(
      `Sandbox provider '${name}' is not registered. ` +
        `Available providers: ${Object.keys(providers).join(', ') || 'none'}`
    );
  }
  return provider;
}

/**
 * List all registered providers.
 *
 * @returns Array of provider names
 */
export function listProviders(): string[] {
  return Object.keys(providers);
}

/**
 * Create a sandbox using a registered provider.
 *
 * @param providerName - Name of the provider to use
 * @param config - Sandbox configuration
 * @returns The created sandbox
 */
export async function createSandbox(
  providerName: string,
  config: SandboxConfig
): Promise<Sandbox> {
  const provider = getProvider(providerName);
  return provider.create(config);
}

/**
 * Get a sandbox from any registered provider.
 *
 * @param id - Sandbox ID (may include provider prefix like 'e2b:sandbox-id')
 * @returns The sandbox if found
 */
export async function getSandbox(id: string): Promise<Sandbox | null> {
  // Check if ID includes provider prefix
  const colonIndex = id.indexOf(':');
  if (colonIndex > 0) {
    const providerName = id.slice(0, colonIndex);
    const sandboxId = id.slice(colonIndex + 1);
    const provider = getProvider(providerName);
    return provider.get(sandboxId);
  }

  // Try all providers
  for (const provider of Object.values(providers)) {
    const sandbox = await provider.get(id);
    if (sandbox) {
      return sandbox;
    }
  }

  return null;
}
