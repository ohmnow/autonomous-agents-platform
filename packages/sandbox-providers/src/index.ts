/**
 * Sandbox Providers Package
 * =========================
 *
 * Unified interface for cloud sandbox providers.
 *
 * @packageDocumentation
 */

// Interface and utilities
export type {
  SandboxProvider,
  ProviderRegistry,
  Sandbox,
  SandboxConfig,
  AgentOutput,
  ExecResult,
} from './interface.js';

export {
  registerProvider,
  getProvider,
  listProviders,
  createSandbox,
  getSandbox,
} from './interface.js';

// Providers
export { E2BProvider, e2bProvider } from './e2b.js';
export { DaytonaProvider, daytonaProvider } from './daytona.js';

// Auto-register default providers
import { registerProvider } from './interface.js';
import { e2bProvider } from './e2b.js';
import { daytonaProvider } from './daytona.js';

// Register providers on module load
registerProvider(e2bProvider);
registerProvider(daytonaProvider);
